/**
 * Client-safe email rendering. This file must NOT import the Resend SDK, so the admin UI can use
 * the same wrapper for its live preview that the server uses for sending.
 *
 * Layout: a light canvas, a 560px card, a brand row, a vector icon tile above the title, body copy,
 * an optional extra block (for example a one-time code), a dark call-to-action, and a quiet footer.
 * Icons are hosted PNGs from src/lib/email-icons.ts. No emoji are used anywhere in the layout.
 */
import { emailIconUrl, isEmailIcon } from "./email-icons";

export const EMAIL_PLACEHOLDERS = ["name", "email", "date", "incident_id", "app_url", "action_url"] as const;

export type EmailPlaceholder = (typeof EMAIL_PLACEHOLDERS)[number];

export const DEFAULT_APP_URL = "https://roleflow.site";
const LOGO_URL = "https://roleflow.site/icon.png";

export interface PlaceholderValues {
  name?: string;
  email?: string;
  date?: string;
  incident_id?: string;
  app_url?: string;
  action_url?: string;
}

/** Sample values used by the admin live preview. */
export const SAMPLE_PLACEHOLDER_VALUES: Required<PlaceholderValues> = {
  name: "Alex",
  email: "alex@example.com",
  date: "November 13, 2026",
  incident_id: "RF-INC-0001",
  app_url: DEFAULT_APP_URL,
  action_url: DEFAULT_APP_URL,
};

/** Returns the placeholder names that appear in a text but are not in the known list. */
export function findUnknownPlaceholders(text: string): string[] {
  const found = new Set<string>();
  const re = /\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(text)) !== null) {
    if (!(EMAIL_PLACEHOLDERS as readonly string[]).includes(match[1])) found.add(match[1]);
  }
  return Array.from(found);
}

/**
 * Replaces {{placeholders}} with values. Values are inserted raw here; wrapEmailInBrandedTemplate
 * escapes the final text, so never pass pre-escaped HTML.
 */
export function renderPlaceholders(text: string, values: PlaceholderValues): string {
  const resolved: Record<string, string> = {
    name: values.name || "there",
    email: values.email || "",
    date: values.date || "",
    incident_id: values.incident_id || "N/A",
    app_url: values.app_url || DEFAULT_APP_URL,
    action_url: values.action_url || values.app_url || DEFAULT_APP_URL,
  };
  return text.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (whole, key: string) =>
    Object.prototype.hasOwnProperty.call(resolved, key) ? resolved[key] : whole
  );
}

