import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionFromRequest } from "@/lib/auth";
import { notifyUser, legalReferralNotice } from "@/lib/notify";
import {
  REFERENCE_PATTERN,
  buildReferralDoc,
  newReferenceNumber,
  renderReferralPdf,
  sendReferralEmail,
  estDate,
} from "@/lib/referrals";
import type { ReferralRecord } from "@/types";

export const dynamic = "force-dynamic";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** All admins can see the referral list. */
export async function GET(req: NextRequest) {
  const session = getSessionFromRequest(req);
  if (!session?.isAdmin) return NextResponse.json({ error: "Administrative privileges required." }, { status: 403 });
  const referrals = await db.listReferrals();
  return NextResponse.json({ referrals });
}

/**
 * Body: { mode: "preview" | "send", incidentId, agencyName, recipientEmail, adminName, adminTitle,
 *         includeExcerpt, holdUserNotice, reference? }
 * preview returns the letter and a reference number without sending anything. send requires the
 * reference from the preview, sends the email with the PDF, notifies the user unless held, and logs it.
 */
export async function POST(req: NextRequest) {
  const session = getSessionFromRequest(req);
  if (!session?.isAdmin || !session.email) {
    return NextResponse.json({ error: "Administrative privileges required." }, { status: 403 });
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Request body must be JSON." }, { status: 400 });
  }

  const log = await db.getModerationLogById(String(body?.incidentId || ""));
  if (!log) return NextResponse.json({ error: "Incident not found." }, { status: 404 });
  if (log.tier !== 1) {
    return NextResponse.json({ error: "Referrals are available for Tier 1 incidents only." }, { status: 400 });
  }

  const agencyName = typeof body?.agencyName === "string" ? body.agencyName.trim().slice(0, 200) : "";
  const recipientEmail = typeof body?.recipientEmail === "string" ? body.recipientEmail.trim().toLowerCase() : "";
  const adminName = typeof body?.adminName === "string" ? body.adminName.trim().slice(0, 120) : "";
  const adminTitle = typeof body?.adminTitle === "string" ? body.adminTitle.trim().slice(0, 120) : "";
  if (!agencyName) return NextResponse.json({ error: "Agency name is required." }, { status: 400 });
  if (!EMAIL_RE.test(recipientEmail)) return NextResponse.json({ error: "Recipient email is not valid." }, { status: 400 });
  if (!adminName || !adminTitle) {
    return NextResponse.json({ error: "Your name and title are required for the signature." }, { status: 400 });
  }

  const includeExcerpt = body?.includeExcerpt === true;
  const holdUserNotice = body?.holdUserNotice === true;
  const now = new Date();
  const userNotified = !holdUserNotice && Boolean(log.userEmail);

  if (body?.mode === "preview") {
    const reference = newReferenceNumber();
    const doc = buildReferralDoc(
      log,
      { agencyName, adminName, adminTitle, includeExcerpt, userNotified },
      reference,
      now
    );
    return NextResponse.json({ reference, subject: doc.subject, body: doc.body, attachmentName: doc.attachmentName });
  }

  // Send path
  const reference = String(body?.reference || "");
  if (!REFERENCE_PATTERN.test(reference)) {
    return NextResponse.json({ error: "Preview the referral before sending." }, { status: 400 });
  }
  if (await db.getReferralByIncident(log.id)) {
    return NextResponse.json({ error: "This incident has already been referred." }, { status: 409 });
  }

  const doc = buildReferralDoc(
    log,
    { agencyName, adminName, adminTitle, includeExcerpt, userNotified },
    reference,
    now
  );
  const pdf = await renderReferralPdf(doc);
  const sent = await sendReferralEmail({ to: recipientEmail, doc, pdf });
  if (!sent.ok) {
    // Nothing is logged on failure, so the admin can retry.
    return NextResponse.json({ error: `Referral not sent: ${sent.error}` }, { status: 502 });
  }

  const record: ReferralRecord = {
    id: `ref_${reference.replace(/[^A-Z0-9]/g, "").toLowerCase()}`,
    reference,
    incidentId: log.id,
    userId: log.userId,
    agencyName,
    recipientEmail,
    adminEmail: session.email,
    adminName,
    adminTitle,
    sentAt: now.toISOString(),
    excerptIncluded: includeExcerpt,
    userNotified,
    status: "sent",
  };
  await db.createReferral(record);

  if (userNotified) {
    notifyUser(log.userEmail, legalReferralNotice({ reference, when: estDate(now.toISOString()) }));
  }

  return NextResponse.json({ referral: record });
}
