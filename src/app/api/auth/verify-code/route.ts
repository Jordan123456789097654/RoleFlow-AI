import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { UserProfile } from "@/types";

export async function POST(req: NextRequest) {
  try {
    const { email, code } = await req.json();

    if (!email || !code) {
      return NextResponse.json({ error: "Email and code are required" }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();
    const isValid = await db.verifyAuthCode(cleanEmail, code.trim());

    if (!isValid) {
      return NextResponse.json(
        { error: "Invalid or expired verification code" },
        { status: 400 }
      );
    }

    // Get or create user
    let user = await db.getUserByEmail(cleanEmail);
    if (!user) {
      const defaultName = cleanEmail === "jordanedanield13@gmail.com"
        ? "Jordan Daniels"
        : cleanEmail.split("@")[0].replace(/[0-9]/g, "").replace(/[._]/g, " ");
      const formattedName =
        defaultName.charAt(0).toUpperCase() + defaultName.slice(1);

      user = {
        id: "usr-" + Date.now(),
        email: cleanEmail,
        name: formattedName || "Jordan Daniels",
        customInstructions: "",
        isAdmin: cleanEmail === "jordanedanield13@gmail.com",
        plan: cleanEmail === "jordanedanield13@gmail.com" ? "ADMIN" : "FREE",
        messageCount: 0,
        createdAt: new Date().toISOString(),
      };
      await db.upsertUser(user);
    }

    return NextResponse.json({ success: true, user });
  } catch (error: any) {
    console.error("verify-code error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to verify code" },
      { status: 500 }
    );
  }
}
