import { EMAIL_ICONS, isEmailIcon, type EmailIconId } from "@/lib/email-icons";
import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import { groqChatCompletion, ModelMessage } from "@/lib/ai-engine";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const AI_EMAIL_MODEL = "openai/gpt-oss-120b";
const EMAIL_TONES = [
  "Urgent & Serious",
  "Official & Legal",
  "Warm & Friendly",
  "Excited & Bold",
  "Direct & Concise",
] as const;
type EmailTone = (typeof EMAIL_TONES)[number];

const TONE_GUIDE: Record<EmailTone, string> = {
  "Urgent & Serious": "Urgent and serious. State what happened and what the reader must do, without alarmism.",
  "Official & Legal": "Formal and precise, in the register of a legal or policy notice. Avoid slang.",
  "Warm & Friendly": "Warm, personal and encouraging, like a note from a thoughtful team.",
  "Excited & Bold": "Enthusiastic and confident, celebrating the news without exaggerating facts.",
  "Direct & Concise": "Short and plain. Lead with the point and keep every sentence necessary.",
};

const ALLOWED_PLACEHOLDERS = ["{{name}}", "{{email}}", "{{date}}", "{{incident_id}}", "{{app_url}}", "{{action_url}}"];

function buildSystemPrompt(tone: EmailTone): string {
  return `You write emails for RoleFlow, an AI assistant product, on behalf of its admin team.

Tone: ${TONE_GUIDE[tone]}

Output rules:
- Reply with ONLY a JSON object, no commentary, no code fences, in this exact shape:
  {"subject": "...", "body": "...", "icon": "..."}
- "subject": a professional subject line under 90 characters.
- "body": plain text. Start with a greeting like "Hi {{name}}," and end with a sign-off "The RoleFlow Team". Separate paragraphs with a blank line. No HTML, no markdown, no bullet symbols other than simple hyphens.
- "icon": exactly one id from this list that fits the topic: ${EMAIL_ICONS.map((i) => i.id).join(", ")}. For example "alert" for incidents, "scale" for policy, "bolt" for product launches, "wrench" for maintenance. Never use icon.
- Use only these placeholders where they help: ${ALLOWED_PLACEHOLDERS.join(", ")}. Do not invent other placeholders.
- Never invent specific figures, prices, dates, reference numbers or commitments the admin did not provide. Use a placeholder instead.
- Keep the body under 250 words.`;
}

/** Pulls the first JSON object out of a model reply, tolerating stray prose or code fences. */
function parseEmailJson(text: string): { subject: string; body: string; icon?: EmailIconId } | null {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end <= start) return null;
  try {
    const obj = JSON.parse(text.slice(start, end + 1));
    if (typeof obj?.subject !== "string" || typeof obj?.body !== "string") return null;
    const subject = obj.subject.trim().slice(0, 200);
    const body = obj.body.replace(/\r\n/g, "\n").trim().slice(0, 20000);
    if (!subject || body.length < 10) return null;
    const icon = isEmailIcon(obj.icon) ? obj.icon : undefined;
    return { subject, body, icon };
  } catch {
    return null;
  }
}

/**
 * Admin only. "Prompt for AI to Make": turns a short brief into a subject, body and icon
 * using the inference key pool. The admin reviews the result in the composer before sending.
 *
 * Body: { prompt: string, tone?: one of EMAIL_TONES }
 */
export async function POST(req: NextRequest) {
  const session = getSessionFromRequest(req);
  if (!session?.isAdmin) {
    return NextResponse.json({ error: "Administrative privileges required." }, { status: 403 });
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Request body must be JSON." }, { status: 400 });
  }

  const prompt = typeof body?.prompt === "string" ? body.prompt.trim() : "";
  if (prompt.length < 5 || prompt.length > 2000) {
    return NextResponse.json({ error: "Describe the email in 5 to 2000 characters." }, { status: 400 });
  }

  const tone: EmailTone = (EMAIL_TONES as readonly string[]).includes(body?.tone)
    ? (body.tone as EmailTone)
    : "Direct & Concise";

  const messages: ModelMessage[] = [
    { role: "system", content: buildSystemPrompt(tone) },
    { role: "user", content: `Write the email for this brief:\n\n${prompt}` },
  ];

  const reply = await groqChatCompletion({
    model: AI_EMAIL_MODEL,
    messages,
    temperature: 0.4,
    maxTokens: 1200,
  });

  if (!reply) {
    return NextResponse.json(
      { error: "AI drafting is unavailable right now. Check the inference key pool and try again." },
      { status: 503 }
    );
  }

  const draft = parseEmailJson(reply);
  if (!draft) {
    return NextResponse.json(
      { error: "The AI reply could not be read as an email. Try again or rephrase the brief." },
      { status: 502 }
    );
  }

  return NextResponse.json({ success: true, tone, ...draft });
}
