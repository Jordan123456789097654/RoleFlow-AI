/**
 * Client-safe email rendering. This file must NOT import the Resend SDK, so the admin UI can use
 * the same wrapper for its live preview that the server uses for sending.
 *
 * The layout mirrors the sign-in email in src/lib/email.ts: white canvas, 520px centred column,
 * amber wave logo, 26px title, 15px body copy, dark CTA button, and a divider-plus-footer.
 */

export const EMAIL_PLACEHOLDERS = [
  "name",
  "email",
  "date",
  "incident_id",
  "app_url",
  "action_url",
] as const;

export type EmailPlaceholder = (typeof EMAIL_PLACEHOLDERS)[number];

export const DEFAULT_APP_URL = "https://roleflow.site";

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
        `<p style="margin: 0 0 16px 0; font-size: 15px; line-height: 24px; color: #374151;">${escapeHtml(para).replace(
          /\n/g,
          "<br>"
        )}</p>`
    )
    .join("\n");
}

export interface BrandedEmailOptions {
  /** Used as the document title and the H1 heading. */
  title: string;
  /** Optional contextual emoji badge, such as 🚨 or ⚖️. */
  emoji?: string;
  /** Plain text. Blank lines start a new paragraph. Placeholders must already be rendered. */
  body: string;
  ctaText?: string;
  ctaUrl?: string;
  /** Optional line shown in the footer subtitle. */
  footnote?: string;
}

/**
 * Wraps plain-text content in the RoleFlow sign-in email layout. Used by the send engine
 * (src/app/api/admin/emails/send) and by the admin live preview.
 */
export function wrapEmailInBrandedTemplate({ title, emoji, body, ctaText, ctaUrl, footnote }: BrandedEmailOptions): string {
  const safeTitle = escapeHtml(title);
  const emojiBlock = emoji
    ? `
    <tr>
      <td style="padding-bottom: 24px;">
        <div style="display: inline-block; width: 68px; height: 68px; line-height: 68px; font-size: 48px;">
          ${escapeHtml(emoji)}
        </div>
      </td>
    </tr>`
    : "";

  const ctaBlock =
    ctaText && ctaUrl
      ? `
    <tr>
      <td style="padding-bottom: 24px;">
        <a href="${escapeHtml(ctaUrl)}" style="display: inline-block; background-color: #111827; color: #ffffff; font-size: 15px; font-weight: 600; text-decoration: none; padding: 12px 32px; border-radius: 8px; box-shadow: 0 1px 2px rgba(0,0,0,0.05);">
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
  <title>${safeTitle}</title>
</head>
<body style="margin: 0; padding: 40px 16px; background-color: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #111827;">
  <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 560px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 16px rgba(0,0,0,0.04);">
    <!-- Brand Header -->
    <tr>
      <td style="padding: 32px 36px 24px 36px; text-align: center; border-bottom: 1px solid #f3f4f6;">
        <table align="center" border="0" cellpadding="0" cellspacing="0">
          <tr>
            <td style="vertical-align: middle; padding-right: 12px;">
              <img src="https://roleflow.site/icon.png" width="36" height="36" alt="RoleFlow" style="display: block; width: 36px; height: 36px; border-radius: 8px; border: 0;" />
            </td>
            <td style="vertical-align: middle; text-align: left;">
              <span style="font-size: 22px; font-weight: 700; color: #111827; letter-spacing: -0.5px; display: block; line-height: 1.1;">RoleFlow</span>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- Body Container -->
    <tr>
      <td style="padding: 32px 36px 24px 36px; text-align: center;">
        <table width="100%" border="0" cellpadding="0" cellspacing="0">
${emojiBlock}
          <tr>
            <td style="padding-bottom: 16px; text-align: center;">
              <h1 style="margin: 0; font-size: 24px; font-weight: 700; color: #111827; letter-spacing: -0.5px; line-height: 1.3;">
                ${safeTitle}
              </h1>
            </td>
          </tr>
          <tr>
            <td style="padding-bottom: 24px; text-align: left;">
              ${bodyToHtml(body)}
            </td>
          </tr>
${ctaBlock}
        </table>
      </td>
    </tr>

    <!-- Footnote & Support -->
    <tr>
      <td style="padding: 0 36px 28px 36px;">
        <table width="100%" border="0" cellpadding="0" cellspacing="0" style="border-top: 1px solid #f3f4f6; padding-top: 20px;">
          <tr>
            <td style="font-size: 13px; line-height: 20px; color: #6b7280; text-align: center;">
              <p style="margin: 0 0 8px 0;">
                ${escapeHtml(
                  footnote || "You are receiving this message because you have a RoleFlow account or were addressed directly by the RoleFlow team."
                )}
              </p>
              <p style="margin: 0;">
                Need assistance? Visit our <a href="https://status.roleflow.site" style="color: #d97706; text-decoration: underline; font-weight: 500;">Live Status Page</a> or contact <a href="mailto:support@roleflow.site" style="color: #4b5563; text-decoration: underline;">RoleFlow Support</a>.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- Footer Links -->
    <tr>
      <td style="padding: 20px 36px; background-color: #f9fafb; border-top: 1px solid #e5e7eb; font-size: 12px; line-height: 18px; color: #9ca3af; text-align: center;">
        <table width="100%" border="0" cellpadding="0" cellspacing="0">
          <tr>
            <td style="color: #6b7280; font-size: 12px; text-align: center;">
              <span style="font-weight: 600; color: #374151;">RoleFlow</span> • Founded & Built by Jordan Daniels<br>
              <a href="https://roleflow.site" style="color: #6b7280; text-decoration: underline;">roleflow.site</a>
              <div style="margin-top: 10px;">
                <a href="https://roleflow.site" style="color: #6b7280; text-decoration: underline; margin: 0 8px;">Home</a>
                <a href="https://status.roleflow.site" style="color: #6b7280; text-decoration: underline; margin: 0 8px;">System Status</a>
                <a href="https://roleflow.site/privacy" style="color: #6b7280; text-decoration: underline; margin: 0 8px;">Privacy</a>
                <a href="https://roleflow.site/terms" style="color: #6b7280; text-decoration: underline; margin: 0 8px;">Terms</a>
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
