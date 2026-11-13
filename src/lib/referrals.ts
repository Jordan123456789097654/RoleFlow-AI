import crypto from "crypto";
import PDFDocument from "pdfkit";
import { fromEmail, resend } from "@/lib/email";
import { wrapEmailInBrandedTemplate } from "@/lib/email-template-html";
import type { ModerationLogEntry } from "@/types";

export const REFERRAL_EXCERPT_CHARS = 200;
export const SUPPORT_EMAIL = "support@roleflow.site";
export const LAW_ENFORCEMENT_URL = "https://roleflow.site/law-enforcement";
export const REFERENCE_PATTERN = /^RF-REF-\d{4}-[A-F0-9]{6}$/;

/** Formats a timestamp in New York time, which shows as EST or EDT. */
export function estDate(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  });
}

export function newReferenceNumber(): string {
  return `RF-REF-${new Date().getUTCFullYear()}-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;
}

export interface ReferralInput {
  agencyName: string;
  adminName: string;
  adminTitle: string;
  includeExcerpt: boolean;
  userNotified: boolean;
}

export interface ReferralDoc {
  reference: string;
  incidentRef: string;
  subject: string;
  body: string;
  attachmentName: string;
}

/** Builds the referral letter. The same text is used for the email body and the PDF. */
export function buildReferralDoc(
  log: ModerationLogEntry,
  input: ReferralInput,
  reference: string,
  sentAt: Date
): ReferralDoc {
  const incidentRef = `INC-${log.id.slice(-8).toUpperCase()}`;
  const sentText = estDate(sentAt.toISOString());
  const flaggedText = estDate(log.createdAt);
  const category = log.category.replace(/_/g, " ").toLowerCase();
  const statusText = log.status === "BANNED" ? "Banned under Tier 1 policy" : log.status.toLowerCase();
  const bullets = (items: string[]) => items.map((i) => `- ${i}`).join("\n");

  const parts: string[] = [
    `RoleFlow Legal and Trust & Safety is writing to refer account activity to ${input.agencyName} for review. RoleFlow is a general-purpose AI assistant platform. Our Trust and Safety team identified the activity described below through our safety systems and a subsequent human review. This referral is made in good faith under our Acceptable Use Policy and our obligations as a service provider.`,
    "Please quote the reference numbers below in any response or further correspondence.",
    `1. Reference Information\n${bullets([
      `Referral reference: ${reference}`,
      `Internal incident reference: ${incidentRef}`,
      `Date of referral: ${sentText}`,
      `RoleFlow user ID: ${log.userId}`,
      `Account status: ${statusText}`,
    ])}`,
    `2. Summary of Activity\nOn ${flaggedText}, RoleFlow's automated safety classifier flagged a message submitted through a RoleFlow account. The message was assessed under our Tier 1 policy, which addresses content relating to ${category}. Tier 1 is RoleFlow's highest severity level and applies zero tolerance to this category.\n\nA RoleFlow Trust and Safety reviewer examined the flagged content and the surrounding conversation context and confirmed the classification. The reviewer concluded that the activity may present a risk of harm to individuals or to the public.`,
  ];

  if (input.includeExcerpt) {
    const excerpt = log.prompt.replace(/\s+/g, " ").slice(0, REFERRAL_EXCERPT_CHARS);
    parts.push(
      `Excerpt of the flagged message (first ${REFERRAL_EXCERPT_CHARS} characters, approved for disclosure by the reviewing administrator):\n"${excerpt}"`
    );
  }

  parts.push(
    `3. Policy Basis\n${bullets([
      `Rule category: ${category}`,
      "Severity: Tier 1 (zero tolerance)",
      "Policy reference: Acceptable Use Policy (Prohibited Content)",
      "Automatic action taken: Account suspended and banned under Tier 1 policy",
      `User notified: ${input.userNotified ? "Yes, the account holder was notified of the ban and of this referral" : "No, notification was withheld for this referral"}`,
    ])}`,
    `4. Preserved Records\nRoleFlow has preserved the following records in accordance with our legal retention obligations and to support any lawful request your agency may make:\n\n${bullets([
      "The flagged message and its timestamp",
      "The conversation context captured at the time of the flag",
      "Account registration details and sign-in history for the period surrounding the activity",
      "The moderation log entry and reviewer notes",
    ])}\n\nThese records will be retained for the period required by law and will not be disclosed to any third party except in response to valid legal process.`,
    `5. Scope and Limitations of This Referral\nThis referral reflects RoleFlow's good-faith assessment of activity on our platform. It is not a determination of criminal liability, intent, or the identity of any individual. RoleFlow has not verified the identity of the account holder beyond the information held in our account system. Any inference about the person behind the account should be made by your agency, based on its own investigation.\n\nRoleFlow does not waive any right, privilege, or protection by making this referral, including any protection under applicable privacy law.`,
    `6. Requests for Further Information\nRoleFlow will provide account records or content only in response to valid legal process, such as a subpoena, court order, or warrant, or in an emergency disclosure request that meets the requirements of applicable law. Requests should be submitted through our law enforcement request process at ${LAW_ENFORCEMENT_URL}. Please include the reference numbers above and identify the legal basis for the request.\n\nRequests that do not include a valid legal basis, a case or agency reference, and a contact for the requesting officer may not be processed.`,
    `7. Acknowledgment Requested\nPlease confirm receipt of this referral by replying to ${SUPPORT_EMAIL} within five (5) business days. In your reply, please indicate:\n\n${bullets([
      "Whether your agency has opened a matter in connection with this referral, and its case number if one has been assigned",
      "Whether any further information is required from RoleFlow to assess the referral",
      "The name and contact details of the officer responsible for the matter",
    ])}`,
    `8. Contact\nFor more information, please contact us at ${SUPPORT_EMAIL}. Replies are monitored during business hours, Monday to Friday, 9:00 AM to 5:00 PM EST. For urgent matters involving an imminent threat to life, state clearly in your reply that the matter is an emergency.\n\nA summary of this referral is attached as ${reference}_Referral_Summary.pdf.`,
    "Nothing in this referral limits any right or remedy available to RoleFlow under its Terms of Service or applicable law.",
    `Respectfully,\n\n${input.adminName}\n${input.adminTitle}\nRoleFlow Legal and Trust & Safety\n${SUPPORT_EMAIL}`,
    "Confidentiality notice: This message and its attachments are confidential and intended solely for the named recipient. If you have received this message in error, please notify support@roleflow.site immediately and delete it. This message is a referral, not a request for records, and sending it does not waive any privilege or protection."
  );

  return {
    reference,
    incidentRef,
    subject: `Referral ${reference}: Tier 1 Account Activity, Incident ${incidentRef}`,
    body: parts.join("\n\n"),
    attachmentName: `${reference}_Referral_Summary.pdf`,
  };
}

