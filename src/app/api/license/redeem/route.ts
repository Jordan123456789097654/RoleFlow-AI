import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionFromRequest } from "@/lib/auth";
import { redeemLicenseKey } from "@/lib/license-keys";

export const dynamic = "force-dynamic";

/** Returns the signed-in user's current extra-usage balance, or null. */
export async function GET(req: NextRequest) {
  const session = getSessionFromRequest(req);
  if (!session?.email) {
    return NextResponse.json({ error: "Sign in to use license keys." }, { status: 401 });
  }
  const balance = await db.getActiveLicenseBalance(session.email);
  return NextResponse.json({ balance });
}

/** Body: { key }. Redeems a single-use key for the signed-in user. */
export async function POST(req: NextRequest) {
  const session = getSessionFromRequest(req);
  if (!session?.email) {
    return NextResponse.json({ error: "Sign in to redeem a license key." }, { status: 401 });
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Request body must be JSON." }, { status: 400 });
  }
  const key = typeof body?.key === "string" ? body.key.slice(0, 64) : "";
  if (!key) return NextResponse.json({ error: "Enter a license key." }, { status: 400 });

  const result = await redeemLicenseKey(key, session.email);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json({ balance: result.balance });
}
