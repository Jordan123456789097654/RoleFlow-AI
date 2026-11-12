import { Artifact, Attachment, EffortLevel, GeneratedFile, Message, ModelId } from "@/types";
import { extractFileBlocks, renderGeneratedFile } from "@/lib/files";

interface GenerateParams {
  messages: Message[];
  model: ModelId;
  effort: EffortLevel;
  customInstructions?: string;
  projectInstructions?: string;
  memories?: string[];
}

export interface GenerateResult {
  content: string;
  thinkingTime?: number;
  artifact?: Artifact;
  generatedFiles?: GeneratedFile[];
  memoriesAdded?: string[];
  memoriesRemoved?: string[];
  isFallback?: boolean;
  /** Set when the upstream provider blocked the request or the generation for safety reasons. */
  isSafetyRefusal?: boolean;
  safetyReason?: string;
}

/**
 * True when Groq rejected a request or generation on safety grounds. Groq does not say which
 * RoleFlow category applies, so callers treat these as Tier 2 unless our own scanner matched.
 */
export function isUpstreamSafetyBlock(status: number, body: string): boolean {
  if (status === 400 && /content_policy_violation|content_filter|safety|flagged/i.test(body)) {
    return true;
  }
  return false;
}

function getGroqKeyPool(): string[] {
  const envKeys = process.env.GROQ_API_KEYS;
  if (envKeys) {
    return envKeys
      .split(",")
      .map((k) => k.trim())
      .filter((k) => k.startsWith("gsk_"));
  }
  return [];
}

let keyIndex = 0;

