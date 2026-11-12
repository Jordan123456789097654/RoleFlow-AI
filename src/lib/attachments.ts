import {
  Attachment,
  IncidentAttachment,
  IncidentContext,
  IncidentTurn,
  Message,
  ModerationCategory,
  ModerationTier,
  ModerationVerdict,
} from "@/types";
import { groqChatCompletion, isImageAttachment, VISION_MODEL } from "@/lib/ai-engine";

const MAX_SCAN_CHARS = 60_000;
const MAX_TURN_CHARS = 4_000;
const MAX_TEXT_ATTACHMENT_CONTEXT_CHARS = 8_000;
const MAX_IMAGE_CONTEXT_CHARS = 1_500_000;
const MAX_TURNS_IN_CONTEXT = 12;

/** Text that the keyword scanner should check for an attachment-bearing message. */
export function buildAttachmentScanText(message?: Message): string {
  if (!message?.attachments?.length) return "";
  return message.attachments
    .map((a) => (isImageAttachment(a) ? a.name : `${a.name}\n${a.content.slice(0, MAX_SCAN_CHARS)}`))
    .join("\n");
}

const SAFETY_SYSTEM_PROMPT = `You are a trust and safety classifier. Examine the attached image(s) and reply with JSON only, with no other text:
{"flagged": boolean, "category": "CSAM" | "WEAPONS_MANUFACTURING" | "VIOLENT_EXTREMISM" | "SELF_HARM" | "NONE", "reason": "one short sentence"}
Flag only clear, serious violations: sexual content involving minors, instructions or diagrams for weapons or explosives, extremist propaganda, or imagery promoting self-harm. Do not flag ordinary photos, screenshots, documents, art, or medical or educational content.`;

const KNOWN_IMAGE_CATEGORIES: Record<string, ModerationCategory> = {
  CSAM: "CSAM",
  WEAPONS_MANUFACTURING: "WEAPONS_MANUFACTURING",
  VIOLENT_EXTREMISM: "VIOLENT_EXTREMISM",
  SELF_HARM: "SELF_HARM",
};

/**
 * Runs the vision model over uploaded images. CSAM is tier 1 (zero tolerance).
 * Everything else is tier 2 (blocked and logged for review, no ban).
 *
 * Fails open if the classifier is unavailable, so an outage doesn't block all
 * image uploads. Failures are logged; the keyword scanner still runs on text.
 */
export async function classifyImagesForSafety(images: Attachment[]): Promise<ModerationVerdict> {
  // No vision model means images can't be checked. Fail closed: route them to review
  // instead of letting unchecked images through.
  if (!VISION_MODEL) {
    return {
      flagged: true,
      tier: 2,
      category: "IMAGE_REVIEW",
      reason: "Image uploads can't be checked automatically on this server (no vision model configured).",
      confidence: 1,
      action: "REFUSE_WITH_WARNING",
    };
  }

  const allow: ModerationVerdict = {
    flagged: false,
    tier: null,
    category: null,
    reason: null,
    confidence: 0,
    action: "ALLOW",
  };

  const raw = await groqChatCompletion({
    model: VISION_MODEL,
    temperature: 0,
    maxTokens: 150,
    messages: [
      { role: "system", content: SAFETY_SYSTEM_PROMPT },
      {
        role: "user",
        content: [
          { type: "text", text: "Classify the attached image(s)." },
          ...images.slice(0, 4).map((img) => ({
            type: "image_url" as const,
            image_url: { url: img.content },
          })),
        ],
      },
    ],
  });

  if (!raw) {
    console.error("Image safety check unavailable; allowing image through keyword scan only.");
    return allow;
  }

  let parsed: { flagged?: boolean; category?: string; reason?: string } | null = null;
  try {
    const match = raw.match(/\{[\s\S]*\}/);
    parsed = match ? JSON.parse(match[0]) : null;
  } catch {
    parsed = null;
  }
  if (!parsed?.flagged) return allow;

  const category: ModerationCategory =
    KNOWN_IMAGE_CATEGORIES[parsed.category ?? ""] ?? "IMAGE_REVIEW";
  const tier: ModerationTier = category === "CSAM" ? 1 : 2;

  return {
    flagged: true,
    tier,
    category,
    reason: parsed.reason || "Image flagged by automated review.",
    confidence: 0.85,
    action: tier === 1 ? "BLOCK_AND_BAN" : "REFUSE_WITH_WARNING",
  };
}

/**
 * Snapshot of the conversation at the moment of flagging, stored with the incident
 * so reviewers see what was actually said, not just the single flagged string.
 * The flagged message's image is kept in full. Other images are referenced by name.
 */
export function buildIncidentContext(messages: Message[], flagged?: Message): string {
  const turns: IncidentTurn[] = messages.slice(-MAX_TURNS_IN_CONTEXT).map((m) => ({
    role: m.role,
    createdAt: m.createdAt,
    content: (m.content || "").slice(0, MAX_TURN_CHARS),
    attachments: m.attachments?.map((a): IncidentAttachment => {
      if (isImageAttachment(a)) {
        const keep = m === flagged && a.content.length <= MAX_IMAGE_CONTEXT_CHARS;
        return { name: a.name, type: a.type, size: a.size, imageDataUrl: keep ? a.content : null };
      }
      return {
        name: a.name,
        type: a.type,
        size: a.size,
        text: a.content.slice(0, MAX_TEXT_ATTACHMENT_CONTEXT_CHARS),
        truncated: a.content.length > MAX_TEXT_ATTACHMENT_CONTEXT_CHARS,
      };
    }),
  }));

  const context: IncidentContext = { capturedAt: new Date().toISOString(), turns };
  return JSON.stringify(context);
}
