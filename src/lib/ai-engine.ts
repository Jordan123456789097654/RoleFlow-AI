import { Artifact, Attachment, EffortLevel, GeneratedFile, Message, MessageMeta, ModelId } from "@/types";
import { extractFileBlocks, renderGeneratedFile } from "@/lib/files";
import { DEFAULT_MODEL, getModelSpec, resolveModelId } from "@/lib/models";
import { buildSystemPrompt } from "@/lib/prompts";
import { IMAGE_UPLOADS_ENABLED } from "@/lib/features";
import {
  classifyGroqError,
  getKeyOrder,
  getKeyPoolStatus,
  reportKeyFailure,
  reportKeySuccess,
} from "@/lib/groq-keys";

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

function envNumber(name: string, fallback: number): number {
  const value = Number(process.env[name]);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

/**
 * Tokens the prompt may use: system prompt, earlier turns, and summary. The system prompt alone
 * is about 2,100 tokens, so the budget must leave room for history. Groq's free tier allows
 * 8,000 tokens per minute, and the budget plus the output cap stays under that. Raise both
 * with GROQ_PROMPT_TOKEN_BUDGET and GROQ_MAX_OUTPUT_TOKENS on a higher tier.
 */
const PROMPT_TOKEN_BUDGET = envNumber("GROQ_PROMPT_TOKEN_BUDGET", 4500);
/** Output cap per reply. Reasoning tokens count against it, so it must stay above the tier caps. */
const OUTPUT_TOKEN_CAP = envNumber("GROQ_MAX_OUTPUT_TOKENS", 3072);
const REQUEST_TIMEOUT_MS = envNumber("GROQ_REQUEST_TIMEOUT_MS", 90_000);
/** Rough English-and-code estimate. The old 2.2 figure overcounted by about 40% and starved history. */
const CHARS_PER_TOKEN = 3.2;
/** Most recent messages considered before the budget trims further. */
const RECENT_MESSAGE_COUNT = 12;
const OLD_USER_CHARS = 3000;
const OLD_ASSISTANT_CHARS = 1200;

/**
 * Optional second Groq model. Used only when every key fails on the primary model and the
 * request has no images (the vision model has no text fallback).
 */
export function getFallbackBackend(primary: string): string | null {
  const fallback = process.env.GROQ_FALLBACK_MODEL?.trim();
  if (fallback && fallback !== primary) return fallback;
  if (primary === "openai/gpt-oss-120b") return "openai/gpt-oss-20b";
  return null;
}

interface GenerateParams {
  messages: Message[];
  model: ModelId;
  effort: EffortLevel;
  customInstructions?: string;
  projectInstructions?: string;
  memories?: string[];
  userName?: string;
  userEmail?: string;
  /** When set, the reply is streamed from Groq and each new visible piece of text is passed here. */
  onDelta?: (text: string) => void;
  /** Summary of earlier turns of a long chat, added to the system prompt. */
  conversationSummary?: string;
}

interface GroqUsage {
  prompt_tokens?: number;
  completion_tokens?: number;
  total_tokens?: number;
}

function buildMeta(model: string, usage: GroqUsage | null, elapsedMs: number, usedFallback: boolean): MessageMeta {
  const completionTokens = usage?.completion_tokens;
  const seconds = elapsedMs / 1000;
  return {
    model,
    promptTokens: usage?.prompt_tokens,
    completionTokens,
    totalTokens: usage?.total_tokens,
    latencyMs: Math.round(elapsedMs),
    tokensPerSecond:
      typeof completionTokens === "number" && seconds > 0 ? Math.round((completionTokens / seconds) * 10) / 10 : undefined,
    usedFallback: usedFallback || undefined,
  };
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
  meta?: MessageMeta;
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

interface StreamResult {
  text: string;
  finishReason: string | null;
  usage: GroqUsage | null;
  /** True when the connection dropped before the stream finished. */
  interrupted: boolean;
}

/**
 * Reads a Groq server-sent event stream. Emits only new visible text through onDelta. A dropped
 * connection is reported in the result rather than thrown, so the caller can keep partial text.
 */
async function readGroqStream(
  body: ReadableStream<Uint8Array>,
  onDelta: (text: string) => void
): Promise<StreamResult> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let text = "";
  let emitted = "";
  let finishReason: string | null = null;
  let usage: GroqUsage | null = null;
  let interrupted = false;

  try {
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
          const reported = json.usage ?? json.x_groq?.usage;
          if (reported) usage = reported;
        } catch {
          // Ignore a malformed event and keep reading.
        }
      }
    }
  } catch (err) {
    interrupted = true;
    console.warn("Groq stream interrupted:", err);
  }

  return { text, finishReason, usage, interrupted };
}

