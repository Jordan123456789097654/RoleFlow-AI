import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionFromRequest } from "@/lib/auth";
import { appealReceivedNotice, notifyUser } from "@/lib/notify";

export async function POST(req: NextRequest) {
  try {
    const session = getSessionFromRequest(req);
    const body = await req.json();
    const { logId, appealNote } = body;

    if (!logId || typeof logId !== "string") {
      return NextResponse.json({ error: "logId is required" }, { status: 400 });
    }

    if (!appealNote || typeof appealNote !== "string" || !appealNote.trim()) {
      return NextResponse.json(
        { error: "A brief explanation or context is required for appeal" },
        { status: 400 }
      );
    }

    const existingLog = await db.getModerationLogById(logId);
    if (!existingLog) {
      return NextResponse.json(
        { error: "Incident record not found or expired" },
        { status: 404 }
      );
    }

    // Verify ownership: requester must match log user or be admin
    const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "127.0.0.1";
    const isOwner =
      Boolean(session?.isAdmin) ||
      (session && existingLog.userId === session.userId) ||
      (session && existingLog.userEmail.toLowerCase() === session.email.toLowerCase()) ||
      (!session && existingLog.ipAddress === clientIp);

    if (!isOwner) {
      return NextResponse.json(
        { error: "Forbidden: You are not authorized to appeal this incident record." },
        { status: 403 }
      );
    }

    const updatedLog = await db.updateModerationLogStatus(
      logId,
      "APPEALED",
      appealNote.trim()
    );

    notifyUser(existingLog.userEmail, appealReceivedNotice({ logId }));

    return NextResponse.json({
      success: true,
      message: "Your appeal has been submitted for administrative review.",
      log: updatedLog,
    });
  } catch (error: any) {
    console.error("Moderation appeal submission error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to submit appeal" },
      { status: 500 }
    );
  }
}
