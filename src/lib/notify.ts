import type { NextRequest, NextResponse } from "next/server";
import { resend, fromEmail } from "@/lib/email";
import type { ModerationCategory, UserProfile } from "@/types";

/**
 * Account, security, moderation, and usage notices.
 *
 * Rules for every notice in this file:
 * - Never include a user's flagged prompt, message text, or the detection rules that fired.
 * - Only include the category label, the incident reference, and the next step.
 * - Sending is fire-and-forget. A failed email is logged and never blocks the request.
 */

const SITE = "https://roleflow.site";
export const DEVICE_COOKIE = "rf_device";

const esc = (s: string) =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

interface Notice {
  subject: string;
  heading: string;
  paragraphs: string[]; // plain text, escaped here
  cta?: { label: string; href: string };
  note?: string;
}

function render(n: Notice): string {
  const paras = n.paragraphs
    .map((p) => `<p style="margin: 0 0 14px 0; font-size: 15px; line-height: 24px; color: #374151;">${esc(p)}</p>`)
    .join("");
  const cta = n.cta
    ? `<p style="margin: 24px 0;"><a href="${esc(n.cta.href)}" style="display: inline-block; background-color: #111827; color: #ffffff; font-size: 15px; font-weight: 600; text-decoration: none; padding: 12px 28px; border-radius: 8px;">${esc(n.cta.label)}</a></p>`
    : "";
  const note = n.note
    ? `<p style="margin: 16px 0 0 0; font-size: 13px; line-height: 20px; color: #6b7280;">${esc(n.note)}</p>`
    : "";
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>${esc(n.subject)}</title></head>
<body style="margin: 0; padding: 40px 20px; background-color: #ffffff; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #111827;">
<table align="center" width="100%" style="max-width: 520px; margin: 0 auto;"><tr><td>
<div style="font-size: 18px; font-weight: 600; color: #111827; margin-bottom: 28px;">RoleFlow</div>
<h1 style="margin: 0 0 16px 0; font-size: 22px; font-weight: 700; color: #111827;">${esc(n.heading)}</h1>
${paras}${cta}${note}
<div style="margin-top: 32px; padding-top: 16px; border-top: 1px solid #e5e7eb; font-size: 12px; line-height: 18px; color: #6b7280;">
RoleFlow, Inc. · <a href="${SITE}" style="color: #6b7280;">roleflow.site</a> ·
<a href="${SITE}/privacy" style="color: #6b7280;">Privacy</a> ·
<a href="${SITE}/moderation" style="color: #6b7280;">Moderation &amp; Appeals</a> ·
<a href="mailto:support@roleflow.site" style="color: #6b7280;">Support</a>
</div></td></tr></table></body></html>`;
}

/** Sends one notice. Never throws. */
export async function sendNotice(to: string, notice: Notice): Promise<void> {
  if (!to || !to.includes("@")) return;
  try {
    await resend.emails.send({
      from: fromEmail,
      to,
      subject: notice.subject,
      html: render(notice),
    });
  } catch (error) {
    console.error("Notice email failed:", notice.subject, error);
  }
}

const categoryLabel = (c?: ModerationCategory | string | null) =>
  (c || "security policy").toString().toLowerCase().replace(/_/g, " ");

// ---------------------------------------------------------------------------
// Account and security
// ---------------------------------------------------------------------------

export function welcomeNotice(name: string): Notice {
  return {
    subject: "Welcome to RoleFlow",
    heading: `Welcome, ${name}`,
    paragraphs: [
      "RoleFlow is an AI assistant for questions, writing, and software engineering. Live previews show the code it writes.",
      "Your account is secured by email sign-in. We will never ask for your password. Keep access to this email address secure, because anyone who can read a sign-in code can sign in as you.",
      "If you build with our API, the docs explain keys, limits, and errors.",
    ],
    cta: { label: "Open RoleFlow", href: `${SITE}/chat` },
  };
}

export function newDeviceNotice(opts: { when: string; ip: string; agent: string }): Notice {
  return {
    subject: "New sign-in to your RoleFlow account",
    heading: "New sign-in detected",
    paragraphs: [
      `Your RoleFlow account was signed in to on ${opts.when} from a device or browser we have not seen before.`,
      `Approximate IP address: ${opts.ip}. Browser: ${opts.agent.slice(0, 120) || "unknown"}.`,
      "If this was you, no action is needed. If it wasn't, reply to this email or contact support right away, and sign out other sessions by requesting a new sign-in code.",
    ],
    cta: { label: "Contact support", href: "mailto:support@roleflow.site?subject=Unrecognized%20sign-in" },
  };
}

// ---------------------------------------------------------------------------
// API keys
// ---------------------------------------------------------------------------

export function apiKeyCreatedNotice(opts: { name: string; prefix: string; rpm: number; rpd: number; expiresAt?: string }): Notice {
  return {
    subject: `API key created: ${opts.name}`,
    heading: "A new API key was created",
    paragraphs: [
      `Key "${opts.name}" (prefix ${opts.prefix}…) was created on your account.`,
      `Limits: ${opts.rpm} requests per minute and ${opts.rpd} per day. ${opts.expiresAt ? `It expires on ${new Date(opts.expiresAt).toUTCString()}.` : "It does not expire."}`,
      "If you did not create this key, revoke it now in Settings → API Keys and contact support.",
    ],
    cta: { label: "Manage API keys", href: `${SITE}/chat` },
  };
}

export function apiKeyRevokedNotice(opts: { name: string }): Notice {
  return {
    subject: `API key revoked: ${opts.name}`,
    heading: "An API key was revoked",
    paragraphs: [
      `Key "${opts.name}" was revoked. Requests that use it will now be rejected.`,
      "If you did not revoke this key, check your account for unfamiliar activity and contact support.",
    ],
    cta: { label: "Manage API keys", href: `${SITE}/chat` },
  };
}

// ---------------------------------------------------------------------------
// Usage
// ---------------------------------------------------------------------------

export function usageWarningNotice(opts: { remaining: number; limit: number; resetsAt?: string }): Notice {
  const when = opts.resetsAt ? ` Your limit resets ${new Date(opts.resetsAt).toUTCString()}.` : "";
  return {
    subject: `${opts.remaining} message${opts.remaining === 1 ? "" : "s"} left today`,
    heading: "You're close to your daily limit",
    paragraphs: [
      `You have ${opts.remaining} of ${opts.limit} messages remaining in your current period.${when}`,
      "You can keep going after the reset, or review your plan options in the app.",
    ],
    cta: { label: "Open RoleFlow", href: `${SITE}/chat` },
  };
}

// ---------------------------------------------------------------------------
// Moderation: when a person's request is refused, held, or their account is actioned
// ---------------------------------------------------------------------------

export function moderationRefusalNotice(opts: { category?: string; logId: string; strikes: number }): Notice {
  return {
    subject: "A request was refused under our Acceptable Use Policy",
    heading: "Your request was refused",
    paragraphs: [
      `A request on your account was refused because it appeared to relate to ${categoryLabel(opts.category)}. No answer was generated.`,
      `Reference: ${opts.logId}. This is strike ${opts.strikes} on your account. Repeated violations can lead to suspension.`,
      "If you think this was a mistake, you can appeal. Appeals are reviewed by a person who did not make the original decision.",
    ],
    cta: { label: "Read the Moderation and Appeals Policy", href: `${SITE}/moderation` },
  };
}

export function imageHeldNotice(opts: { logId: string }): Notice {
  return {
    subject: "An image could not be checked",
    heading: "Your image is on hold",
    paragraphs: [
      "An image you uploaded could not be checked automatically, so we did not answer it. This is not a finding that the image is harmful.",
      `Reference: ${opts.logId}. You can try again later, or describe the image in text.`,
      "If the image is ordinary and you believe it was held in error, reply to this email or appeal with the reference above.",
    ],
    cta: { label: "Appeal this decision", href: `${SITE}/moderation` },
  };
}

export function suspensionNotice(opts: { logId: string }): Notice {
  return {
    subject: "Your RoleFlow account has been suspended",
    heading: "Your account is suspended",
    paragraphs: [
      "Your RoleFlow account has been suspended because a request violated our Acceptable Use Policy in a serious category. Access to the app and to API keys has been stopped.",
      `Reference: ${opts.logId}. You can appeal this decision. Appeals are reviewed by a person and we aim to respond within 10 business days.`,
    ],
    cta: { label: "Appeal this decision", href: `${SITE}/moderation` },
  };
}

export function appealReceivedNotice(opts: { logId: string }): Notice {
  return {
    subject: "We received your appeal",
    heading: "Appeal received",
    paragraphs: [
      `Thank you. We received your appeal for reference ${opts.logId} and a person will review it.`,
      "We aim to decide within 10 business days and will email you the outcome. Complex cases may take longer, and we will tell you if so.",
    ],
    cta: { label: "Read the appeals process", href: `${SITE}/moderation` },
  };
}

export function appealDecisionNotice(opts: { logId: string; outcome: "RESOLVED" | "BANNED" }): Notice {
  const restored = opts.outcome === "RESOLVED";
  return {
    subject: restored ? "Your appeal was upheld" : "Your appeal outcome",
    heading: restored ? "Your appeal was successful" : "Your appeal outcome",
    paragraphs: [
      `Reference: ${opts.logId}.`,
      restored
        ? "We reviewed your appeal and have restored access. The record has been updated."
        : "We reviewed your appeal and the original decision stands. Your account remains suspended.",
      "If you have further information, contact support. Your rights under applicable law are not affected.",
    ],
    cta: { label: "Contact support", href: "mailto:support@roleflow.site?subject=Appeal%20follow-up" },
  };
}

// ---------------------------------------------------------------------------
// Required notices about policy changes
// ---------------------------------------------------------------------------

export function policyChangeNotice(opts: { docTitle: string; effectiveDate: string; summary: string; url: string }): Notice {
  return {
    subject: `Updated ${opts.docTitle}`,
    heading: `Our ${opts.docTitle} has changed`,
    paragraphs: [
      `The updated ${opts.docTitle} takes effect on ${opts.effectiveDate}.`,
      opts.summary,
      "Continuing to use RoleFlow after that date means you accept the updated document. If you do not accept it, you can stop using the Services and delete your account.",
    ],
    cta: { label: `Read the ${opts.docTitle}`, href: opts.url },
  };
}

// ---------------------------------------------------------------------------
// Sign-in hook: welcome for new accounts, alert for unfamiliar devices.
// Call after the session cookie is set. Sets the device cookie on the response.
// ---------------------------------------------------------------------------

export function notifySignIn(req: NextRequest, res: NextResponse, user: UserProfile, isNewUser: boolean): void {
  const hasDevice = Boolean(req.cookies.get(DEVICE_COOKIE)?.value);
  if (!hasDevice) {
    res.cookies.set(DEVICE_COOKIE, crypto.randomUUID(), {
      path: "/",
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 365 * 2,
    });
  }

  if (isNewUser) {
    void sendNotice(user.email, welcomeNotice(user.name || "there"));
    return;
  }

  // Alert only for returning accounts signing in from a browser without the device cookie.
  if (!hasDevice) {
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "unknown";
    void sendNotice(
      user.email,
      newDeviceNotice({
        when: new Date().toUTCString(),
        ip,
        agent: req.headers.get("user-agent") || "",
      })
    );
  }
}

/** Convenience wrapper for call sites that hold an email string. */
export function notifyUser(email: string | undefined | null, notice: Notice): void {
  if (!email || email === "guest" || !email.includes("@")) return;
  void sendNotice(email, notice);
}