/** Renders the letter as a PDF. Lines like "1. Heading" are set in bold. */
export function renderReferralPdf(doc: ReferralDoc): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const pdf = new PDFDocument({ size: "LETTER", margin: 56 });
    const chunks: Buffer[] = [];
    pdf.on("data", (c: Buffer) => chunks.push(c));
    pdf.on("end", () => resolve(Buffer.concat(chunks)));
    pdf.on("error", reject);

    pdf.font("Helvetica-Bold").fontSize(14).text("RoleFlow Legal and Trust & Safety");
    pdf.font("Helvetica").fontSize(9).fillColor("#555555").text(`Reference ${doc.reference} · Incident ${doc.incidentRef}`);
    pdf.moveDown(1).fillColor("#000000");

    for (const block of doc.body.split("\n\n")) {
      const isHeading = /^\d\. /.test(block);
      pdf.font(isHeading ? "Helvetica-Bold" : "Helvetica").fontSize(10.5).text(block, { lineGap: 2 });
      pdf.moveDown(0.6);
    }
    pdf.end();
  });
}

/** Emails the referral to the agency with the PDF attached. Returns ok:false instead of throwing. */
export async function sendReferralEmail(opts: {
  to: string;
  doc: ReferralDoc;
  pdf: Buffer;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const { error } = await resend.emails.send({
      from: fromEmail,
      to: opts.to,
      replyTo: SUPPORT_EMAIL,
      subject: opts.doc.subject,
      html: wrapEmailInBrandedTemplate({
        title: `Referral ${opts.doc.reference}`,
        body: opts.doc.body,
        footnote: "Law enforcement referral · Confidential",
      }),
      attachments: [{ filename: opts.doc.attachmentName, content: opts.pdf.toString("base64") }],
    } as any);
    if (error) return { ok: false, error: (error as any).message || "The email provider rejected the message." };
    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: e?.message || "Send failed." };
  }
}
