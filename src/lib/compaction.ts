import { CompactionState, Message } from "@/types";
import { groqChatCompletion } from "@/lib/ai-engine";
import { getModelSpec } from "@/lib/models";

/**
 * Chat compacting. When a chat gets long, its oldest turns are condensed into a summary that
 * stays in the system prompt, and only the most recent turns are sent in full. The summary is
 * stored on the chat and extended as the chat grows, so each turn is summarized at most once.
 */

/** Chats longer than this many messages get compacted. */
export const COMPACT_TRIGGER = 24;
/** Messages at the end of the chat that always stay verbatim. */
export const KEEP_RECENT = 12;
/** A new summary is written only when at least this many older messages are not yet covered. */
const MIN_NEW_MESSAGES = 8;
const MAX_MESSAGE_CHARS = 2000;
const MAX_TRANSCRIPT_CHARS = 30000;
const MAX_SUMMARY_CHARS = 8000;

const SUMMARY_SYSTEM_PROMPT = [
  "You condense the earlier part of a conversation between a user and an AI assistant so the assistant can keep context.",
  "Write a dense summary in plain prose or short bullets, under 600 words.",
  "Keep: the user's goals, decisions made, facts and numbers given, names and identifiers, code or file names, open questions, and any constraints or preferences the user stated.",
  "Drop: pleasantries, repeated content, and long code bodies (name the file or function instead).",
  "Write in the third person. Do not address the user. Reply with the summary only.",
].join(" ");

export interface CompactResult {
  /** Messages to send, oldest first. When a summary applies, these are the turns after it. */
  history: Message[];
  /** Summary to add to the system prompt, or undefined when none applies. */
  summaryForModel?: string;
  /** Compaction state to save on the chat. */
  compaction?: CompactionState;
  /** True when this request wrote a new summary. */
  changed: boolean;
}

function clip(text: string, max: number): string {
  return text.length > max ? `${text.slice(0, max)} [...]` : text;
}

async function summarize(previous: string | undefined, chunk: Message[]): Promise<string | null> {
  const transcript = chunk
    .map((m) => `${m.role === "user" ? "User" : "Assistant"}: ${clip(m.content || "", MAX_MESSAGE_CHARS)}`)
    .join("\n\n")
    .slice(-MAX_TRANSCRIPT_CHARS);

  const userPrompt = [
    previous ? `Existing summary of even earlier messages:\n${previous}` : "",
    `Messages to fold into the summary:\n${transcript}`,
  ]
    .filter(Boolean)
    .join("\n\n");

  const summaryModel = getModelSpec("roleflow-flash-2").backend;
  const text = await groqChatCompletion({
    model: summaryModel,
    messages: [
      { role: "system", content: SUMMARY_SYSTEM_PROMPT },
      { role: "user", content: userPrompt },
    ],
    temperature: 0.2,
    maxTokens: 1500,
    reasoningEffort: "low",
  });
  const trimmed = text?.trim();
  return trimmed ? clip(trimmed, MAX_SUMMARY_CHARS) : null;
}

/**
 * Decides what the model sees for this request. The saved chat's messages are never changed here.
 * A stored summary is used only if it still lies inside this chat, since an edit can shorten a chat.
 */
export async function compactHistory(messages: Message[], existing?: CompactionState): Promise<CompactResult> {
  const total = messages.length;
  const cut = total - KEEP_RECENT;
  const usable = existing && existing.coveredCount > 0 && existing.coveredCount <= cut ? existing : undefined;

  if (total <= COMPACT_TRIGGER) {
    return { history: messages, changed: false, compaction: usable };
  }

  if (usable && cut - usable.coveredCount < MIN_NEW_MESSAGES) {
    return {
      history: messages.slice(usable.coveredCount),
      summaryForModel: usable.summary,
      compaction: usable,
      changed: false,
    };
  }

  const covered = usable?.coveredCount ?? 0;
  const summary = await summarize(usable?.summary, messages.slice(covered, cut));

  if (!summary) {
    // Summarizing failed. Send what we have. The route's message cap still applies.
    if (usable) {
      return {
        history: messages.slice(usable.coveredCount),
        summaryForModel: usable.summary,
        compaction: usable,
        changed: false,
      };
    }
    return { history: messages, changed: false };
  }

  const compaction: CompactionState = {
    summary,
    coveredCount: cut,
    updatedAt: new Date().toISOString(),
  };
  return {
    history: messages.slice(cut),
    summaryForModel: summary,
    compaction,
    changed: true,
  };
}
