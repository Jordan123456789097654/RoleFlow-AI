import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionFromRequest } from "@/lib/auth";
import { policyChangeNotice, sendNotice } from "@/lib/notify";

export const dynamic = "force-dynamic";

const ALLOWED_DOCS: Record<string, { title: string; url: string }> = {
  terms: { title: "Terms of Service", url: "https://roleflow.site/terms" },
  privacy: { title: "Privacy Policy", url: "https://roleflow.site/privacy" },
  "acceptable-use": { title: "Acceptable Use Policy", url: "https://roleflow.site/acceptable-use" },
  moderation: { title: "Moderation and Appeals Policy", url: "https://roleflow.site/moderation" },
  "ai-output": { title: "AI Output and Content Policy", url: "https://roleflow.site/ai-output" },
  cookies: { title: "Cookie Policy", url: "https://roleflow.site/cookies" },
};

/**
 * Admin only. Notifies every account that a policy changed. Policy notices are required
 * by the Terms (at least 14 days before a material change takes effect).
 *
 * Body: { doc: "terms" | "privacy" | ..., effectiveDate: "YYYY-MM-DD", summary: string, dryRun?: boolean }
 */
export async function POST(req: NextRequest) {
  const session = getSessionFromRequest(req);
  if (!session?.isAdmin) {
    return NextResponse.json({ error: "Administrative privileges required." }, { status: 403 });
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Request body must be JSON." }, { status: 400 });
  }

  const doc = ALLOWED_DOCS[body?.doc];
  if (!doc) {
    return NextResponse.json({ error: `doc must be one of: ${Object.keys(ALLOWED_DOCS).join(", ")}.` }, { status: 400 });
  }
  const effectiveDate = typeof body?.effectiveDate === "string" ? body.effectiveDate : "";
  const effective = Date.parse(effectiveDate);
  if (!effective) {
    return NextResponse.json({ error: "effectiveDate must be a valid date." }, { status: 400 });
  }
  // Terms commit to 14 days' notice for material changes.
  const daysAhead = (effective - Date.now()) / 86_400_000;
  if (daysAhead < 14) {
    return NextResponse.json(
      { error: "effectiveDate must be at least 14 days from today for a material change." },
      { status: 400 }
    );
  }
  const summary = typeof body?.summary === "string" ? body.summary.trim() : "";
  if (summary.length < 10 || summary.length > 600) {
    return NextResponse.json({ error: "summary must be 10 to 600 characters." }, { status: 400 });
  }

  const users = (await db.getAllUsers()).filter((u) => u.email);
  if (body?.dryRun) {
    return NextResponse.json({ dryRun: true, recipients: users.length });
  }

  const notice = policyChangeNotice({
    docTitle: doc.title,
    effectiveDate,
    summary,
    url: doc.url,
  });

  // Send in small batches to stay within provider rate limits.
  let sent = 0;
  for (let i = 0; i < users.length; i += 10) {
    await Promise.all(users.slice(i, i + 10).map((u) => sendNotice(u.email, notice)));
    sent += Math.min(10, users.length - i);
  }

  return NextResponse.json({ success: true, recipients: users.length, attempted: sent });
}
