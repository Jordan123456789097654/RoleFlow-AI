import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionFromRequest } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = getSessionFromRequest(req);
    if (!session || !session.isAdmin) {
      return NextResponse.json(
        { error: "Forbidden: Admin privileges required." },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || undefined;
    const userId = searchParams.get("userId") || undefined;
    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const offset = parseInt(searchParams.get("offset") || "0", 10);

    const result = await db.getAdminChats({ search, userId, limit, offset });

    return NextResponse.json({
      success: true,
      chats: result.chats,
      total: result.total,
    });
  } catch (error: any) {
    console.error("Admin chats GET error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to load chats" },
      { status: 500 }
    );
  }
}
