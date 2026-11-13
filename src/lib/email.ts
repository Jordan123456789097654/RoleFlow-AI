import { Resend } from "resend";

const resendApiKey = process.env.RESEND_API_KEY || "";
export const fromEmail = process.env.RESEND_FROM_EMAIL || "RoleFlow <noreply@roleflow.site>";

export const resend = new Resend(resendApiKey);

export async function sendLoginEmail({
  to,
  code,
  magicLink,
}: {
  to: string;
  code: string;
  magicLink: string;
}) {
  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Sign in to RoleFlow</title>
</head>
<body style="margin: 0; padding: 40px 16px; background-color: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #111827;">
  <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 540px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 16px rgba(0,0,0,0.04);">
    <tr>
      <td style="padding: 32px 36px 20px 36px; text-align: center; border-bottom: 1px solid #f3f4f6;">
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

    <tr>
      <td style="padding: 32px 36px 24px 36px; text-align: center;">
        <div style="display: inline-block; width: 60px; height: 60px; line-height: 60px; font-size: 40px; margin-bottom: 16px;">
          👋
        </div>

        <h1 style="margin: 0 0 12px 0; font-size: 24px; font-weight: 700; color: #111827; letter-spacing: -0.5px;">
          Sign in to RoleFlow
        </h1>

        <p style="margin: 0 0 28px 0; font-size: 15px; line-height: 24px; color: #374151;">
          Click the button below to finish signing in. This link expires in 10 minutes.
        </p>

        <div style="margin-bottom: 24px;">
          <a href="${magicLink}" style="display: inline-block; background-color: #111827; color: #ffffff; font-size: 15px; font-weight: 600; text-decoration: none; padding: 13px 36px; border-radius: 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.08);">
            Sign in to RoleFlow
          </a>
        </div>

        <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 12px; padding: 16px; margin: 16px 0;">
          <p style="margin: 0 0 6px 0; font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600;">
            Or enter this 6-digit code
          </p>
          <div style="font-size: 28px; font-weight: 700; letter-spacing: 6px; color: #111827; font-family: monospace;">
            ${code}
          </div>
        </div>
      </td>
    </tr>

    <tr>
      <td style="padding: 0 36px 24px 36px;">
        <table width="100%" border="0" cellpadding="0" cellspacing="0" style="border-top: 1px solid #f3f4f6; padding-top: 16px;">
          <tr>
            <td style="font-size: 13px; line-height: 20px; color: #6b7280; text-align: center;">
              <p style="margin: 0 0 6px 0;">
                If you didn't request this email, you can safely ignore it.
              </p>
              <p style="margin: 0;">
                Need a hand? Contact <a href="mailto:support@roleflow.site" style="color: #4b5563; text-decoration: underline;">RoleFlow Support</a>.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <tr>
      <td style="padding: 18px 36px; background-color: #f9fafb; border-top: 1px solid #e5e7eb; font-size: 12px; line-height: 18px; color: #9ca3af; text-align: center;">
        <span style="font-weight: 600; color: #374151;">RoleFlow</span> • Founded & Built by Jordan Daniels<br>
        <a href="https://roleflow.site" style="color: #6b7280; text-decoration: underline;">roleflow.site</a>
        <div style="margin-top: 8px;">
          <a href="https://roleflow.site" style="color: #6b7280; text-decoration: underline; margin: 0 8px;">Home</a>
          <a href="https://status.roleflow.site" style="color: #6b7280; text-decoration: underline; margin: 0 8px;">System Status</a>
          <a href="https://roleflow.site/privacy" style="color: #6b7280; text-decoration: underline; margin: 0 8px;">Privacy</a>
          <a href="https://roleflow.site/terms" style="color: #6b7280; text-decoration: underline; margin: 0 8px;">Terms</a>
        </div>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  try {
    const data = await resend.emails.send({
      from: fromEmail,
      to,
      subject: "Sign in to RoleFlow",
      html: htmlContent,
    });
    return { success: true, data };
  } catch (error: any) {
    console.error("Resend error:", error);
    return { success: false, error: error.message || "Failed to send email" };
  }
}