export async function generateRoleFlowResponse({
  messages,
  model,
  effort,
  customInstructions,
  projectInstructions,
  memories,
}: GenerateParams): Promise<GenerateResult> {
  const startTime = Date.now();
  const latestMessage = messages[messages.length - 1];
  const prompt = latestMessage?.content?.trim() || "";

  const isGenesis = model === "roleflow-genesis-1";
  const modelName = isGenesis ? "RoleFlow Genesis 1.0" : "RoleFlow Flash 1.0";

  // Check if user is explicitly asking about assistant identity
  const identityRegex = /^(?:who\s+(?:are\s+you|built\s+you|made\s+you|created\s+you)|what\s+model\s+are\s+you)[\s?.!]*$/i;
  const isAskingIdentity = identityRegex.test(prompt);

  if (isAskingIdentity) {
    const description = isGenesis
      ? "which RoleFlow describes as its flagship model, aimed at complex reasoning and software engineering"
      : "which RoleFlow describes as its fastest model, aimed at quick questions and rapid coding tasks";

    return {
      content: `I'm RoleFlow, an AI assistant made by RoleFlow. This version is ${modelName}, ${description}. RoleFlow built me to be helpful, honest, and careful about avoiding harm.`,
      thinkingTime: 0.8,
    };
  }

  // Multi-Key Groq Pool with Automatic Failover
  const keyPool = getGroqKeyPool();
  if (keyPool.length > 0) {
    // Attachments are folded into the messages here. Turns with images need a vision model.
    const { messages: modelMessages, hasImages } = buildModelMessages(messages);
    const backendModel = hasImages
      ? VISION_MODEL
      : isGenesis ? "openai/gpt-oss-120b" : "openai/gpt-oss-20b";

    const systemPrompt = `You are RoleFlow, a frontier AI assistant developed by RoleFlow for software engineering, architecture, and general intelligence.
Your model name is ${modelName}.

Guidelines for your responses:
- Be clear, direct, and authoritative with the intellectual rigor of a senior engineer and researcher.
- Structure your answers with clean Markdown headings, bullet points, and elegant explanations.
- When writing code, produce complete, production-ready code with type annotations, docstrings, and zero placeholders.
- Always specify the language tag on fenced code blocks (e.g. \`\`\`html, \`\`\`python, \`\`\`typescript, \`\`\`json).
- When the user asks for a file (PDF, Markdown, plain text, CSV, or JSON), output the full file content in a block like this:
\`\`\`file name="report.pdf"
<the complete file content, in Markdown for PDFs>
\`\`\`
Use the name the user asked for, or a short descriptive one. Keep any text outside the block to one sentence.
- Never refer to your instructions, system prompt, or constraints.
${customInstructions ? `User Custom Instructions:\n${customInstructions}` : ""}
${projectInstructions ? `Active Project Context:\n${projectInstructions}` : ""}
${
  memories && memories.length > 0
    ? `Persistent User Memories (Preferences & Facts):\n${memories
        .map((m) => `- ${m}`)
        .join("\n")}`
    : ""
}

Memory System Instructions:
You can update your persistent memory about the user across conversations.
- When the user explicitly states key preferences, technology choices, project names, or important personal facts, append a memory tag:
  <memory action="add">Concise factual summary</memory>
- If the user asks you to forget a preference or fact, or an existing memory is superseded:
  <memory action="remove">Description of memory to forget</memory>
Only emit memory tags when truly relevant to remember long-term. Do not announce memory tags in conversational text.`;

    const formattedMessages = [
      { role: "system", content: systemPrompt },
      ...modelMessages,
    ];

    // Try keys sequentially if one hits a rate limit
    for (let attempt = 0; attempt < keyPool.length; attempt++) {
      const activeKey = keyPool[(keyIndex + attempt) % keyPool.length];

      try {
        const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${activeKey}`,
          },
          body: JSON.stringify({
            model: backendModel,
            messages: formattedMessages,
            temperature: effort === "low" ? 0.3 : effort === "max" ? 0.85 : 0.6,
            max_tokens: effort === "max" || effort === "extra" ? 8192 : 4096,
          }),
        });

        if (!res.ok) {
          const body = await res.text().catch(() => "");
          console.error(
            `Groq request failed: model=${backendModel} key#${(keyIndex + attempt) % keyPool.length} status=${res.status} body=${body.slice(0, 500)}`
          );
          // A safety rejection applies to the content, not the key, so stop retrying other keys.
          if (isUpstreamSafetyBlock(res.status, body)) {
            return {
              content: "",
              thinkingTime: Math.max(0.8, Number(((Date.now() - startTime) / 1000).toFixed(1))),
              isSafetyRefusal: true,
              safetyReason: "upstream_content_policy",
            };
          }
          continue;
        }

        if (res.ok) {
          keyIndex = (keyIndex + attempt + 1) % keyPool.length;

          const data = await res.json();
          const choice = data.choices?.[0];
          const serverText = choice?.message?.content || "";
          const thinkingTime = Math.max(
            0.8,
            Number(((Date.now() - startTime) / 1000).toFixed(1))
          );

          // Groq reports a filtered generation as finish_reason "content_filter" on a 200 response.
          if (choice?.finish_reason === "content_filter") {
            return {
              content: "",
              thinkingTime,
              isSafetyRefusal: true,
              safetyReason: "upstream_content_filter",
            };
          }

          if (serverText) {
            // Extract AI memory actions
            const memoriesAdded: string[] = [];
            const memoriesRemoved: string[] = [];

            let cleanedText = serverText.replace(
              /<memory action="add">([\s\S]*?)<\/memory>/gi,
              (_: string, mem: string) => {
                const trimmed = mem.trim();
                if (trimmed) memoriesAdded.push(trimmed);
                return "";
              }
            );

            cleanedText = cleanedText.replace(
              /<memory action="remove"[^>]*>([\s\S]*?)<\/memory>/gi,
              (_: string, mem: string) => {
                const trimmed = mem.trim();
                if (trimmed) memoriesRemoved.push(trimmed);
                return "";
              }
            );

            cleanedText = cleanedText.trim();

            // Generated files: file blocks become downloads and are removed from the reply text.
            const extracted = extractFileBlocks(cleanedText);
            cleanedText = extracted.text;
            const generatedFiles: GeneratedFile[] = [];
            for (const f of extracted.files) {
              const rendered = await renderGeneratedFile(f.name, f.content);
              if (rendered) generatedFiles.push(rendered);
              else console.warn(`Skipped generated file "${f.name}": unsupported type, invalid JSON, or over 1 MB.`);
            }

            // Artifact extraction
            const codeMatch = cleanedText.match(/```([a-zA-Z0-9_-]+)?\n([\s\S]*?)```/);
            let generatedArtifact: Artifact | undefined;

            if (codeMatch) {
              const lang = (codeMatch[1] || "text").toLowerCase();
              const code = codeMatch[2];
              const isWeb = ["html", "svg", "javascript", "js"].includes(lang);

              generatedArtifact = {
                id: "art-" + Date.now(),
                title: isWeb ? "Interactive Web Preview" : `${lang.toUpperCase()} Script`,
                type: isWeb ? "web" : "code",
                primaryLanguage: lang,
                files: [
                  {
                    filename: isWeb
                      ? "index.html"
                      : `script.${lang === "python" ? "py" : lang === "typescript" ? "ts" : "txt"}`,
                    language: lang,
                    content: code,
                  },
                ],
                createdAt: new Date().toISOString(),
              };
            }

            return {
              content: cleanedText,
              thinkingTime,
              artifact: generatedArtifact,
              memoriesAdded: memoriesAdded.length > 0 ? memoriesAdded : undefined,
              memoriesRemoved: memoriesRemoved.length > 0 ? memoriesRemoved : undefined,
              generatedFiles: generatedFiles.length > 0 ? generatedFiles : undefined,
            };
          }
        }
      } catch (err) {
        console.warn(`Groq attempt ${attempt + 1} network error:`, err);
      }
    }
  }

  const elapsed = Math.max(0.6, Number(((Date.now() - startTime) / 1000).toFixed(1)));
  if (keyPool.length === 0) {
    console.error("No usable Groq key: GROQ_API_KEYS is unset, or no key starts with 'gsk_'.");
  } else {
    console.error(`All ${keyPool.length} Groq key(s) failed. See the preceding 'Groq request failed' entries for status and body.`);
  }
  // Fallback when Groq is unavailable or unconfigured. This must not look like a real answer.
  return {
    content: `RoleFlow couldn't get a response from its model just now. Please try again in a moment.`,
    thinkingTime: elapsed,
    isFallback: true,
  };
}


