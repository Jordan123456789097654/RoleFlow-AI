import { resend, fromEmail } from "@/lib/email";
import { db, ADMIN_EMAIL } from "@/lib/db";
import type { EmailBroadcastLog, EmailTargetType } from "@/types";
import {
  DEFAULT_APP_URL,
  PlaceholderValues,
  findUnknownPlaceholders,
  renderPlaceholders,
  wrapEmailInBrandedTemplate,
} from "@/lib/email-template-html";

/** Server-only: sends admin emails through Resend and records them in roleflow_email_broadcasts. */

export const BROADCAST_CONFIRM_PHRASE = "CONFIRM BROADCAST";
/** Resend batch size per request. Each recipient still gets their own message (no shared To list). */
export const BROADCAST_BATCH_SIZE = 50;
/** Pause between batches so the send rate stays under Resend's limit and avoids 429 responses. */
export const BROADCAST_BATCH_DELAY_MS = 1000;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface ComposeRequest {
  mode: EmailTargetType;
  /** Required for mode "single". Any address, registered or not. */
  to?: string;
  subject: string;
  body: string;
  emoji?: string;
  templateId?: string | null;
  ctaText?: string;
  ctaUrl?: string;
  /** Admin-entered placeholder values. Empty values fall back to defaults. */
  date?: string;
  incidentId?: string;
  actionUrl?: string;
  /** Greeting name for single and test sends. Broadcasts use each user's own name. */
  recipientName?: string;
  /** Must equal BROADCAST_CONFIRM_PHRASE for mode "broadcast". */
  confirmPhrase?: string;
}

export type ValidationResult<T> = { ok: true; value: T } | { ok: false; error: string };

function cleanLine(value: unknown, max: number): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function isHttpUrl(value: string): boolean {
  try {
    const u = new URL(value);
    return u.protocol === "https:" || u.protocol === "http:" || u.protocol === "mailto:";
  } catch {
    return false;
  }
}

/** Validates an incoming compose request. Returns a normalized copy or a readable error. */
export function validateComposeRequest(raw: any): ValidationResult<ComposeRequest> {
  if (!raw || typeof raw !== "object") return { ok: false, error: "Request body must be a JSON object." };

  const mode = raw.mode;
  if (mode !== "broadcast" && mode !== "single" && mode !== "test") {
    return { ok: false, error: "mode must be one of: broadcast, single, test." };
  }

  const subject = cleanLine(raw.subject, 200);
  if (subject.length < 3) return { ok: false, error: "Subject must be at least 3 characters." };

  const body = typeof raw.body === "string" ? raw.body.replace(/\r\n/g, "\n").trim() : "";
  if (body.length < 10) return { ok: false, error: "Body must be at least 10 characters." };
  if (body.length > 20000) return { ok: false, error: "Body must be 20,000 characters or fewer." };

  const unknown = [
    ...findUnknownPlaceholders(subject),
    ...findUnknownPlaceholders(body),
    ...findUnknownPlaceholders(cleanLine(raw.ctaUrl, 2000)),
    ...findUnknownPlaceholders(cleanLine(raw.ctaText, 80)),
  ];
  if (unknown.length > 0) {
    const names = Array.from(new Set(unknown)).map((n) => `{{${n}}}`).join(", ");
    return { ok: false, error: `Unknown placeholder(s): ${names}. Allowed: name, email, date, incident_id, app_url, action_url.` };
  }

  const actionUrl = cleanLine(raw.actionUrl, 2000);
  if (actionUrl && !isHttpUrl(actionUrl)) {
    return { ok: false, error: "Action URL must start with https:// (or http:// or mailto:)." };
  }

  const ctaUrl = cleanLine(raw.ctaUrl, 2000);
  if (ctaUrl && !ctaUrl.includes("{{") && !isHttpUrl(ctaUrl)) {
    return { ok: false, error: "Button URL must start with https:// (or mailto:) or be a placeholder." };
  }

  const value: ComposeRequest = {
    mode,
    subject,
    body,
    emoji: cleanLine(raw.emoji, 8) || undefined,
    templateId: cleanLine(raw.templateId, 120) || null,
    ctaText: cleanLine(raw.ctaText, 80) || undefined,
    ctaUrl: ctaUrl || undefined,
    date: cleanLine(raw.date, 80) || undefined,
    incidentId: cleanLine(raw.incidentId, 120) || undefined,
    actionUrl: actionUrl || undefined,
    recipientName: cleanLine(raw.recipientName, 80) || undefined,
    confirmPhrase: typeof raw.confirmPhrase === "string" ? raw.confirmPhrase : undefined,
  };

  if (mode === "single") {
    const to = cleanLine(raw.to, 254).toLowerCase();
    if (!EMAIL_RE.test(to)) return { ok: false, error: "Enter a valid recipient email address." };
    value.to = to;
  }

  if (mode === "test") {
    if (!ADMIN_EMAIL) return { ok: false, error: "ADMIN_EMAIL is not configured on the server." };
    value.to = ADMIN_EMAIL;
  }

  if (mode === "broadcast" && value.confirmPhrase !== BROADCAST_CONFIRM_PHRASE) {
    return { ok: false, error: `Type "${BROADCAST_CONFIRM_PHRASE}" exactly to send to all users.` };
  }

  return { ok: true, value };
}

