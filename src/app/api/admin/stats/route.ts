import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionFromRequest } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    // Authenticate requester using cryptographically signed session
    const session = getSessionFromRequest(req);

    if (!session || !session.isAdmin) {
      return NextResponse.json(
        { error: "Forbidden: Admin privileges required." },
        { status: 403 }
      );
    }

    const stats = await db.getAdminStats();
    return NextResponse.json({ success: true, stats });
  } catch (error: any) {
    console.error("Admin stats error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to load admin stats" },
      { status: 500 }
    );
  }
}
