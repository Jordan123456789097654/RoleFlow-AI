import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { UserProfile } from "@/types";

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const email = searchParams.get("email");
  const token = searchParams.get("token");

  if (!email || !token) {
    return NextResponse.redirect(new URL("/?error=invalid_magic_link", req.url));
  }

  const cleanEmail = email.toLowerCase();
  const isValid = await db.verifyAuthCode(cleanEmail, token);

  if (!isValid) {
    return NextResponse.redirect(new URL("/?error=expired_magic_link", req.url));
  }

  // Ensure user exists
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

  // Set session cookie and redirect to main chat
  const response = NextResponse.redirect(new URL("/?login=success", req.url));
  response.cookies.set("roleflow_user", JSON.stringify(user), {
    path: "/",
    httpOnly: false, // accessible to client for smooth state restore
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });

  return response;
}
