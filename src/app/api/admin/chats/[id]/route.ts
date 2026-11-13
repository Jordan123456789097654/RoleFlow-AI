import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionFromRequest } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = getSessionFromRequest(req);
    if (!session || !session.isAdmin) {
      return NextResponse.json(
        { error: "Forbidden: Admin privileges required." },
        { status: 403 }
      );
    }

    const chat = await db.getChat(params.id, undefined, true);
    if (!chat) {
      return NextResponse.json(
        { error: "Chat not found" },
        { status: 404 }
      );
    }

    let userEmail: string | undefined = undefined;
    let userName: string | undefined = undefined;

    if (chat.userId && !chat.userId.startsWith("guest_")) {
      const user = await db.getUserById(chat.userId);
      if (user) {
        userEmail = user.email;
        userName = user.name;
      }
    }

    return NextResponse.json({
      success: true,
      chat: {
        ...chat,
        userEmail,
        userName,
      },
    });
  } catch (error: any) {
    console.error("Admin chat detail GET error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to load chat details" },
      { status: 500 }
    );
  }
}
