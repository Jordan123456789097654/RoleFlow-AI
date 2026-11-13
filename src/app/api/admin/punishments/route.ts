import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionFromRequest } from "@/lib/auth";

export const dynamic = "force-dynamic";

/** Punishment history for one account. Admins only. */
export async function GET(req: NextRequest) {
  const session = getSessionFromRequest(req);
  if (!session || !session.isAdmin) {
    return NextResponse.json({ error: "Forbidden: Administrative privileges required." }, { status: 403 });
  }
  const email = new URL(req.url).searchParams.get("email") || "";
  if (!email.includes("@")) {
    return NextResponse.json({ error: "An email address is required." }, { status: 400 });
  }
  try {
    const punishments = await db.getPunishments(email);
    return NextResponse.json({ success: true, punishments }, { headers: { "Cache-Control": "no-store" } });
  } catch (error: any) {
    console.error("Punishment history error:", error);
    return NextResponse.json({ error: "Failed to load punishment history." }, { status: 500 });
  }
}
