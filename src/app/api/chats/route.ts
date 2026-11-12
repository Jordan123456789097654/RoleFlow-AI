import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { Chat } from "@/types";
import { getSessionFromRequest } from "@/lib/auth";
import { DEFAULT_MODEL, resolveModelId } from "@/lib/models";

export const dynamic = "force-dynamic";

function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0].trim();
    if (first) return first;
  }
  const realIp = req.headers.get("x-real-ip");
  if (realIp) return realIp.trim();
  return "127.0.0.1";
}

function extractUserId(req: NextRequest): string | undefined {
  const session = getSessionFromRequest(req);
  if (session?.userId) return session.userId;

  // For unauthenticated guests, derive deterministic ID from IP hash
  const clientIp = getClientIp(req);
  const ipHash = clientIp.replace(/[^a-zA-Z0-9]/g, "");
  return `guest_${ipHash.slice(0, 16)}`;
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
    const userId = extractUserId(req);

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const chat: Chat = {
      id: body.id || "chat-" + Date.now(),
      userId,
      title: body.title || "New Chat",
      projectId: body.projectId,
      pinned: body.pinned || false,
      model: resolveModelId(body.model) ?? DEFAULT_MODEL,
      effort: body.effort || "medium",
      messages: body.messages || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await db.saveChat(chat, userId);
    return NextResponse.json({ chat });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = getSessionFromRequest(req);
    if (!session || !session.userId) {
      return NextResponse.json(
        { error: "Unauthorized: You must be logged in to delete all chats." },
        { status: 401 }
      );
    }
    const success = await db.deleteAllChats(session.userId);
    return NextResponse.json({ success, message: "All chats deleted successfully" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
