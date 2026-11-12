import { NextRequest, NextResponse } from "next/server";
import { db, ADMIN_EMAIL } from "@/lib/db";
import { createSessionToken, setSessionCookie } from "@/lib/auth";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  try {
    const { email, code } = await req.json();

    if (!email || !code || typeof code !== "string") {
      return NextResponse.json({ error: "Email and code are required" }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();
    const inputCode = code.trim();

    // 1. Fetch auth entry
    const authEntry = await db.getAuthCode(cleanEmail);
    if (!authEntry || authEntry.expiresAt < Date.now()) {
      if (authEntry) {
        await db.deleteAuthCode(cleanEmail);
      }
      return NextResponse.json(
        { error: "Verification code has expired or does not exist. Please request a new code." },
        { status: 400 }
      );
    }

    // 2. Check 5-attempt limit
    if ((authEntry.attempts || 0) >= 5) {
      await db.deleteAuthCode(cleanEmail);
      return NextResponse.json(
        { error: "Too many failed attempts. This code has been invalidated. Please request a new code." },
        { status: 400 }
      );
    }

    // 3. Constant-time comparison of the code
    const bufA = Buffer.from(authEntry.code);
    const bufB = Buffer.from(inputCode);
    const isMatch = bufA.length === bufB.length && crypto.timingSafeEqual(bufA, bufB);

    if (!isMatch) {
      const attemptResult = await db.recordFailedAuthAttempt(cleanEmail);
      if (attemptResult.invalidated) {
        return NextResponse.json(
          { error: "Too many failed attempts (5/5). Code invalidated. Please request a new code." },
          { status: 400 }
        );
      }
      return NextResponse.json(
        { error: `Invalid verification code. ${attemptResult.remaining} attempts remaining.` },
        { status: 400 }
      );
    }

    // 4. Single-use: Delete code immediately upon successful verification
    await db.deleteAuthCode(cleanEmail);

    // 5. Get or create user
    const isJordanAdmin = Boolean(ADMIN_EMAIL && cleanEmail === ADMIN_EMAIL);
    let user = await db.getUserByEmail(cleanEmail);
    if (!user) {
      const cleanLocal = cleanEmail.split("@")[0].replace(/[0-9]/g, "").replace(/[._-]/g, " ").trim();
      const formattedName = cleanLocal
        ? cleanLocal
            .split(" ")
            .filter(Boolean)
            .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
            .join(" ")
        : "RoleFlow Member";

      user = {
        id: "usr-" + Date.now(),
        email: cleanEmail,
        name: formattedName || "RoleFlow Member",
        customInstructions: "",
        isAdmin: isJordanAdmin,
        plan: isJordanAdmin ? "ADMIN" : "FREE",
        messageCount: 0,
        createdAt: new Date().toISOString(),
      };
      await db.upsertUser(user);
    } else {
      if (isJordanAdmin && !user.isAdmin) {
        user.isAdmin = true;
        user.plan = "ADMIN";
        await db.upsertUser(user);
      }
    }

    // 6. Generate cryptographically signed session token
    const sessionToken = createSessionToken({
      userId: user.id,
      email: user.email,
      isAdmin: Boolean(user.isAdmin),
    });

    const response = NextResponse.json({ success: true, user });

    // 7. Set httpOnly, secure, sameSite="lax" cookie named roleflow_session
    setSessionCookie(response, sessionToken);

    // Also set unprivileged roleflow_user cookie for smooth frontend state restoration
    response.cookies.set("roleflow_user", JSON.stringify(user), {
      path: "/",
      httpOnly: false,
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });

    return response;
  } catch (error: any) {
    console.error("verify-code error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to verify code" },
      { status: 500 }
    );
  }
}
