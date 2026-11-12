import { NextRequest, NextResponse } from "next/server";
import { db, ADMIN_EMAIL } from "@/lib/db";
import { ModerationStatus } from "@/types";

export const dynamic = "force-dynamic";

async function verifyAdminAuth(req: NextRequest): Promise<boolean> {
  const userId = req.headers.get("x-user-id");
  const userEmail = req.headers.get("x-user-email");

  if (userEmail && userEmail.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
    return true;
  }

  if (userId) {
    const u = await db.getUserById(userId);
    if (u && (u.isAdmin || u.email.toLowerCase() === ADMIN_EMAIL.toLowerCase())) {
      return true;
    }
  }

  const cookie = req.cookies.get("roleflow_user");
  if (cookie?.value) {
    try {
      const parsed = JSON.parse(decodeURIComponent(cookie.value));
      if (
        parsed.isAdmin ||
        parsed.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase()
      ) {
        return true;
      }
    } catch {}
  }

  return false;
}

export async function GET(req: NextRequest) {
  try {
    const isAdmin = await verifyAdminAuth(req);
    if (!isAdmin) {
      return NextResponse.json(
        { error: "Forbidden: Administrative privileges required." },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") || undefined;
    const tierParam = searchParams.get("tier");
    const tier = tierParam ? parseInt(tierParam, 10) : undefined;

    const logs = await db.getModerationLogs({ status, tier });

    return NextResponse.json({
      success: true,
      count: logs.length,
      logs,
    });
  } catch (error: any) {
    console.error("Moderation logs retrieval error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to retrieve moderation queue logs" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const isAdmin = await verifyAdminAuth(req);
    if (!isAdmin) {
      return NextResponse.json(
        { error: "Forbidden: Administrative privileges required." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { logId, action, status } = body;

    if (!logId) {
      return NextResponse.json({ error: "logId is required" }, { status: 400 });
    }

    const logEntry = await db.getModerationLogById(logId);
    if (!logEntry) {
      return NextResponse.json({ error: "Moderation log not found" }, { status: 404 });
    }

    let targetStatus: ModerationStatus = "RESOLVED";

    if (action === "UNBAN_DISMISS" || status === "RESOLVED") {
      targetStatus = "RESOLVED";
      if (logEntry.userEmail && logEntry.userEmail !== "guest") {
        await db.unbanUser(logEntry.userEmail);
      } else if (logEntry.userId) {
        await db.unbanUser(logEntry.userId);
      }
    } else if (action === "CONFIRM_BAN" || status === "BANNED") {
      targetStatus = "BANNED";
      if (logEntry.userEmail && logEntry.userEmail !== "guest") {
        await db.banUser(logEntry.userEmail);
      } else if (logEntry.userId) {
        await db.banUser(logEntry.userId);
      }
    } else if (status) {
      targetStatus = status;
    }

    const updated = await db.updateModerationLogStatus(logId, targetStatus);

    return NextResponse.json({
      success: true,
      log: updated,
      message: `Incident ${logId} updated to ${targetStatus}`,
    });
  } catch (error: any) {
    console.error("Moderation log update error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update moderation incident" },
      { status: 500 }
    );
  }
}