export function escapeHtml(str: string): string {
  return (str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/** Plain text to HTML paragraphs. Blank lines split paragraphs; single newlines become line breaks. */
function bodyToHtml(text: string): string {
  return text
    .replace(/\r\n/g, "\n")
    .split(/\n{2,}/)
    .map((para) => para.trim())
    .filter(Boolean)
    .map(
      (para) =>
        `<p style="margin: 0 0 16px 0; font-size: 16px; line-height: 26px; color: #3f3f46;">${escapeHtml(para).replace(
          /\n/g,
          "<br>"
        )}</p>`
    )
    .join("\n");
}

export interface BrandedEmailOptions {
  /** Used as the document title and the H1 heading. */
  title: string;
  /** Vector icon id shown above the title, such as "shield". Unknown ids are ignored. */
  icon?: string;
  /** Plain text. Blank lines start a new paragraph. Placeholders must already be rendered. */
  body: string;
  ctaText?: string;
  ctaUrl?: string;
  /** Optional line shown in the inbox preview next to the subject. */
  preheader?: string;
  /**
   * Trusted HTML inserted after the body and before the button, for example a one-time code block.
   * Build it only from escapeHtml()-escaped values.
   */
  extraHtml?: string;
  /** Optional line shown in the footer subtitle. */
  footnote?: string;
}

/** A one-time code block for sign-in and verification emails. Escapes the code itself. */
export function codeBlockHtml(code: string): string {
  return `<div style="margin: 0 0 24px 0; padding: 18px 16px; border-radius: 12px; background-color: #fafaf9; border: 1px solid #e7e5e4; text-align: center;">
  <div style="font-family: 'SFMono-Regular', Menlo, Consolas, monospace; font-size: 28px; font-weight: 600; letter-spacing: 8px; color: #18181b;">${escapeHtml(code)}</div>
</div>`;
}

/**
 * Wraps plain-text content in the RoleFlow email layout. Used by the send engine
 * (src/app/api/admin/emails/send), the sign-in email, and the admin live preview.
 */
export function wrapEmailInBrandedTemplate({
  title,
  icon,
  body,
  ctaText,
  ctaUrl,
  preheader,
  extraHtml,
  footnote,
}: BrandedEmailOptions): string {
  const safeTitle = escapeHtml(title);
  const iconBlock = isEmailIcon(icon)
    ? `
          <tr>
            <td align="center" style="padding-bottom: 20px;">
              <table align="center" border="0" cellpadding="0" cellspacing="0"><tr>
                <td align="center" valign="middle" width="64" height="64" style="width: 64px; height: 64px; background-color: #fef3c7; border-radius: 16px; text-align: center; vertical-align: middle;">
                  <img src="${emailIconUrl(icon)}" width="32" height="32" alt="" style="display: inline-block; width: 32px; height: 32px; border: 0;" />
                </td>
              </tr></table>
            </td>
          </tr>`
    : "";

  const preheaderBlock = preheader
    ? `<div style="display: none; max-height: 0; overflow: hidden; opacity: 0; color: transparent;">${escapeHtml(preheader)}</div>`
    : "";

  const ctaBlock =
    ctaText && ctaUrl
      ? `
          <tr>
            <td align="center" style="padding: 8px 0 28px 0;">
              <a href="${escapeHtml(ctaUrl)}" style="display: inline-block; background-color: #18181b; color: #ffffff; font-size: 15px; font-weight: 600; text-decoration: none; padding: 13px 32px; border-radius: 10px;">
                ${escapeHtml(ctaText)}
              </a>
            </td>
          </tr>`
      : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="light">
  <title>${safeTitle}</title>
</head>
<body style="margin: 0; padding: 40px 16px; background-color: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #18181b;">
  ${preheaderBlock}
  <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 560px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e4e4e7; border-radius: 20px; overflow: hidden;">
    <tr>
      <td style="padding: 28px 36px; border-bottom: 1px solid #f4f4f5;">
        <table border="0" cellpadding="0" cellspacing="0"><tr>
          <td style="vertical-align: middle; padding-right: 12px;">
            <img src="${LOGO_URL}" width="32" height="32" alt="RoleFlow" style="display: block; width: 32px; height: 32px; border-radius: 8px; border: 0;" />
          </td>
          <td style="vertical-align: middle;">
            <span style="font-size: 19px; font-weight: 700; color: #18181b; letter-spacing: -0.4px;">RoleFlow</span>
          </td>
        </tr></table>
      </td>
    </tr>

    <tr>
      <td style="padding: 36px 36px 8px 36px; text-align: center;">
        <table width="100%" border="0" cellpadding="0" cellspacing="0">${iconBlock}
          <tr>
            <td style="padding-bottom: 20px; text-align: center;">
              <h1 style="margin: 0; font-size: 24px; font-weight: 700; color: #18181b; letter-spacing: -0.6px; line-height: 1.3;">${safeTitle}</h1>
            </td>
          </tr>
          <tr>
            <td style="text-align: left;">
              ${bodyToHtml(body)}
              ${extraHtml || ""}
            </td>
          </tr>${ctaBlock}
        </table>
      </td>
    </tr>

    <tr>
      <td style="padding: 0 36px 32px 36px;">
        <div style="border-top: 1px solid #f4f4f5; padding-top: 20px; font-size: 13px; line-height: 20px; color: #71717a; text-align: center;">
          <p style="margin: 0 0 8px 0;">${escapeHtml(
            footnote || "You are receiving this message because you have a RoleFlow account or were addressed directly by the RoleFlow team."
          )}</p>
          <p style="margin: 0;">
            Need help? <a href="mailto:support@roleflow.site" style="color: #18181b; text-decoration: underline;">Contact support</a>
            &nbsp;·&nbsp; <a href="https://status.roleflow.site" style="color: #18181b; text-decoration: underline;">System status</a>
          </p>
        </div>
      </td>
    </tr>

    <tr>
      <td style="padding: 18px 36px; background-color: #fafafa; border-top: 1px solid #e4e4e7; font-size: 12px; line-height: 18px; color: #71717a; text-align: center;">
        <span style="font-weight: 600; color: #3f3f46;">RoleFlow, Inc.</span>
        &nbsp;·&nbsp; <a href="https://roleflow.site/privacy" style="color: #71717a; text-decoration: underline;">Privacy</a>
        &nbsp;·&nbsp; <a href="https://roleflow.site/terms" style="color: #71717a; text-decoration: underline;">Terms</a>
        &nbsp;·&nbsp; <a href="https://roleflow.site/acceptable-use" style="color: #71717a; text-decoration: underline;">Acceptable use</a>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
