import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
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

    const updatedLog = await db.updateModerationLogStatus(
      logId,
      "APPEALED",
      appealNote.trim()
    );

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
