import { NextRequest, NextResponse } from "next/server";
import { db, ADMIN_EMAIL } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const userId = req.headers.get("x-user-id");
    const userEmail = req.headers.get("x-user-email");

    // Authenticate requester as admin
    let isAdmin = false;
    if (userEmail && userEmail.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
      isAdmin = true;
    } else if (userId) {
      const u = await db.getUserById(userId);
      if (u && (u.isAdmin || u.email.toLowerCase() === ADMIN_EMAIL.toLowerCase())) {
        isAdmin = true;
      }
    }

    if (!isAdmin) {
      const cookie = req.cookies.get("roleflow_user");
      if (cookie?.value) {
        try {
          const parsed = JSON.parse(decodeURIComponent(cookie.value));
          if (
            parsed.isAdmin ||
            parsed.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase()
          ) {
            isAdmin = true;
          }
        } catch {}
      }
    }

    if (!isAdmin) {
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
