import crypto from "crypto";
import { db } from "@/lib/db";
import { fromEmail, resend } from "@/lib/email";
import { DEFAULT_APP_URL, wrapEmailInBrandedTemplate } from "@/lib/email-template-html";
import type { LicenseKeyRecord, LicenseKeyStatus } from "@/types";

/** Durations an admin can choose. null means the balance never expires. */
export const LICENSE_DURATION_DAYS = [7, 30, 90, 365, null] as const;
export const LICENSE_MAX_MESSAGES = 10000;

// No 0, O, 1 or I, so keys are easy to read aloud and copy.
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

/** Creates a key in the form RF-XXXX-XXXX-XXXX. */
export function generateLicenseKey(): string {
  const bytes = crypto.randomBytes(12);
  let body = "";
  for (let i = 0; i < bytes.length; i++) body += ALPHABET[bytes[i] % ALPHABET.length];
  return formatLicenseKey(body);
}

function formatLicenseKey(body: string): string {
  return `RF-${body.slice(0, 4)}-${body.slice(4, 8)}-${body.slice(8, 12)}`;
}

/**
 * Canonicalises user input: ignores case, spaces and dashes. Returns null when the input
 * cannot be a key, so no database lookup is needed.
 */
export function canonicalLicenseKey(raw: string): string | null {
  let compact = String(raw || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (compact.startsWith("RF")) compact = compact.slice(2);
  if (compact.length !== 12) return null;
  return formatLicenseKey(compact);
}

export function hashLicenseKey(canonical: string): string {
  return crypto.createHash("sha256").update(canonical).digest("hex");
}

export function licenseKeyStatus(record: LicenseKeyRecord, now: number = Date.now()): LicenseKeyStatus {
  if (record.status !== "redeemed") return "unused";
  if (record.expiresAt && Date.parse(record.expiresAt) <= now) return "expired";
  if (record.remaining <= 0) return "used_up";
  return "active";
}

export function durationLabel(days: number | null): string {
  if (days === null) return "No expiry";
  if (days === 365) return "1 year";
  return `${days} days`;
}

/** Generates a key, stores its hash, and returns the plain key once. */
export async function createLicenseKey(input: {
  amount: number;
  durationDays: number | null;
  note?: string;
  recipientEmail?: string;
  createdBy: string;
}): Promise<{ record: LicenseKeyRecord; plainKey: string }> {
  const plainKey = generateLicenseKey();
  const body = plainKey.replace(/-/g, "").slice(2);
  const id = `lk_${crypto.randomBytes(8).toString("hex")}`;
  const record: LicenseKeyRecord = {
    id,
    keyHash: hashLicenseKey(plainKey),
    keyPrefix: `RF-${body.slice(0, 4)}-…${body.slice(8, 12)}`,
    amount: input.amount,
    durationDays: input.durationDays,
    status: "unused",
    remaining: input.amount,
    note: input.note || undefined,
    recipientEmail: input.recipientEmail || undefined,
    createdBy: input.createdBy,
    createdAt: new Date().toISOString(),
  };
  await db.createLicenseKey(record);
  return { record, plainKey };
}

export async function sendLicenseKeyEmail(opts: {
  to: string;
  plainKey: string;
  amount: number;
  durationDays: number | null;
}): Promise<boolean> {
  const expiry =
    opts.durationDays === null
      ? "These extra messages do not expire."
      : `These extra messages expire ${opts.durationDays} days after you redeem the key.`;
  const html = wrapEmailInBrandedTemplate({
    title: "Your RoleFlow license key",
    icon: "key",
    body: [
      `You have been given ${opts.amount} extra messages on RoleFlow. They are used after your daily limit runs out, in chat and in the API.`,
      `Your license key:\n\n${opts.plainKey}`,
      `To redeem it, sign in, open Settings, go to Account & quota, and enter the key. The key works once.`,
      expiry,
    ].join("\n\n"),
    ctaText: "Open RoleFlow",
    ctaUrl: DEFAULT_APP_URL,
  });
  try {
    await resend.emails.send({
      from: fromEmail,
      to: opts.to,
      subject: "Your RoleFlow license key",
      html,
    });
    return true;
  } catch (error) {
    console.error("License key email failed:", error);
    return false;
  }
}

export type RedeemResult =
  | { ok: true; balance: { remaining: number; expiresAt: string | null } }
  | { ok: false; error: string };

/**
 * Redeems a key for a user. Rules: the key must exist and be unused, and the user must have
 * no unspent, unexpired balance from an earlier key.
 */
export async function redeemLicenseKey(rawKey: string, email: string): Promise<RedeemResult> {
  const canonical = canonicalLicenseKey(rawKey);
  if (!canonical) return { ok: false, error: "That license key isn't valid." };

  const cleanEmail = email.toLowerCase().trim();
  const record = await db.getLicenseKeyByHash(hashLicenseKey(canonical));
  if (!record) return { ok: false, error: "That license key isn't valid." };
  if (record.status !== "unused") return { ok: false, error: "This license key has already been used." };

  const current = await db.getActiveLicenseBalance(cleanEmail);
  if (current) {
    return {
      ok: false,
      error: `You still have ${current.remaining} extra messages from an earlier key. Use them up before redeeming another key.`,
    };
  }

  const now = Date.now();
  const expiresAt =
    record.durationDays === null ? null : new Date(now + record.durationDays * 86400000).toISOString();

  // Claim atomically: a key that another request just redeemed fails here.
  const claimed = await db.claimLicenseKey(record.id, cleanEmail, new Date(now).toISOString(), expiresAt);
  if (!claimed) return { ok: false, error: "This license key has already been used." };

  return { ok: true, balance: { remaining: record.amount, expiresAt } };
}