/** Rough token count. Images are counted as a fixed 1,000 tokens. */
function estimateTokens(content: string | ContentPart[] | undefined): number {
  if (!content) return 0;
  if (typeof content === "string") return Math.ceil(content.length / CHARS_PER_TOKEN);
  if (Array.isArray(content)) {
    return content.reduce((sum, part) => {
      if (part.type === "text") return sum + Math.ceil((part.text || "").length / CHARS_PER_TOKEN);
      if (part.type === "image_url") return sum + 1000;
      return sum;
    }, 0);
  }
  return 0;
}

/**
 * Keeps the system prompt and as much recent history as fits the budget. The newest message is
 * never dropped. Older turns are clipped first, then removed from the oldest end. The result
 * says how many earlier turns were removed, so the caller can tell the model.
 */
function pruneMessagesForTokenLimit(
  messages: ModelMessage[],
  maxPromptTokens: number
): { messages: ModelMessage[]; droppedTurns: number } {
  const [systemMsg, ...rest] = messages;
  if (!systemMsg) return { messages, droppedTurns: 0 };

  const recent = rest.slice(-RECENT_MESSAGE_COUNT);
  const clipped: ModelMessage[] = recent.map((m, idx) => {
    if (idx === recent.length - 1 || typeof m.content !== "string") return m;
    const maxLen = m.role === "assistant" ? OLD_ASSISTANT_CHARS : OLD_USER_CHARS;
    if (m.content.length <= maxLen) return m;
    return {
      ...m,
      content: `${m.content.slice(0, maxLen)}\n\n[...earlier text truncated to fit the context window...]`,
    };
  });

  const result = [...clipped];
  let total = estimateTokens(systemMsg.content) + result.reduce((s, m) => s + estimateTokens(m.content), 0);
  while (total > maxPromptTokens && result.length > 1) {
    const dropped = result.shift();
    if (dropped) total -= estimateTokens(dropped.content);
  }

  return { messages: [systemMsg, ...result], droppedTurns: rest.length - result.length };
}

type RunOutcome<T> =
  | { status: "ok"; value: T }
  | { status: "safety"; body: string; httpStatus: number }
  | { status: "exhausted" };

/**
 * Sends one request to Groq, trying each key in pool order until one returns a usable result.
 * Failed keys go on cooldown, so later requests skip them. A request-level error (400, 404, 422)
 * stops the loop, since other keys would fail the same way. The handler returns null when the
 * response has no usable content, which moves on to the next key.
 */
