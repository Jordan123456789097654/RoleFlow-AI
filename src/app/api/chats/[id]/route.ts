import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionFromRequest } from "@/lib/auth";

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

  const clientIp = getClientIp(req);
  const ipHash = clientIp.replace(/[^a-zA-Z0-9]/g, "");
  return `guest_${ipHash.slice(0, 16)}`;
}

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = extractUserId(req);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const session = getSessionFromRequest(req);
    const chat = await db.getChat(params.id, userId, Boolean(session?.isAdmin));
    if (!chat) {
      return NextResponse.json({ error: "Chat not found or restricted" }, { status: 404 });
    }
    return NextResponse.json({ chat });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = extractUserId(req);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const session = getSessionFromRequest(req);
    const existing = await db.getChat(params.id, userId, Boolean(session?.isAdmin));
    if (!existing) {
      return NextResponse.json({ error: "Chat not found or restricted" }, { status: 404 });
    }

    const body = await req.json();
    const updated = {
      ...existing,
      ...body,
      userId: existing.userId || userId,
      updatedAt: new Date().toISOString(),
    };

    await db.saveChat(updated, userId);
    return NextResponse.json({ chat: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = extractUserId(req);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const success = await db.deleteChat(params.id, userId);
    if (!success) {
      return NextResponse.json({ error: "Chat not found or unauthorized" }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
