import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionFromRequest } from "@/lib/auth";

export const dynamic = "force-dynamic";

/** Admin only. Recent email sends with delivery counts. */
export async function GET(req: NextRequest) {
  const session = getSessionFromRequest(req);
  if (!session?.isAdmin) {
    return NextResponse.json({ error: "Administrative privileges required." }, { status: 403 });
  }
  try {
    const history = await db.getBroadcastHistory(100);
    return NextResponse.json({ success: true, history });
  } catch (error: any) {
    console.error("Admin email history error:", error);
    return NextResponse.json({ error: error?.message || "Failed to load history." }, { status: 500 });
  }
}