async function runWithKeys<T>(
  model: string,
  payload: unknown,
  handle: (res: Response) => Promise<T | null>
): Promise<RunOutcome<T>> {
  for (const state of getKeyOrder()) {
    let res: Response;
    try {
      res = await fetch(GROQ_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${state.key}` },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
    } catch (err) {
      console.warn(`Groq network error: model=${model} key=${state.label}`, err);
      reportKeyFailure(state, "server");
      continue;
    }

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.error(`Groq request failed: model=${model} key=${state.label} status=${res.status} body=${body.slice(0, 500)}`);
      // A safety rejection applies to the content, not the key, so stop trying other keys.
      if (isUpstreamSafetyBlock(res.status, body)) {
        return { status: "safety", body, httpStatus: res.status };
      }
      const failure = classifyGroqError(res.status, body, res.headers.get("retry-after"));
      if (!failure) return { status: "exhausted" };
      reportKeyFailure(state, failure.kind, failure.retryAfterMs);
      continue;
    }

    try {
      const value = await handle(res);
      if (value !== null) {
        reportKeySuccess(state);
        return { status: "ok", value };
      }
    } catch (err) {
      console.warn(`Groq response unreadable: model=${model} key=${state.label}`, err);
      reportKeyFailure(state, "server");
    }
  }
  return { status: "exhausted" };
}

interface UpstreamReply {
  text: string;
  finishReason: string | null;
  usage: GroqUsage | null;
  interrupted: boolean;
}

/**
 * Turns a raw model reply into the chat result: strips memory tags, extracts generated files and
 * the first code block as an artifact.
 */
async function finishReply(
  reply: UpstreamReply,
  modelName: string,
  thinkingTime: number,
  usedFallback: boolean,
  startTime: number
): Promise<GenerateResult> {
  const memoriesAdded: string[] = [];
  const memoriesRemoved: string[] = [];

  let cleanedText = reply.text.replace(/<memory action="add">([\s\S]*?)<\/memory>/gi, (_: string, mem: string) => {
    const trimmed = mem.trim();
    if (trimmed) memoriesAdded.push(trimmed);
    return "";
  });

  cleanedText = cleanedText.replace(/<memory action="remove"[^>]*>([\s\S]*?)<\/memory>/gi, (_: string, mem: string) => {
    const trimmed = mem.trim();
    if (trimmed) memoriesRemoved.push(trimmed);
    return "";
  });

  cleanedText = cleanedText.trim();
  if (reply.interrupted) {
    cleanedText += "\n\n[The reply was cut off because the connection to the model was interrupted. Ask me to continue.]";
  }

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
    meta: buildMeta(modelName, reply.usage, Date.now() - startTime, usedFallback),
    artifact: generatedArtifact,
    memoriesAdded: memoriesAdded.length > 0 ? memoriesAdded : undefined,
    memoriesRemoved: memoriesRemoved.length > 0 ? memoriesRemoved : undefined,
    generatedFiles: generatedFiles.length > 0 ? generatedFiles : undefined,
  };
}

export async function generateRoleFlowResponse({
  messages,
  model,
  effort,
  customInstructions,
  projectInstructions,
  memories,
  userName,
  userEmail,
  onDelta,
  conversationSummary,
}: GenerateParams): Promise<GenerateResult> {
  const startTime = Date.now();
  const latestMessage = messages[messages.length - 1];
  const prompt = latestMessage?.content?.trim() || "";

  const spec = getModelSpec(resolveModelId(model) ?? DEFAULT_MODEL);

  // Check if user is explicitly asking about assistant identity or founder
  const identityRegex = /^(?:who\s+(?:are\s+you|built\s+you|made\s+you|created\s+you|founded\s+you|founded\s+roleflow|made\s+roleflow|created\s+roleflow)|what\s+model\s+are\s+you|who\s+is\s+jordan\s+daniels)[\s?.!]*$/i;
  const isAskingIdentity = identityRegex.test(prompt);

  if (isAskingIdentity) {
    if (/jordan\s+daniels/i.test(prompt)) {
      return {
        content: `Jordan Daniels is the founder and creator of RoleFlow. He created and built RoleFlow as an accessible, high-performance frontier AI platform featuring multi-tier intelligence (Apex 1.0, Omni 1.0, Genesis 1.5, Flash 2.0), real-time web search grounding, and deep document analysis.`,
        thinkingTime: 0.8,
      };
    }
    return {
      content: `I'm RoleFlow, an AI assistant created and founded by Jordan Daniels. This version is ${spec.name}, ${spec.identity}. Jordan built RoleFlow to be a helpful, powerful, and honest AI platform for software engineering, deep analysis, and writing.`,
      thinkingTime: 0.8,
    };
  }

  const fallbackResult = (): GenerateResult => {
    // Fallback when Groq is unavailable or unconfigured. This must not look like a real answer.
    return {
      content: `RoleFlow couldn't get a response from its model just now. Please try again in a moment.`,
      thinkingTime: Math.max(0.6, Number(((Date.now() - startTime) / 1000).toFixed(1))),
      isFallback: true,
    };
  };

  if (getKeyPoolStatus().total === 0) {
    console.error("No usable Groq key: GROQ_API_KEYS is unset, or no key starts with 'gsk_'.");
    return fallbackResult();
  }

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
    userName,
    userEmail,
  });

  const systemWithSummary = conversationSummary
    ? `${systemPrompt}\n\n<earlier_conversation_summary>\nThe earlier part of this conversation was condensed to save context. Treat this summary as what was said before, and do not repeat it back unless asked.\n\n${conversationSummary}\n</earlier_conversation_summary>`
    : systemPrompt;

  const pruned = pruneMessagesForTokenLimit(
    [{ role: "system", content: systemWithSummary }, ...modelMessages],
    PROMPT_TOKEN_BUDGET
  );
  const systemContent =
    pruned.droppedTurns > 0
      ? `${systemWithSummary}\n\n<context_note>Some earlier messages in this conversation were left out to fit the context window. If the user refers to something you cannot see, say so and ask them to restate it. Do not guess what it said.</context_note>`
      : systemWithSummary;
  const safeMessages: ModelMessage[] = [{ ...pruned.messages[0], content: systemContent }, ...pruned.messages.slice(1)];

  const maxTokens = Math.min(sampling.maxTokens[effort] ?? 1024, OUTPUT_TOKEN_CAP);

  // The primary model is tried with every key first. The fallback model, if configured, is tried next.
  const fallbackBackend = hasImages ? null : getFallbackBackend(backendModel);
  const backendsToTry = fallbackBackend ? [backendModel, fallbackBackend] : [backendModel];

  for (let modelIndex = 0; modelIndex < backendsToTry.length; modelIndex++) {
    const modelName = backendsToTry[modelIndex];
    const payload = {
      model: modelName,
      messages: safeMessages,
      temperature: sampling.temperature[effort],
      ...(sampling.topP !== undefined ? { top_p: sampling.topP } : {}),
      max_tokens: maxTokens,
      ...(!hasImages
        ? { reasoning_effort: effort === "low" ? "low" : sampling.reasoningEffort || "low" }
        : {}),
      ...(onDelta ? { stream: true, stream_options: { include_usage: true } } : {}),
    };

    const outcome = await runWithKeys<UpstreamReply>(modelName, payload, async (res) => {
      let reply: UpstreamReply;
      if (onDelta && res.body) {
        const streamed = await readGroqStream(res.body, onDelta);
        // Nothing was shown yet, so a dropped connection can safely retry on another key.
        if (!streamed.text && streamed.interrupted) return null;
        reply = {
          text: streamed.text,
          finishReason: streamed.finishReason,
          usage: streamed.usage,
          interrupted: streamed.interrupted,
        };
      } else {
        const data = await res.json();
        const choice = data.choices?.[0];
        reply = {
          text: choice?.message?.content || "",
          finishReason: choice?.finish_reason ?? null,
          usage: data.usage ?? null,
          interrupted: false,
        };
      }
      if (reply.finishReason !== "content_filter" && !reply.text) return null;
      return reply;
    });

    const thinkingTime = Math.max(0.8, Number(((Date.now() - startTime) / 1000).toFixed(1)));

    if (outcome.status === "safety") {
      return {
        content: "",
        thinkingTime,
        isSafetyRefusal: true,
        safetyReason: "upstream_content_policy",
      };
    }

    if (outcome.status === "ok") {
      // Groq reports a filtered generation as finish_reason "content_filter" on a 200 response.
      if (outcome.value.finishReason === "content_filter") {
        return { content: "", thinkingTime, isSafetyRefusal: true, safetyReason: "upstream_content_filter" };
      }
      return finishReply(outcome.value, modelName, thinkingTime, modelIndex > 0, startTime);
    }
    // Every key failed on this model. Move on to the fallback model if one is configured.
  }

  console.error(`All Groq keys failed on ${backendsToTry.join(", ")}. See the preceding 'Groq request failed' entries.`);
  return fallbackResult();
}

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
  const outcome = await runWithKeys<string>(
    opts.model,
    {
      model: opts.model,
      messages: opts.messages,
      temperature: opts.temperature ?? 0,
      max_tokens: opts.maxTokens ?? 512,
      ...(opts.reasoningEffort ? { reasoning_effort: opts.reasoningEffort } : {}),
    },
    async (res) => {
      const data = await res.json();
      const text: string = data.choices?.[0]?.message?.content ?? "";
      // Reasoning models can emit <think> blocks. Strip them so callers parse only the answer.
      return text.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();
    }
  );
  return outcome.status === "ok" ? outcome.value || null : null;
}
