import { Resend } from "resend";
import { codeBlockHtml, wrapEmailInBrandedTemplate } from "./email-template-html";
import { emailIconUrl } from "./email-icons";

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
  const htmlContent = wrapEmailInBrandedTemplate({
    title: "Sign in to RoleFlow",
    icon: "signin",
    preheader: "Your RoleFlow sign-in link and code. Expires in 10 minutes.",
    body: "Click the button below to finish signing in. This link expires in 10 minutes.\n\nIf you did not request this, you can safely ignore this email.",
    ctaText: "Sign in to RoleFlow",
    ctaUrl: magicLink,
    extraHtml: `<p style="margin: 0 0 8px 0; font-size: 12px; line-height: 16px; color: #71717a; text-align: center; text-transform: uppercase; letter-spacing: 0.6px; font-weight: 600;">Or enter this 6-digit code</p>
${codeBlockHtml(code)}`,
  });

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
  const subject = `[SECURITY CRITICAL] Tier ${tier} Violation Detected: ${category} (${userEmail || "Guest"})`;

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
        <img src="${emailIconUrl("alert")}" width="16" height="16" alt="" style="display: inline-block; width: 16px; height: 16px; vertical-align: -3px; border: 0; margin-right: 6px;" />ROLEFLOW TRUST &amp; SAFETY // CRITICAL SECURITY INCIDENT
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

export interface StaffContactParams {
  name: string;
  email: string;
  category: string;
  subject: string;
  message: string;
  ipAddress?: string;
  ticketId?: string;
}

/**
 * Sends a contact inquiry from roleflow.site/help directly to staff@roleflow.site
 * with the submitter's email configured as Reply-To so staff can respond directly.
 */
export async function sendStaffContactEmail({
  name,
  email,
  category,
  subject,
  message,
  ipAddress,
  ticketId,
}: StaffContactParams) {
  const staffRecipient = process.env.STAFF_EMAIL || "staff@roleflow.site";
  const ref = ticketId || `RF-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
  const emailSubject = `[${ref}] [${category}] ${subject} (from ${name})`;

  const safeName = escapeHtml(name);
  const safeEmail = escapeHtml(email);
  const safeCategory = escapeHtml(category);
  const safeSubject = escapeHtml(subject);
  const safeMessage = escapeHtml(message).replace(/\n/g, "<br/>");
  const safeIp = escapeHtml(ipAddress || "Unknown");

  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>RoleFlow Help Desk Inquiry</title>
</head>
<body style="margin: 0; padding: 32px 16px; background-color: #0f0f11; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #f4f4f0;">
  <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 620px; margin: 0 auto; background-color: #18181b; border: 1px solid #27272a; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4);">
    <tr>
      <td style="background-color: #b45309; padding: 16px 24px; color: #ffffff; font-weight: 700; font-size: 14px; letter-spacing: 0.5px;">
        <img src="${emailIconUrl("mail")}" width="18" height="18" alt="" style="display: inline-block; width: 18px; height: 18px; vertical-align: -3px; border: 0; margin-right: 8px;" />
        ROLEFLOW HELP DESK // NEW INQUIRY DISPATCH
      </td>
    </tr>
    <tr>
      <td style="padding: 28px 24px;">
        <div style="margin-bottom: 20px;">
          <span style="display: inline-block; padding: 4px 10px; border-radius: 9999px; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; background-color: rgba(245, 158, 11, 0.15); color: #fbbf24; border: 1px solid rgba(245, 158, 11, 0.3);">
            Ticket ${ref} · ${safeCategory}
          </span>
          <h1 style="margin: 12px 0 6px 0; font-size: 20px; font-weight: 700; color: #f4f4f0; line-height: 28px;">
            ${safeSubject}
          </h1>
          <p style="margin: 0; font-size: 13px; color: #a1a1aa;">
            From: <strong style="color: #f4f4f0;">${safeName}</strong> &lt;<a href="mailto:${safeEmail}" style="color: #f59e0b; text-decoration: underline;">${safeEmail}</a>&gt;
          </p>
        </div>

        <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px; background-color: #121215; border: 1px solid #27272a; border-radius: 8px; font-size: 12px; line-height: 20px;">
          <tr>
            <td style="padding: 10px 14px; border-bottom: 1px solid #27272a; color: #71717a; width: 130px; font-weight: 500;">Submitter:</td>
            <td style="padding: 10px 14px; border-bottom: 1px solid #27272a; color: #f4f4f0;">${safeName} (${safeEmail})</td>
          </tr>
          <tr>
            <td style="padding: 10px 14px; border-bottom: 1px solid #27272a; color: #71717a; font-weight: 500;">Category:</td>
            <td style="padding: 10px 14px; border-bottom: 1px solid #27272a; color: #fbbf24; font-weight: 600;">${safeCategory}</td>
          </tr>
          <tr>
            <td style="padding: 10px 14px; border-bottom: 1px solid #27272a; color: #71717a; font-weight: 500;">Originating IP:</td>
            <td style="padding: 10px 14px; border-bottom: 1px solid #27272a; color: #f4f4f0; font-family: monospace;">${safeIp}</td>
          </tr>
          <tr>
            <td style="padding: 10px 14px; color: #71717a; font-weight: 500;">Reply Action:</td>
            <td style="padding: 10px 14px; color: #10b981; font-weight: 600;">Hit &quot;Reply&quot; in your mail client to answer ${safeName} directly</td>
          </tr>
        </table>

        <div style="margin-bottom: 24px;">
          <div style="font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; color: #a1a1aa; margin-bottom: 8px;">
            User Message:
          </div>
          <div style="background-color: #0c0c0e; border: 1px solid #27272a; border-radius: 8px; padding: 16px; font-size: 14px; line-height: 24px; color: #e4e4e7; white-space: pre-wrap; word-break: break-word;">
${safeMessage}
          </div>
        </div>

        <p style="margin: 0; font-size: 12px; color: #71717a; line-height: 18px;">
          This dispatch was generated from the public contact form at <a href="https://roleflow.site/help" style="color: #f59e0b;">roleflow.site/help</a>.
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
      to: staffRecipient,
      replyTo: `${name} <${email}>`,
      subject: emailSubject,
      html: htmlContent,
    });

    // Also send an automated confirmation to the submitter
    try {
      const userAckHtml = wrapEmailInBrandedTemplate({
        title: "We Received Your Message",
        icon: "check",
        preheader: `Ticket #${ref}: Your inquiry has been received by RoleFlow staff.`,
        body: `Hi ${name},\n\nThank you for reaching out to RoleFlow. We have received your inquiry regarding "${subject}" under reference ticket #${ref}.\n\nA member of our engineering and support team will review your message and reply directly to this email.\n\nSummary of your message:\n${message.slice(0, 400)}${message.length > 400 ? "..." : ""}`,
        ctaText: "Visit Help Center",
        ctaUrl: "https://roleflow.site/help",
      });

      await resend.emails.send({
        from: fromEmail,
        to: email,
        subject: `[${ref}] We received your message: ${subject}`,
        html: userAckHtml,
      });
    } catch (ackError) {
      console.warn("User acknowledgment email warning (non-fatal):", ackError);
    }

    return { success: true, data, ref };
  } catch (error: any) {
    console.error("Resend staff contact error:", error);
    return { success: false, error: error.message || "Failed to deliver contact message" };
  }
}
