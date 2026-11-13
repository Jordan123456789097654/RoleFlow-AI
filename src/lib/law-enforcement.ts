import crypto from "crypto";
import { db, ADMIN_EMAIL } from "@/lib/db";
import { fromEmail, resend } from "@/lib/email";
import { wrapEmailInBrandedTemplate } from "@/lib/email-template-html";
import type { LawRequestRecord, LawRequestType } from "@/types";
import { LAW_REQUEST_TYPES } from "@/lib/law-request-types";

export { LAW_REQUEST_TYPES };
export const SUPPORT_EMAIL = "support@roleflow.site";
export const PRESERVATION_DAYS = 90;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Personal webmail providers. Agency requests must come from an official agency address. */
const PERSONAL_EMAIL_DOMAINS = new Set([
  "gmail.com", "googlemail.com", "yahoo.com", "ymail.com", "outlook.com", "hotmail.com",
  "live.com", "msn.com", "aol.com", "icloud.com", "me.com", "mac.com", "proton.me",
  "protonmail.com", "gmx.com", "gmx.net", "mail.com", "zoho.com", "yandex.com", "tutanota.com",
]);

export interface LawRequestInput {
  requestType: LawRequestType;
  agencyName: string;
  officerName: string;
  badgeId: string;
  caseNumber: string;
  accountIdentifier: string;
  contactEmail: string;
  statement: string;
  /** The requesting officer certified the request. Required before submission. */
  certified: boolean;
}

export function validateLawRequest(raw: any): { ok: true; value: LawRequestInput } | { ok: false; error: string } {
  const str = (k: string, max: number) => (typeof raw?.[k] === "string" ? raw[k].trim().slice(0, max) : "");
  const value: LawRequestInput = {
    requestType: raw?.requestType,
    agencyName: str("agencyName", 200),
    officerName: str("officerName", 120),
    badgeId: str("badgeId", 60),
    caseNumber: str("caseNumber", 120),
    accountIdentifier: str("accountIdentifier", 200),
    contactEmail: str("contactEmail", 200).toLowerCase(),
    statement: str("statement", 4000),
    certified: raw?.certified === true,
  };
  if (!LAW_REQUEST_TYPES.some((t) => t.id === value.requestType)) return { ok: false, error: "Choose a request type." };
  for (const [key, label] of [
    ["agencyName", "Agency name"],
    ["officerName", "Officer name"],
    ["badgeId", "Badge or ID number"],
    ["caseNumber", "Case number"],
    ["accountIdentifier", "Account identifier"],
    ["contactEmail", "Agency contact email"],
  ] as const) {
    if (!value[key]) return { ok: false, error: `${label} is required.` };
  }
  if (!EMAIL_RE.test(value.contactEmail)) return { ok: false, error: "Agency contact email is not valid." };
  const domain = value.contactEmail.split("@")[1];
  if (PERSONAL_EMAIL_DOMAINS.has(domain)) {
    return { ok: false, error: "Use an official agency email address. Personal email providers are not accepted." };
  }
  if (value.statement.length < 20) {
    return { ok: false, error: "Add a statement of at least 20 characters describing the request and its legal basis." };
  }
  if (!value.certified) {
    return {
      ok: false,
      error: "Certify that you are an authorized representative of the agency and that the request is made under valid legal process or emergency authority.",
    };
  }
  return { ok: true, value };
}

function newReference(): string {
  const day = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  return `LE-${day}-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;
}

async function sendPlain(to: string, subject: string, body: string, footnote?: string): Promise<void> {
  try {
    await resend.emails.send({
      from: fromEmail,
      to,
      replyTo: SUPPORT_EMAIL,
      subject,
      html: wrapEmailInBrandedTemplate({ title: subject, body, footnote }),
    });
  } catch (error) {
    console.error("Law enforcement email failed:", subject, error);
  }
}

/** Stores a request, then notifies support, admins (for emergencies), and the requester. */
export async function createLawRequest(input: LawRequestInput): Promise<LawRequestRecord> {
  const now = new Date();
  const preservation = input.requestType === "preservation";
  const record: LawRequestRecord = {
    id: `lr_${crypto.randomBytes(8).toString("hex")}`,
    reference: newReference(),
    requestType: input.requestType,
    agencyName: input.agencyName,
    officerName: input.officerName,
    badgeId: input.badgeId,
    caseNumber: input.caseNumber,
    accountIdentifier: input.accountIdentifier,
    contactEmail: input.contactEmail,
    statement: input.statement,
    emergency: input.requestType === "emergency_disclosure",
    preservationExpiresAt: preservation
      ? new Date(now.getTime() + PRESERVATION_DAYS * 86400000).toISOString()
      : null,
    status: "received",
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  };
  await db.createLawRequest(record);

  const typeLabel = LAW_REQUEST_TYPES.find((t) => t.id === record.requestType)?.label ?? record.requestType;
  const summary = [
    `Reference: ${record.reference}`,
    `Type: ${typeLabel}${record.emergency ? " (EMERGENCY)" : ""}`,
    `Agency: ${record.agencyName}`,
    `Officer: ${record.officerName} (badge or ID ${record.badgeId})`,
    `Case number: ${record.caseNumber}`,
    `Account identifier: ${record.accountIdentifier}`,
    `Agency contact: ${record.contactEmail}`,
    record.preservationExpiresAt ? `Preserve until: ${record.preservationExpiresAt}` : "",
    "",
    "Statement:",
    record.statement,
  ]
    .filter(Boolean)
    .join("\n");

  await sendPlain(
    SUPPORT_EMAIL,
    `${record.emergency ? "EMERGENCY " : ""}Law enforcement request ${record.reference}`,
    summary,
    "Manual verification required before any action."
  );

  if (record.emergency) {
    await sendPlain(
      ADMIN_EMAIL || SUPPORT_EMAIL,
      `EMERGENCY law enforcement request ${record.reference}`,
      `An emergency disclosure request was received and is waiting for review in the law enforcement queue.\n\n${summary}`
    );
  }

  await sendPlain(
    record.contactEmail,
    `We received your request ${record.reference}`,
    `Thank you. RoleFlow received your ${typeLabel.toLowerCase()} for case ${record.caseNumber}. Your reference is ${record.reference}.\n\nA member of our team reviews every request manually before any action is taken. Please reply to this email with your reference number and send any signed legal document to ${SUPPORT_EMAIL}.\n\nBusiness hours: Monday to Friday, 9:00 AM to 5:00 PM EST.`
  );

  return record;
}
