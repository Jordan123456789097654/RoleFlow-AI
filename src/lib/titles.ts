import { groqChatCompletion } from "@/lib/ai-engine";
import { getModelSpec } from "@/lib/models";

const TITLE_SYSTEM_PROMPT = [
  "You write short titles for chat conversations.",
  "Read the user's first message and reply with a title of 2 to 6 words that names its topic.",
  "Use Title Case. Do not use quotes, markdown, emoji, a prefix such as 'Title:', or trailing punctuation.",
  "Reply with the title only.",
  "If the message is only a greeting, a test, or unclear, reply with: New Conversation",
].join(" ");

const FALLBACK_TITLE = "New Conversation";
const MAX_FALLBACK_CHARS = 36;

/** Used when the model call fails or returns nothing usable: the message itself, trimmed. */
export function fallbackTitle(message: string): string {
  const flat = message.replace(/\s+/g, " ").trim();
  if (!flat) return FALLBACK_TITLE;
  return flat.length > MAX_FALLBACK_CHARS
    ? flat.slice(0, MAX_FALLBACK_CHARS).trimEnd() + "..."
    : flat;
}

/** Cleans the model's reply. Returns null if the reply is not a plausible short title. */
export function sanitizeTitle(raw: string | null): string | null {
  if (!raw) return null;
  let title = raw.split("\n")[0].trim();
  title = title
    .replace(/^title\s*:\s*/i, "")
    .replace(/^["'`*#\s]+|["'`*\s]+$/g, "")
    .replace(/[.!?:;,]+$/, "")
    .trim();
  if (!title) return null;
  const words = title.split(/\s+/);
  if (words.length > 8 || title.length > 60) return null;
  return title;
}

/**
 * Writes a short title for a new chat from its first message. Uses the fast tier with low
 * reasoning effort. Never rejects: a failure returns a trimmed copy of the message.
 */
export async function generateChatTitle(firstUserMessage: string): Promise<string> {
  const input = firstUserMessage.replace(/\s+/g, " ").trim().slice(0, 1000);
  if (!input) return FALLBACK_TITLE;
  try {
    const raw = await groqChatCompletion({
      model: getModelSpec("roleflow-flash-2").backend,
      messages: [
        { role: "system", content: TITLE_SYSTEM_PROMPT },
        { role: "user", content: input },
      ],
      temperature: 0.3,
      maxTokens: 256,
      reasoningEffort: "low",
    });
    return sanitizeTitle(raw) ?? fallbackTitle(input);
  } catch {
    return fallbackTitle(input);
  }
}
