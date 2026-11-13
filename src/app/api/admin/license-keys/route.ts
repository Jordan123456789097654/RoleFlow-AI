import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionFromRequest } from "@/lib/auth";
import type { LicenseKeyRecord } from "@/types";
import {
  LICENSE_DURATION_DAYS,
  LICENSE_MAX_MESSAGES,
  createLicenseKey,
  licenseKeyStatus,
  sendLicenseKeyEmail,
} from "@/lib/license-keys";

export const dynamic = "force-dynamic";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function forbidden() {
  return NextResponse.json({ error: "Administrative privileges required." }, { status: 403 });
}

/** Lists keys with their display status. Key hashes are never returned. */
export async function GET(req: NextRequest) {
  const session = getSessionFromRequest(req);
  if (!session?.isAdmin) return forbidden();

  const records = await db.listLicenseKeys();
  const now = Date.now();
  return NextResponse.json({
    keys: records.map((r: LicenseKeyRecord) => {
      const { keyHash: _hash, ...rest } = r;
      return { ...rest, status: licenseKeyStatus(r, now) };
    }),
  });
}

/**
 * Creates one key. Body: { amount, durationDays (7|30|90|365|null), note?, recipientEmail? }.
 * The plain key is returned once. If recipientEmail is set, the key is also emailed.
 */
export async function POST(req: NextRequest) {
  const session = getSessionFromRequest(req);
  if (!session?.isAdmin || !session.email) return forbidden();

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Request body must be JSON." }, { status: 400 });
  }

  const amount = Number(body?.amount);
  if (!Number.isInteger(amount) || amount < 1 || amount > LICENSE_MAX_MESSAGES) {
    return NextResponse.json(
      { error: `Amount must be a whole number from 1 to ${LICENSE_MAX_MESSAGES}.` },
      { status: 400 }
    );
  }

  const durationDays = body?.durationDays === null ? null : Number(body?.durationDays);
  if (!(LICENSE_DURATION_DAYS as readonly (number | null)[]).includes(durationDays)) {
    return NextResponse.json({ error: "Choose a duration from the list, or no expiry." }, { status: 400 });
  }

  const note = typeof body?.note === "string" ? body.note.trim().slice(0, 200) : "";
  const recipientEmail =
    typeof body?.recipientEmail === "string" ? body.recipientEmail.trim().toLowerCase() : "";
  if (recipientEmail && !EMAIL_RE.test(recipientEmail)) {
    return NextResponse.json({ error: "Recipient email is not valid." }, { status: 400 });
  }

  const { record, plainKey } = await createLicenseKey({
    amount,
    durationDays,
    note,
    recipientEmail,
    createdBy: session.email,
  });

  let emailed = false;
  if (recipientEmail) {
    emailed = await sendLicenseKeyEmail({ to: recipientEmail, plainKey, amount, durationDays });
    if (emailed) await db.markLicenseKeySent(record.id, new Date().toISOString());
  }

  return NextResponse.json({
    key: plainKey,
    emailed,
    record: { ...record, keyHash: undefined, status: "unused" },
  });
}