function escapeHtml(str: string): string {
  if (!str) return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export async function sendSecurityAlertEmail({
  userEmail,
  userId,
  timestamp,
  flaggedPrompt,
  category,
  tier = 1,
  ipAddress,
  logId,
}: {
  userEmail: string;
  userId?: string;
  timestamp: string;
  flaggedPrompt: string;
  category: string;
  tier?: number;
  ipAddress?: string;
  logId: string;
}) {
  const alertRecipient = process.env.ADMIN_EMAIL || "security@roleflow.site";
  const subject = `🚨 [SECURITY CRITICAL] Tier ${tier} Violation Detected: ${category} (${userEmail || "Guest"})`;

  const safePrompt = escapeHtml(flaggedPrompt);
  const safeCategory = escapeHtml(category);
  const safeUserEmail = escapeHtml(userEmail || "Guest User");
  const safeUserId = escapeHtml(userId || "");
  const safeIp = escapeHtml(ipAddress || "Unknown / Proxied");

  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Security Critical Alert</title>
</head>
<body style="margin: 0; padding: 32px 16px; background-color: #0f0f11; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #f4f4f0;">
  <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 620px; margin: 0 auto; background-color: #18181b; border: 1px solid #dc2626; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 30px rgba(220, 38, 38, 0.2);">
    <tr>
      <td style="background-color: #dc2626; padding: 14px 24px; color: #ffffff; font-weight: 700; font-size: 14px; letter-spacing: 0.5px;">
        ⚠️ ROLEFLOW TRUST & SAFETY // CRITICAL SECURITY INCIDENT
      </td>
    </tr>
    <tr>
      <td style="padding: 28px 24px;">
        <h1 style="margin: 0 0 8px 0; font-size: 22px; font-weight: 700; color: #f4f4f0;">
          Tier 1 Zero-Tolerance Violation Intercepted
        </h1>
        <p style="margin: 0 0 24px 0; font-size: 14px; line-height: 22px; color: #a1a1aa;">
          RoleFlow's Hybrid Safety Engine blocked a severe prompt violation before language model inference. The user account has been automatically frozen/banned pending administrative review.
        </p>

        <table width="100%" border="0" cellpadding="8" cellspacing="0" style="background-color: #121214; border: 1px solid #27272a; border-radius: 8px; font-size: 13px; margin-bottom: 24px;">
          <tr>
            <td style="color: #71717a; width: 35%; font-weight: 500;">Incident Tracking ID:</td>
            <td style="color: #f4f4f0; font-family: monospace; font-weight: 600;">RF-INC-${logId}</td>
          </tr>
          <tr>
            <td style="color: #71717a; font-weight: 500;">Severity Classification:</td>
            <td style="color: #ef4444; font-weight: 700;">CRITICAL TIER ${tier} (Zero-Tolerance)</td>
          </tr>
          <tr>
            <td style="color: #71717a; font-weight: 500;">Violation Category:</td>
            <td style="color: #f59e0b; font-weight: 600;">${safeCategory}</td>
          </tr>
          <tr>
            <td style="color: #71717a; font-weight: 500;">User Account:</td>
            <td style="color: #f4f4f0;">${safeUserEmail} ${safeUserId ? `(${safeUserId})` : ""}</td>
          </tr>
          <tr>
            <td style="color: #71717a; font-weight: 500;">Originating IP Address:</td>
            <td style="color: #f4f4f0; font-family: monospace;">${safeIp}</td>
          </tr>
          <tr>
            <td style="color: #71717a; font-weight: 500;">Timestamp (UTC):</td>
            <td style="color: #f4f4f0;">${timestamp}</td>
          </tr>
          <tr>
            <td style="color: #71717a; font-weight: 500;">System Action Taken:</td>
            <td style="color: #10b981; font-weight: 600;">Account Automatically Banned · 0 Model Tokens Generated</td>
          </tr>
        </table>

        <div style="margin-bottom: 24px;">
          <div style="font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; color: #ef4444; margin-bottom: 6px;">
            Intercepted Prompt Evidence:
          </div>
          <div style="background-color: #09090b; border: 1px solid #3f3f46; border-radius: 8px; padding: 14px; font-family: monospace; font-size: 13px; line-height: 20px; color: #e4e4e7; white-space: pre-wrap; word-break: break-word;">
${safePrompt}
          </div>
        </div>

        <p style="margin: 0; font-size: 13px; color: #71717a; line-height: 20px;">
          You can inspect this incident, review user appeals, or view the incident audit record in the RoleFlow Admin Panel.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  try {
    const data = await resend.emails.send({
      from: fromEmail,
      to: alertRecipient,
      subject,
      html: htmlContent,
    });
    return { success: true, data };
  } catch (error: any) {
    console.error("Resend security alert error:", error);
    return { success: false, error: error.message || "Failed to send security alert" };
  }
}