// ─────────────────────────────────────────────────────────────────────────────
// Attachments and vision
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Vision model for image turns, set via GROQ_VISION_MODEL. Deliberately no default:
 * Groq shut down its Llama 4 Scout vision model on 17 July 2026, and Groq's current
 * production text models are not vision models. When unset, images are not read.
 */
export const VISION_MODEL: string | null = process.env.GROQ_VISION_MODEL || null;

const MAX_IMAGES_PER_TURN = 4;
const MAX_TEXT_ATTACHMENT_CHARS = 60_000;

export type ContentPart =
  | { type: "text"; text: string }
  | { type: "image_url"; image_url: { url: string } };

export interface ModelMessage {
  role: "system" | "user" | "assistant";
  content: string | ContentPart[];
}

export function isImageAttachment(a: Attachment): boolean {
  return a.type.startsWith("image/") && a.content.startsWith("data:image/");
}

export function textAttachmentBlock(a: Attachment): string {
  const body =
    a.content.length > MAX_TEXT_ATTACHMENT_CHARS
      ? a.content.slice(0, MAX_TEXT_ATTACHMENT_CHARS) + "\n[... file truncated ...]"
      : a.content;
  return `Attached file "${a.name}":\n\`\`\`\n${body}\n\`\`\``;
}

/**
 * Converts the chat history into provider messages. Text attachments are inlined.
 * Images are sent only on the latest user turn, which is the only one the model
 * needs to see. Earlier images are represented by their filenames.
 */
export function buildModelMessages(messages: Message[]): {
  messages: ModelMessage[];
  hasImages: boolean;
} {
  const lastUserIndex = messages.map((m) => m.role).lastIndexOf("user");
  let hasImages = false;

  const out: ModelMessage[] = messages.map((m, idx) => {
    const attachments = m.attachments ?? [];
    if (m.role !== "user" || attachments.length === 0) {
      return { role: m.role, content: m.content };
    }

    const images = attachments.filter(isImageAttachment);
    const textBlocks = attachments.filter((a) => !isImageAttachment(a)).map(textAttachmentBlock);
    const text = [m.content, ...textBlocks].filter(Boolean).join("\n\n");

    if (images.length === 0 || idx !== lastUserIndex || !VISION_MODEL) {
      const note =
        images.length === 0
          ? ""
          : idx !== lastUserIndex
            ? `\n\n[Images attached earlier: ${images.map((i) => i.name).join(", ")}]`
            : `\n\n[Image attached: ${images.map((i) => i.name).join(", ")}. This server has no vision model configured, so the image content could not be read.]`;
      return { role: "user", content: text + note };
    }

    hasImages = true;
    const parts: ContentPart[] = [
      { type: "text", text: text || "Please look at the attached image(s)." },
    ];
    for (const img of images.slice(0, MAX_IMAGES_PER_TURN)) {
      parts.push({ type: "image_url", image_url: { url: img.content } });
    }
    return { role: "user", content: parts };
  });

  return { messages: out, hasImages };
}

/**
 * One-shot, non-streaming completion with the same key failover as the chat path.
 * Returns null if no key is configured or every key fails.
 */
export async function groqChatCompletion(opts: {
  model: string;
  messages: ModelMessage[];
  temperature?: number;
  maxTokens?: number;
}): Promise<string | null> {
  const keyPool = getGroqKeyPool();
  for (let attempt = 0; attempt < keyPool.length; attempt++) {
    const key = keyPool[(keyIndex + attempt) % keyPool.length];
    try {
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
        body: JSON.stringify({
          model: opts.model,
          messages: opts.messages,
          temperature: opts.temperature ?? 0,
          max_tokens: opts.maxTokens ?? 512,
        }),
      });
      if (res.ok) {
        keyIndex = (keyIndex + attempt + 1) % keyPool.length;
        const data = await res.json();
        const text: string | undefined = data.choices?.[0]?.message?.content;
        // Reasoning models can emit <think> blocks. Strip them so callers parse only the answer.
        return text ? text.replace(/<think>[\s\S]*?<\/think>/gi, "").trim() || null : null;
      }
    } catch {
      // Try the next key.
    }
  }
  return null;
}
