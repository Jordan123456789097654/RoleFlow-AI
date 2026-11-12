import { NextRequest, NextResponse } from "next/server";
import { db, ADMIN_EMAIL } from "@/lib/db";
import { getSessionFromRequest } from "@/lib/auth";

export const dynamic = "force-dynamic";

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
    const target = userId || email;

    if (!target) {
      return NextResponse.json(
        { error: "Target userId or email is required." },
        { status: 400 }
      );
    }

    const targetClean = String(target).toLowerCase().trim();

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
