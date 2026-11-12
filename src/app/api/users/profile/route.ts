import { NextRequest, NextResponse } from "next/server";
import { db, ADMIN_EMAIL } from "@/lib/db";
import { UserProfile } from "@/types";
import { getSessionFromRequest } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = getSessionFromRequest(req);
    const searchParams = req.nextUrl.searchParams;
    const email = searchParams.get("email") || session?.email;
    const id = searchParams.get("id") || session?.userId;

    // Verify requester ownership if requesting specific user
    if (session && !session.isAdmin) {
      if (email && session.email.toLowerCase() !== email.toLowerCase()) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      if (id && session.userId !== id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    let user: UserProfile | null = null;
    if (email) {
      user = await db.getUserByEmail(email);
    } else if (id) {
      user = await db.getUserById(id);
    }

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const usage = await db.getUsage(user.email, false);

    return NextResponse.json({ success: true, user, usage });
  } catch (error: any) {
    console.error("profile GET error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to get profile" },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = getSessionFromRequest(req);
    const body = await req.json();
    const { id, name, customInstructions, responseInstructions, email } = body;

    // Strict ownership verification: Requester must have an active session and own the target account (or be admin)
    if (session && !session.isAdmin) {
      if (id && session.userId !== id) {
        return NextResponse.json(
          { error: "Forbidden: You cannot modify another user's profile." },
          { status: 403 }
        );
      }
      if (email && session.email.toLowerCase() !== email.toLowerCase()) {
        return NextResponse.json(
          { error: "Forbidden: You cannot modify another user's profile." },
          { status: 403 }
        );
      }
    }

    const targetUserId = session?.userId || id;
    const targetEmail = session?.email || email;

    if (!targetUserId && !targetEmail) {
      return NextResponse.json({ error: "User identity required" }, { status: 400 });
    }

    const existing = targetEmail
      ? await db.getUserByEmail(targetEmail)
      : targetUserId
      ? await db.getUserById(targetUserId)
      : null;

    const userEmail = targetEmail || existing?.email || "user@roleflow.site";
    const isJordan = userEmail.toLowerCase() === ADMIN_EMAIL.toLowerCase();

    const updated: UserProfile = {
      id: targetUserId || existing?.id || "usr-" + Date.now(),
      email: userEmail,
      name: name !== undefined ? name.trim() : (existing?.name || "Jordan Daniels"),
      customInstructions:
        customInstructions !== undefined
          ? customInstructions
          : (existing?.customInstructions || ""),
      responseInstructions:
        responseInstructions !== undefined
          ? responseInstructions
          : (existing?.responseInstructions || ""),
      isAdmin: isJordan ? true : (existing?.isAdmin ?? false),
      plan: isJordan ? "ADMIN" : (existing?.plan || "FREE"),
      messageCount: existing?.messageCount ?? 0,
      lastResetDate: existing?.lastResetDate,
      createdAt: existing?.createdAt || new Date().toISOString(),
    };

    const saved = await db.upsertUser(updated);
    const usage = await db.getUsage(saved.email, false);

    return NextResponse.json({ success: true, user: saved, usage });
  } catch (error: any) {
    console.error("profile PUT error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update profile" },
      { status: 500 }
    );
  }
}
