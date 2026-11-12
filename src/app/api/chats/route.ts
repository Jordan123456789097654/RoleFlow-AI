import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { Chat } from "@/types";
import { getSessionFromRequest } from "@/lib/auth";

export const dynamic = "force-dynamic";

function extractUserId(req: NextRequest): string | undefined {
  const session = getSessionFromRequest(req);
  if (session?.userId) return session.userId;

  const urlParam = req.nextUrl.searchParams.get("userId");
  if (urlParam && urlParam.startsWith("guest_")) return urlParam;

  return undefined;
}

export async function GET(req: NextRequest) {
  try {
    const userId = extractUserId(req);
    const chats = await db.getAllChats(userId);
    return NextResponse.json({ chats });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const userId = body.userId || extractUserId(req);

    const chat: Chat = {
      id: body.id || "chat-" + Date.now(),
      userId,
      title: body.title || "New Chat",
      projectId: body.projectId,
      pinned: body.pinned || false,
      model: body.model || "roleflow-genesis-1",
      effort: body.effort || "medium",
      messages: body.messages || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await db.saveChat(chat);
    return NextResponse.json({ chat });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const userId = extractUserId(req);
    await db.deleteAllChats(userId);
    return NextResponse.json({ success: true, message: "All chats deleted successfully" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
