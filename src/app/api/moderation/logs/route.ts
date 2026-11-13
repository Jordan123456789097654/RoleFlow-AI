import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionFromRequest } from "@/lib/auth";
import { AdminNote, ModerationLogEntry, ModerationStatus } from "@/types";
import { appealDecisionNotice, notifyUser, temporarySuspensionNotice, warningNotice } from "@/lib/notify";

export const dynamic = "force-dynamic";

/** Returns the signed-in admin, or null. Every moderation action is attributed to this person. */
function getAdmin(req: NextRequest): { email: string } | null {
  const session = getSessionFromRequest(req);
  return session && session.isAdmin ? { email: session.email } : null;
}

const MAX_SUSPENSION_DAYS = 365;
const MAX_NOTE_LENGTH = 2000;
const STATUSES: ModerationStatus[] = ["FLAGGED", "BANNED", "APPEALED", "RESOLVED", "ESCALATED"];

function newAdminNote(text: string, authorEmail: string, kind: "note" | "action"): AdminNote {
  return {
    id: `note_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`,
    text,
    authorEmail,
    createdAt: new Date().toISOString(),
    kind,
  };
}

export async function GET(req: NextRequest) {
  try {
    if (!getAdmin(req)) {
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
    const admin = getAdmin(req);
    if (!admin) {
      return NextResponse.json(
        { error: "Forbidden: Administrative privileges required." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { logId, action, status, note, days } = body;

    if (!logId) {
      return NextResponse.json({ error: "logId is required" }, { status: 400 });
    }

    const logEntry = await db.getModerationLogById(logId);
    if (!logEntry) {
      return NextResponse.json({ error: "Moderation log not found" }, { status: 404 });
    }

    // Guests have no account, so account actions go to the user id.
    const target = logEntry.userEmail && logEntry.userEmail !== "guest" ? logEntry.userEmail : logEntry.userId;

    // Staff note: records context without changing the incident status.
    if (action === "NOTE") {
      const text = typeof note === "string" ? note.trim() : "";
      if (!text) {
        return NextResponse.json({ error: "A note cannot be empty." }, { status: 400 });
      }
      if (text.length > MAX_NOTE_LENGTH) {
        return NextResponse.json({ error: `Notes are limited to ${MAX_NOTE_LENGTH} characters.` }, { status: 400 });
      }
      const withNote = await db.addModerationNote(logId, newAdminNote(text, admin.email, "note"));
      return NextResponse.json({ success: true, log: withNote, message: "Note added." });
    }

    // Map the legacy `status` field onto the equivalent action.
    const effectiveAction: string | undefined =
      action ||
      (status === "RESOLVED" ? "UNBAN_DISMISS" : status === "BANNED" ? "CONFIRM_BAN" : status ? "SET_STATUS" : undefined);

    let updated: ModerationLogEntry | null = null;
    let auditText = "";
    let message = "";

    switch (effectiveAction) {
      case "UNBAN_DISMISS": {
        await db.unbanUser(target);
        updated = await db.updateModerationLogStatus(logId, "RESOLVED");
        auditText = "Dismissed the incident and lifted any ban or suspension.";
        message = "Incident dismissed and ban lifted.";
        notifyUser(logEntry.userEmail, appealDecisionNotice({ logId, outcome: "RESOLVED" }));
        break;
      }

      case "CONFIRM_BAN": {
        await db.banUser(target);
        updated = await db.updateModerationLogStatus(logId, "BANNED");
        auditText = "Confirmed a permanent ban.";
        message = "Ban confirmed.";
        notifyUser(logEntry.userEmail, appealDecisionNotice({ logId, outcome: "BANNED" }));
        break;
      }

      case "WARN": {
        const strikes = await db.incrementStrikes(target);
        updated = await db.updateModerationLogStatus(logId, "RESOLVED");
        auditText = `Sent a warning. The account now has ${strikes} strike${strikes === 1 ? "" : "s"}.`;
        message = `Warning sent. Strike ${strikes}.`;
        notifyUser(logEntry.userEmail, warningNotice({ logId, strikes }));
        break;
      }

      case "SUSPEND": {
        const n = Number(days);
        if (!Number.isInteger(n) || n < 1 || n > MAX_SUSPENSION_DAYS) {
          return NextResponse.json(
            { error: `Suspension length must be a whole number of days from 1 to ${MAX_SUSPENSION_DAYS}.` },
            { status: 400 }
          );
        }
        const until = new Date(Date.now() + n * 24 * 60 * 60 * 1000).toISOString();
        const suspended = await db.suspendUserUntil(target, until);
        if (!suspended) {
          return NextResponse.json({ error: "The account for this incident no longer exists." }, { status: 404 });
        }
        updated = await db.updateModerationLogStatus(logId, "BANNED");
        auditText = `Suspended the account for ${n} day${n === 1 ? "" : "s"}, until ${until}.`;
        message = `Account suspended for ${n} day${n === 1 ? "" : "s"}.`;
        notifyUser(logEntry.userEmail, temporarySuspensionNotice({ logId, until }));
        break;
      }

      case "ESCALATE": {
        updated = await db.updateModerationLogStatus(logId, "ESCALATED");
        auditText = "Escalated for senior review.";
        message = "Incident escalated.";
        break;
      }

      case "REOPEN": {
        updated = await db.updateModerationLogStatus(logId, "FLAGGED");
        auditText = "Reopened and returned to the queue.";
        message = "Incident reopened.";
        break;
      }

      case "SET_STATUS": {
        if (!STATUSES.includes(status)) {
          return NextResponse.json({ error: `Invalid status: ${status}` }, { status: 400 });
        }
        updated = await db.updateModerationLogStatus(logId, status);
        auditText = `Status set to ${status}.`;
        break;
      }

      default:
        return NextResponse.json({ error: `Invalid action: ${action}` }, { status: 400 });
    }

    if (auditText) {
      updated = (await db.addModerationNote(logId, newAdminNote(auditText, admin.email, "action"))) ?? updated;
    }

    return NextResponse.json({
      success: true,
      log: updated,
      message: message || `Incident ${logId} updated.`,
    });
  } catch (error: any) {
    console.error("Moderation log update error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update moderation incident" },
      { status: 500 }
    );
  }
}
