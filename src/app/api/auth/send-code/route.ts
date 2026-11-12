import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sendLoginEmail } from "@/lib/email";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json({ error: "Valid email address required" }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const token = crypto.randomUUID();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://roleflow.site";
    const magicLink = `${appUrl}/api/auth/magic-link?email=${encodeURIComponent(
      cleanEmail
    )}&token=${token}`;

    // Store in DB / local storage
    await db.saveAuthCode(cleanEmail, code, token, expiresAt);

    // Dispatch Claude-style email via Resend
    const result = await sendLoginEmail({
      to: cleanEmail,
      code,
      magicLink,
    });

    if (!result.success) {
      console.warn("Resend email failed:", result.error);
      // Still return success with developer note so testing works locally even if domain verification is pending
      return NextResponse.json({
        success: true,
        message: "Code generated (Check server logs if testing locally)",
        devCode: process.env.NODE_ENV === "development" ? code : undefined,
      });
    }

    return NextResponse.json({ success: true, message: "Verification email sent" });
  } catch (error: any) {
    console.error("send-code error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to process request" },
      { status: 500 }
    );
  }
}
