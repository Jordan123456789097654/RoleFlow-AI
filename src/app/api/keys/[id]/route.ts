import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionFromRequest } from "@/lib/auth";

export const dynamic = "force-dynamic";

/** Revokes one of the caller's keys. Keys are never hard-deleted, so usage history stays intact. */
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = getSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ error: "Sign in to manage API keys." }, { status: 401 });
    }

    const revoked = await db.revokeApiKey(params.id, session.userId);
    if (!revoked) {
      return NextResponse.json({ error: "API key not found." }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("API key revoke error:", error);
    return NextResponse.json({ error: "Could not revoke the API key." }, { status: 500 });
  }
}