/** Today's date in a human format, used when the admin leaves the date blank. */
export function formatToday(): string {
  return new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric", timeZone: "UTC" });
}

/** Builds the HTML and plain-text view of one message for one recipient. */
export function buildMessage(req: ComposeRequest, recipientEmail: string, recipientName?: string) {
  const values: PlaceholderValues = {
    name: recipientName || "there",
    email: recipientEmail,
    date: req.date || formatToday(),
    incident_id: req.incidentId || "N/A",
    app_url: DEFAULT_APP_URL,
    action_url: req.actionUrl || DEFAULT_APP_URL,
  };

  const subject = renderPlaceholders(req.subject, values);
  const body = renderPlaceholders(req.body, values);
  const ctaText = req.ctaText ? renderPlaceholders(req.ctaText, values) : undefined;
  const ctaUrl = req.ctaUrl ? renderPlaceholders(req.ctaUrl, values) : undefined;

  const html = wrapEmailInBrandedTemplate({
    title: subject,
    emoji: req.emoji,
    body,
    ctaText: ctaText && ctaUrl ? ctaText : undefined,
    ctaUrl: ctaText && ctaUrl ? ctaUrl : undefined,
  });

  return { subject, html };
}

/** Unique, normalized list of every registered user's email, plus the first name for greetings. */
export async function getBroadcastRecipients(): Promise<{ email: string; name: string }[]> {
  const users = await db.getAllUsers();
  const seen = new Map<string, { email: string; name: string }>();
  for (const u of users) {
    const email = (u.email || "").trim().toLowerCase();
    if (!email || !EMAIL_RE.test(email) || seen.has(email)) continue;
    seen.set(email, { email, name: (u.name || "").trim().split(/\s+/)[0] || "" });
  }
  return Array.from(seen.values());
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export interface SendOutcome {
  status: EmailBroadcastLog["status"];
  totalRecipients: number;
  deliveredCount: number;
  failedCount: number;
  logId: string;
  /** Messages for the first failed batch or send, for the admin to see. */
  firstError?: string;
}

/**
 * Sends a composed email to the requested audience and writes one broadcast log row.
 * Broadcasts go out in batches of 50 with a 1-second pause between batches.
 */
export async function sendComposedEmail(req: ComposeRequest, adminEmail: string): Promise<SendOutcome> {
  const replyTo = process.env.RESEND_REPLY_TO || adminEmail || undefined;
  let delivered = 0;
  let failed = 0;
  let total = 0;
  let firstError: string | undefined;

  if (req.mode === "broadcast") {
    const recipients = await getBroadcastRecipients();
    total = recipients.length;
    const payloads = recipients.map((r) => {
      const msg = buildMessage(req, r.email, r.name || undefined);
      return { from: fromEmail, to: r.email, subject: msg.subject, html: msg.html, replyTo };
    });

    for (let i = 0; i < payloads.length; i += BROADCAST_BATCH_SIZE) {
      const chunk = payloads.slice(i, i + BROADCAST_BATCH_SIZE);
      try {
        const result: any = await resend.batch.send(chunk as any);
        const batchError = result?.error;
        if (batchError) {
          failed += chunk.length;
          firstError ??= batchError.message || "Batch rejected by Resend.";
        } else {
          const partialErrors: any[] = result?.data?.errors || [];
          failed += partialErrors.length;
          delivered += chunk.length - partialErrors.length;
          if (partialErrors.length && !firstError) firstError = partialErrors[0]?.message || "Some messages failed.";
        }
      } catch (e: any) {
        failed += chunk.length;
        firstError ??= e?.message || "Batch request failed.";
      }
      if (i + BROADCAST_BATCH_SIZE < payloads.length) await sleep(BROADCAST_BATCH_DELAY_MS);
    }
  } else {
    total = 1;
    const to = req.to as string;
    const msg = buildMessage(req, to, req.recipientName);
    try {
      const result: any = await resend.emails.send({ from: fromEmail, to, subject: msg.subject, html: msg.html, replyTo } as any);
      if (result?.error) {
        failed = 1;
        firstError = result.error.message || "Resend rejected the message.";
      } else {
        delivered = 1;
      }
    } catch (e: any) {
      failed = 1;
      firstError = e?.message || "Send failed.";
    }
  }

  const status: EmailBroadcastLog["status"] =
    failed === 0 ? "completed" : delivered === 0 ? "failed" : "partial";

  const log = await db.saveBroadcastLog({
    adminEmail,
    targetType: req.mode,
    targetEmail: req.mode === "broadcast" ? null : req.to || null,
    subject: req.subject,
    templateId: req.templateId || null,
    totalRecipients: total,
    deliveredCount: delivered,
    failedCount: failed,
    status,
  });

  return { status, totalRecipients: total, deliveredCount: delivered, failedCount: failed, logId: log.id, firstError };
}
