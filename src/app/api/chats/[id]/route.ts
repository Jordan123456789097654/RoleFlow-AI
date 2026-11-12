import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

function extractUserId(req: NextRequest): string | undefined {
  const headerUser = req.headers.get("x-user-id");
  if (headerUser) return headerUser;

  const urlParam = req.nextUrl.searchParams.get("userId");
  if (urlParam) return urlParam;

  const cookie = req.cookies.get("roleflow_user");
  if (cookie?.value) {
    try {
      const parsed = JSON.parse(decodeURIComponent(cookie.value));
      if (parsed?.id) return parsed.id;
    } catch {}
  }
  return undefined;
}

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = extractUserId(req);
    const chat = await db.getChat(params.id, userId);
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
    const body = await req.json();
    const existing = await db.getChat(params.id, userId);
    if (!existing) {
      return NextResponse.json({ error: "Chat not found or restricted" }, { status: 404 });
    }

    const updated = {
      ...existing,
      ...body,
      userId: existing.userId || userId,
      updatedAt: new Date().toISOString(),
    };

    await db.saveChat(updated);
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
    const success = await db.deleteChat(params.id, userId);
    if (!success) {
      return NextResponse.json({ error: "Chat not found or unauthorized" }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
