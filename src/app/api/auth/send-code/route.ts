import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sendLoginEmail } from "@/lib/email";
import crypto from "crypto";

// Sliding window rate limiter state
const emailTimestamps = new Map<string, number[]>();
const ipTimestamps = new Map<string, number[]>();

const WINDOW_MS = 5 * 60 * 1000; // 5 minutes sliding window
const MAX_REQUESTS = 3; // Max 3 requests per 5 minutes

function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0].trim();
    if (first) return first;
  }
  const realIp = req.headers.get("x-real-ip");
  if (realIp) return realIp.trim();
  return "127.0.0.1";
}

function checkRateLimit(
  key: string,
  store: Map<string, number[]>
): { limited: boolean; retryAfterSeconds: number } {
  const now = Date.now();
  const existing = store.get(key) || [];
  const valid = existing.filter((ts) => now - ts < WINDOW_MS);

  if (valid.length >= MAX_REQUESTS) {
    const oldest = valid[0];
    const retryAfterSeconds = Math.ceil((oldest + WINDOW_MS - now) / 1000);
    store.set(key, valid);
    return { limited: true, retryAfterSeconds: Math.max(1, retryAfterSeconds) };
  }

  valid.push(now);
  store.set(key, valid);
  return { limited: false, retryAfterSeconds: 0 };
}

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json({ error: "Valid email address required" }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();
    const clientIp = getClientIp(req);

    // 1. Sliding window rate limit check by IP
    const ipCheck = checkRateLimit(clientIp, ipTimestamps);
    if (ipCheck.limited) {
      return NextResponse.json(
        {
          error: `Too many requests from this IP. Please wait ${ipCheck.retryAfterSeconds} seconds before requesting another code.`,
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(ipCheck.retryAfterSeconds),
          },
        }
      );
    }

    // 2. Sliding window rate limit check by Email
    const emailCheck = checkRateLimit(cleanEmail, emailTimestamps);
    if (emailCheck.limited) {
      return NextResponse.json(
        {
          error: `Too many requests for this email address. Please wait ${emailCheck.retryAfterSeconds} seconds before requesting another code.`,
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(emailCheck.retryAfterSeconds),
          },
        }
      );
    }

    // 3. Cryptographically secure 6-digit OTP (100000 - 999999) using Node crypto
    const code = crypto.randomInt(100000, 1000000).toString();

    // 4. Cryptographically secure UUID token with 10-minute expiry
    const token = crypto.randomUUID();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://roleflow.site";
    const magicLink = `${appUrl}/api/auth/magic-link?email=${encodeURIComponent(
      cleanEmail
    )}&token=${token}`;

    // Store in database
    await db.saveAuthCode(cleanEmail, code, token, expiresAt);

    // Dispatch verification email
    const result = await sendLoginEmail({
      to: cleanEmail,
      code,
      magicLink,
    });

    if (!result.success) {
      console.warn("Resend email failed:", result.error);
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
