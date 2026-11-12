import { NextRequest, NextResponse } from "next/server";
import { db, ADMIN_EMAIL } from "@/lib/db";
import { UserProfile } from "@/types";
import { getSessionFromRequest } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = getSessionFromRequest(req);
    if (!session || !session.userId) {
      return NextResponse.json(
        { error: "Unauthorized: Active session required." },
        { status: 401 }
      );
    }

    const searchParams = req.nextUrl.searchParams;
    const requestedEmail = searchParams.get("email");
    const requestedId = searchParams.get("id");

    // Non-admins can only view their own profile
    if (!session.isAdmin) {
      if (requestedEmail && requestedEmail.toLowerCase() !== session.email.toLowerCase()) {
        return NextResponse.json({ error: "Forbidden: Access restricted." }, { status: 403 });
      }
      if (requestedId && requestedId !== session.userId) {
        return NextResponse.json({ error: "Forbidden: Access restricted." }, { status: 403 });
      }
    }

    const targetEmail = requestedEmail || session.email;
    const targetId = requestedId || session.userId;

    let user: UserProfile | null = null;
    if (targetEmail) {
      user = await db.getUserByEmail(targetEmail);
    } else if (targetId) {
      user = await db.getUserById(targetId);
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
    if (!session || !session.userId) {
      return NextResponse.json(
        { error: "Unauthorized: Active session required." },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { id, name, customInstructions, responseInstructions, email } = body;

    // Strict ownership verification: Requester must own target account unless admin
    if (!session.isAdmin) {
      if (id && id !== session.userId) {
        return NextResponse.json(
          { error: "Forbidden: You cannot modify another user's profile." },
          { status: 403 }
        );
      }
      if (email && email.toLowerCase() !== session.email.toLowerCase()) {
        return NextResponse.json(
          { error: "Forbidden: You cannot modify another user's profile." },
          { status: 403 }
        );
      }
    }

    const targetUserId = session.isAdmin && id ? id : session.userId;
    const targetEmail = session.isAdmin && email ? email : session.email;

    const existing = await db.getUserById(targetUserId) || await db.getUserByEmail(targetEmail);
    if (!existing) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const isJordan = Boolean(ADMIN_EMAIL && targetEmail.toLowerCase() === ADMIN_EMAIL);

    const updated: UserProfile = {
      ...existing,
      name: name !== undefined ? name.trim() : existing.name,
      customInstructions:
        customInstructions !== undefined
          ? customInstructions
          : (existing.customInstructions || ""),
      responseInstructions:
        responseInstructions !== undefined
          ? responseInstructions
          : (existing.responseInstructions || ""),
      isAdmin: isJordan ? true : Boolean(existing.isAdmin),
      plan: isJordan ? "ADMIN" : (existing.plan || "FREE"),
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
