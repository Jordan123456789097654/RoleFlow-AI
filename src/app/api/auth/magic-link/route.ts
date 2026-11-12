import { NextRequest, NextResponse } from "next/server";
import { db, ADMIN_EMAIL } from "@/lib/db";
import { createSessionToken, setSessionCookie } from "@/lib/auth";
import crypto from "crypto";

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const email = searchParams.get("email");
  const token = searchParams.get("token");

  if (!email || !token) {
    return NextResponse.redirect(new URL("/?error=invalid_magic_link", req.url));
  }

  const cleanEmail = email.toLowerCase().trim();
  const authEntry = await db.getAuthCode(cleanEmail);

  if (!authEntry || authEntry.expiresAt < Date.now()) {
    if (authEntry) {
      await db.deleteAuthCode(cleanEmail);
    }
    return NextResponse.redirect(new URL("/?error=expired_magic_link", req.url));
  }

  // 1. Constant-time comparison using crypto.timingSafeEqual
  const bufA = Buffer.from(authEntry.token);
  const bufB = Buffer.from(token);
  const isValid = bufA.length === bufB.length && crypto.timingSafeEqual(bufA, bufB);

  if (!isValid) {
    // Do NOT delete the pending code if token does not match
    await db.recordFailedAuthAttempt(cleanEmail);
    return NextResponse.redirect(new URL("/?error=invalid_magic_link", req.url));
  }

  // 2. Invalidate/delete token immediately upon successful consumption (single-use)
  await db.deleteAuthCode(cleanEmail);

  // 3. Ensure user exists
  const isJordanAdmin = Boolean(ADMIN_EMAIL && cleanEmail === ADMIN_EMAIL);
  let user = await db.getUserByEmail(cleanEmail);
  if (!user) {
    const cleanLocal = cleanEmail.split("@")[0].replace(/[0-9]/g, "").replace(/[._-]/g, " ").trim();
    const formattedName = cleanLocal
      ? cleanLocal
          .split(" ")
          .filter(Boolean)
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
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

  // 4. Create cryptographically signed session token
  const sessionToken = createSessionToken({
    userId: user.id,
    email: user.email,
    isAdmin: Boolean(user.isAdmin),
  });

  // 5. Set the signed roleflow_session httpOnly cookie and redirect to /chat
  const redirectUrl = new URL("/chat", req.url);
  redirectUrl.searchParams.set("login", "success");
  const response = NextResponse.redirect(redirectUrl);

  setSessionCookie(response, sessionToken);

  // Set roleflow_user for client UI state restoration
  response.cookies.set("roleflow_user", JSON.stringify(user), {
    path: "/",
    httpOnly: false,
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });

  return response;
}
