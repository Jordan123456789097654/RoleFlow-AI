import { NextRequest, NextResponse } from "next/server";
import { db, ADMIN_EMAIL } from "@/lib/db";
import { getSessionFromRequest } from "@/lib/auth";
import type { Punishment, PunishmentKind } from "@/types";
import { notifyUser, temporarySuspensionNotice, warningNotice } from "@/lib/notify";

export const dynamic = "force-dynamic";

const ACTIONS_NEEDING_REASON = ["warnUser", "suspendUser", "banUser"];

/** Writes a permanent punishment record for an account. */
async function recordPunishment(
  target: string,
  adminEmail: string,
  fields: { kind: PunishmentKind; reason: string; incidentId?: string; durationDays?: number; until?: string }
) {
  const clean = String(target).toLowerCase().trim();
  const account = clean.includes("@") ? await db.getUserByEmail(clean) : await db.getUserById(target);
  const record: Punishment = {
    id: `pun_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`,
    userEmail: (account?.email || clean).toLowerCase(),
    adminEmail,
    createdAt: new Date().toISOString(),
    ...fields,
  };
  await db.addPunishment(record);
}

async function verifyAdminAuth(req: NextRequest): Promise<boolean> {
  const session = getSessionFromRequest(req);
  return Boolean(session && session.isAdmin);
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

    const users = await db.getAllUsers();

    return NextResponse.json({
      success: true,
      count: users.length,
      users,
    });
  } catch (error: any) {
    console.error("Admin users GET error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to load registered users" },
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
    const { action, userId, email } = body;
    const reason = typeof body.reason === "string" ? body.reason.trim() : "";
    const incidentId = typeof body.incidentId === "string" && body.incidentId ? body.incidentId : undefined;
    const actorEmail = getSessionFromRequest(req)?.email || "";
    const target = userId || email;

    if (!target) {
      return NextResponse.json(
        { error: "Target userId or email is required." },
        { status: 400 }
      );
    }

    const targetClean = String(target).toLowerCase().trim();

    if (ACTIONS_NEEDING_REASON.includes(action) && (reason.length < 3 || reason.length > 1000)) {
      return NextResponse.json(
        { error: "A reason is required (3 to 1,000 characters). It is kept in the punishment history." },
        { status: 400 }
      );
    }

    switch (action) {
      case "toggleAdmin": {
        if (targetClean === ADMIN_EMAIL.toLowerCase()) {
          return NextResponse.json(
            { error: "Primary system administrator role cannot be altered." },
            { status: 400 }
          );
        }
        const updated = await db.toggleUserAdmin(target);
        if (!updated) {
          return NextResponse.json({ error: "User not found" }, { status: 404 });
        }
        return NextResponse.json({
          success: true,
          message: `User ${updated.email} admin status set to ${Boolean(updated.isAdmin)}.`,
          user: updated,
        });
      }

      case "banUser": {
        if (targetClean === ADMIN_EMAIL.toLowerCase()) {
          return NextResponse.json(
            { error: "Primary system administrator cannot be suspended." },
            { status: 400 }
          );
        }
        await db.banUser(target);
        await recordPunishment(target, actorEmail, { kind: "BAN", reason, incidentId });
        const user = targetClean.includes("@")
          ? await db.getUserByEmail(targetClean)
          : await db.getUserById(target);
        return NextResponse.json({
          success: true,
          message: `User ${target} has been suspended/banned.`,
          user,
        });
      }

      case "unbanUser": {
        await db.unbanUser(target);
        await recordPunishment(target, actorEmail, { kind: "LIFT", reason: reason || "Lifted without a reason given", incidentId });
        const user = targetClean.includes("@")
          ? await db.getUserByEmail(targetClean)
          : await db.getUserById(target);
        return NextResponse.json({
          success: true,
          message: `User ${target} suspension lifted.`,
          user,
        });
      }

      case "resetQuota": {
        const updated = await db.resetUserQuota(target);
        if (!updated) {
          return NextResponse.json({ error: "User not found" }, { status: 404 });
        }
        return NextResponse.json({
          success: true,
          message: `Daily message counter reset to 0 for ${updated.email}.`,
          user: updated,
        });
      }

      case "warnUser": {
        const strikes = await db.incrementStrikes(target);
        await recordPunishment(target, actorEmail, { kind: "WARN", reason, incidentId });
        const warned = targetClean.includes("@")
          ? await db.getUserByEmail(targetClean)
          : await db.getUserById(target);
        if (warned) notifyUser(warned.email, warningNotice({ strikes }));
        return NextResponse.json({
          success: true,
          message: `Warning sent to ${target}. Strike ${strikes}.`,
          user: warned,
        });
      }

      case "suspendUser": {
        if (targetClean === ADMIN_EMAIL.toLowerCase()) {
          return NextResponse.json(
            { error: "Primary system administrator cannot be suspended." },
            { status: 400 }
          );
        }
        const n = Number(body.days);
        if (!Number.isInteger(n) || n < 1 || n > 365) {
          return NextResponse.json(
            { error: "Suspension length must be a whole number of days from 1 to 365." },
            { status: 400 }
          );
        }
        const until = new Date(Date.now() + n * 24 * 60 * 60 * 1000).toISOString();
        const suspended = await db.suspendUserUntil(target, until);
        if (!suspended) {
          return NextResponse.json({ error: "User not found" }, { status: 404 });
        }
        await recordPunishment(target, actorEmail, { kind: "SUSPEND", reason, incidentId, durationDays: n, until });
        notifyUser(suspended.email, temporarySuspensionNotice({ until }));
        return NextResponse.json({
          success: true,
          message: `User ${suspended.email} suspended for ${n} day${n === 1 ? "" : "s"}.`,
          user: suspended,
        });
      }

      default:
        return NextResponse.json(
          { error: `Invalid action specified: ${action}` },
          { status: 400 }
        );
    }
  } catch (error: any) {
    console.error("Admin user action error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to perform user action" },
      { status: 500 }
    );
  }
}
