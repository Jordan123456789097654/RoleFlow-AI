import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionFromRequest } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    // Authenticate requester using cryptographically signed session
    const session = getSessionFromRequest(req);

    if (!session || !session.isAdmin) {
      return NextResponse.json(
        { error: "Forbidden: Admin privileges required." },
        { status: 403 }
      );
    }

    const result = await db.resetAllUsage();
    return NextResponse.json({
      success: true,
      message: `Usage limits reset successfully (${result.usersReset} users, ${result.guestsReset} guests).`,
      result,
    });
  } catch (error: any) {
    console.error("Reset limits error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to reset limits" },
      { status: 500 }
    );
  }
}
