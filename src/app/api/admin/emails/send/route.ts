import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import { sendComposedEmail, validateComposeRequest } from "@/lib/email-broadcast";

export const dynamic = "force-dynamic";
// Broadcasts pause one second per batch of 50, so a large audience needs more than the default timeout.
export const maxDuration = 300;

/**
 * Admin only. Sends one composed email.
 *
 * Body: { mode: "broadcast" | "single" | "test", subject, body, to?, icon?, templateId?, ctaText?, ctaUrl?,
 *         date?, incidentId?, actionUrl?, recipientName?, confirmPhrase? }
 * - test:      sends one copy to ADMIN_EMAIL
 * - single:    sends to any address in `to`, registered or not
 * - broadcast: sends to every registered user; requires confirmPhrase === "CONFIRM BROADCAST"
 */
export async function POST(req: NextRequest) {
  const session = getSessionFromRequest(req);
  if (!session?.isAdmin || !session.email) {
    return NextResponse.json({ error: "Administrative privileges required." }, { status: 403 });
  }

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ error: "Request body must be JSON." }, { status: 400 });
  }

  const parsed = validateComposeRequest(raw);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  try {
    const outcome = await sendComposedEmail(parsed.value, session.email);
    return NextResponse.json({ success: outcome.status !== "failed", ...outcome });
  } catch (error: any) {
    console.error("Admin email send error:", error);
    return NextResponse.json({ error: error?.message || "Send failed." }, { status: 500 });
  }
}
