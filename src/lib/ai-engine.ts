import { Artifact, Attachment, EffortLevel, GeneratedFile, Message, ModelId } from "@/types";
import { extractFileBlocks, renderGeneratedFile } from "@/lib/files";
import { DEFAULT_MODEL, getModelSpec, resolveModelId } from "@/lib/models";
import { buildSystemPrompt } from "@/lib/prompts";
import { IMAGE_UPLOADS_ENABLED } from "@/lib/features";

interface GenerateParams {
  messages: Message[];
  model: ModelId;
  effort: EffortLevel;
  customInstructions?: string;
  projectInstructions?: string;
  memories?: string[];
  /** When set, the reply is streamed from Groq and each new visible piece of text is passed here. */
  onDelta?: (text: string) => void;
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

/**
 * Removes memory tags from streamed text so users never see them, including a tag that is
 * still arriving. The final reply is cleaned again after the stream ends.
 */
export function visibleStreamText(raw: string): string {
  return raw
    .replace(/<memory[\s\S]*?<\/memory>/gi, "")
    .replace(/<memory[\s\S]*$/i, "")
    .replace(/<(m|me|mem|memo|memor|memory)?$/i, "");
}

/**
 * Reads a Groq server-sent event stream. Emits only new visible text through onDelta and
 * returns the full raw text plus the final finish_reason.
 */
async function readGroqStream(
  body: ReadableStream<Uint8Array>,
  onDelta: (text: string) => void
): Promise<{ text: string; finishReason: string | null }> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let text = "";
  let emitted = "";
  let finishReason: string | null = null;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    let newline = buffer.indexOf("\n");
    while (newline !== -1) {
      const line = buffer.slice(0, newline).trim();
      buffer = buffer.slice(newline + 1);
      newline = buffer.indexOf("\n");
      if (!line.startsWith("data:")) continue;
      const payload = line.slice(5).trim();
      if (!payload || payload === "[DONE]") continue;
      try {
        const json = JSON.parse(payload);
        const choice = json.choices?.[0];
        const piece = choice?.delta?.content;
        if (typeof piece === "string" && piece) {
          text += piece;
          const visible = visibleStreamText(text);
          if (visible.length > emitted.length && visible.startsWith(emitted)) {
            const fresh = visible.slice(emitted.length);
            emitted = visible;
            onDelta(fresh);
          }
        }
        if (choice?.finish_reason) finishReason = choice.finish_reason;
      } catch {
        // Ignore a malformed event and keep reading.
      }
    }
  }

  return { text, finishReason };
}

export async function generateRoleFlowResponse({
  messages,
  model,
  effort,
  customInstructions,
  projectInstructions,
  memories,
  onDelta,
}: GenerateParams): Promise<GenerateResult> {
  const startTime = Date.now();
  const latestMessage = messages[messages.length - 1];
  const prompt = latestMessage?.content?.trim() || "";

  const spec = getModelSpec(resolveModelId(model) ?? DEFAULT_MODEL);

  // Check if user is explicitly asking about assistant identity
  const identityRegex = /^(?:who\s+(?:are\s+you|built\s+you|made\s+you|created\s+you)|what\s+model\s+are\s+you)[\s?.!]*$/i;
  const isAskingIdentity = identityRegex.test(prompt);

  if (isAskingIdentity) {
    return {
      content: `I'm RoleFlow, an AI assistant made by RoleFlow. This version is ${spec.name}, ${spec.identity}. RoleFlow built me to be helpful, honest, and careful about avoiding harm.`,
      thinkingTime: 0.8,
    };
  }

  // Multi-Key Groq Pool with Automatic Failover
  const keyPool = getGroqKeyPool();
  if (keyPool.length > 0) {
    // Attachments are folded into the messages here. Turns with images need a vision model.
    const { messages: modelMessages, hasImages } = buildModelMessages(messages);
    // Image turns go to the vision model with Genesis sampling, since tier-specific
    // gpt-oss parameters do not apply to a vision model.
    const backendModel = hasImages ? VISION_MODEL : spec.backend;
    const sampling = hasImages ? getModelSpec("roleflow-genesis-1") : spec;

    const systemPrompt = buildSystemPrompt(spec, {
      effort,
      customInstructions,
      projectInstructions,
      memories,
    });

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
            temperature: sampling.temperature[effort],
            ...(sampling.topP !== undefined ? { top_p: sampling.topP } : {}),
            max_tokens: sampling.maxTokens[effort],
            ...(!hasImages && sampling.reasoningEffort
              ? { reasoning_effort: sampling.reasoningEffort }
              : {}),
            ...(onDelta ? { stream: true } : {}),
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

          let serverText = "";
          let finishReason: string | null = null;
          if (onDelta && res.body) {
            const streamed = await readGroqStream(res.body, onDelta);
            serverText = streamed.text;
            finishReason = streamed.finishReason;
          } else {
            const data = await res.json();
            const choice = data.choices?.[0];
            serverText = choice?.message?.content || "";
            finishReason = choice?.finish_reason ?? null;
          }
          const thinkingTime = Math.max(
            0.8,
            Number(((Date.now() - startTime) / 1000).toFixed(1))
          );

          // Groq reports a filtered generation as finish_reason "content_filter" on a 200 response.
          if (finishReason === "content_filter") {
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
 * Vision model for image turns, set via GROQ_VISION_MODEL, defaulting to Qwen 3.8 27B multimodal on Groq.
 */
export const VISION_MODEL: string = process.env.GROQ_VISION_MODEL || "qwen/qwen3.8-27b";

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
    const userPrompt = m.content?.trim();
    let text = [userPrompt, ...textBlocks].filter(Boolean).join("\n\n");
    if (!userPrompt && textBlocks.length > 0) {
      text = `Please examine and analyze the following attached file(s):\n\n${textBlocks.join("\n\n")}`;
    }

    if (images.length === 0 || idx !== lastUserIndex || !VISION_MODEL || !IMAGE_UPLOADS_ENABLED) {
      const note =
        images.length === 0
          ? ""
          : idx !== lastUserIndex
            ? `\n\n[Images attached earlier: ${images.map((i) => i.name).join(", ")}]`
            : !IMAGE_UPLOADS_ENABLED
              ? `\n\n[Image attached: ${images.map((i) => i.name).join(", ")}. Image uploads are currently paused, so the image content was not read.]`
              : `\n\n[Image attached: ${images.map((i) => i.name).join(", ")}. This server has no vision model configured, so the image content could not be read.]`;
      return { role: "user", content: text + note };
    }

    hasImages = true;
    const parts: ContentPart[] = [
      { type: "text", text: text || "Please examine, describe, and analyze the attached image(s)." },
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
  reasoningEffort?: "low" | "medium" | "high";
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
          ...(opts.reasoningEffort ? { reasoning_effort: opts.reasoningEffort } : {}),
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
