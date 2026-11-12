import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { UserProfile } from "@/types";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const email = searchParams.get("email");
    const id = searchParams.get("id") || req.headers.get("x-user-id");

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
    const body = await req.json();
    const { id, name, customInstructions, responseInstructions, email } = body;

    if (!id && !email) {
      return NextResponse.json({ error: "User ID or email required" }, { status: 400 });
    }

    const existing = email
      ? await db.getUserByEmail(email)
      : id
      ? await db.getUserById(id)
      : null;

    const userEmail = email || existing?.email || "user@roleflow.site";
    const isJordan = userEmail.toLowerCase() === "jordanedanield13@gmail.com";

    const updated: UserProfile = {
      id: id || existing?.id || "usr-" + Date.now(),
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
