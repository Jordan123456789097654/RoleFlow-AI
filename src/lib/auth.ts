import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";

export const SESSION_COOKIE_NAME = "roleflow_session";

// Session signing secret. Required in production: without a stable secret,
// sessions break across serverless instances and tokens can't be verified safely.
const DEV_FALLBACK_SECRET = crypto.randomBytes(32).toString("hex");

function getSessionSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (secret && secret.length >= 32) return secret;
  if (process.env.NODE_ENV === "production") {
    throw new Error("SESSION_SECRET must be set to at least 32 characters in production.");
  }
  return DEV_FALLBACK_SECRET;
}

export const GUEST_COOKIE_NAME = "roleflow_guest_sig";

/**
 * Creates a signed guest token binding guestId and client IP
 */
export function createGuestToken(guestId: string, ip: string): string {
  const data = `${guestId}:${ip}`;
  const sig = crypto.createHmac("sha256", getSessionSecret()).update(data).digest("base64url");
  return `${Buffer.from(data).toString("base64url")}.${sig}`;
}

/**
 * Verifies signed guest token
 */
export function verifyGuestToken(token: string, ip: string): string | null {
  if (!token || typeof token !== "string") return null;
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [b64Data, sig] = parts;
  try {
    const data = Buffer.from(b64Data, "base64url").toString("utf-8");
    const expectedSig = crypto.createHmac("sha256", getSessionSecret()).update(data).digest("base64url");
    const bufA = Buffer.from(sig);
    const bufB = Buffer.from(expectedSig);
    if (bufA.length !== bufB.length || !crypto.timingSafeEqual(bufA, bufB)) return null;
    const [guestId, tokenIp] = data.split(":");
    if (!guestId || !guestId.startsWith("guest_")) return null;
    return guestId;
  } catch {
    return null;
  }
}

export interface SessionPayload {
  userId: string;
  email: string;
  isAdmin: boolean;
  iat?: number;
  exp?: number;
}

/**
 * Creates a cryptographically signed HMAC-SHA256 session token
 */
export function createSessionToken(payload: {
  userId: string;
  email: string;
  isAdmin: boolean;
}): string {
  const iat = Math.floor(Date.now() / 1000);
  const exp = iat + 60 * 60 * 24 * 30; // 30 days validity
  const fullPayload: SessionPayload = {
    userId: payload.userId,
    email: payload.email.toLowerCase().trim(),
    isAdmin: Boolean(payload.isAdmin),
    iat,
    exp,
  };

  const payloadStr = JSON.stringify(fullPayload);
  const data = Buffer.from(payloadStr, "utf-8").toString("base64url");
  const signature = crypto
    .createHmac("sha256", getSessionSecret())
    .update(data)
    .digest("base64url");

  return `${data}.${signature}`;
}

/**
 * Verifies and decodes an HMAC-SHA256 signed session token
 */
export function verifySessionToken(token: string): SessionPayload | null {
  if (!token || typeof token !== "string") return null;

  const parts = token.split(".");
  if (parts.length !== 2) return null;

  const [data, signature] = parts;
  if (!data || !signature) return null;

  try {
    const expectedSig = crypto
      .createHmac("sha256", getSessionSecret())
      .update(data)
      .digest("base64url");

    const sigBuf = Buffer.from(signature);
    const expBuf = Buffer.from(expectedSig);

    if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
      return null;
    }

    const payloadStr = Buffer.from(data, "base64url").toString("utf-8");
    const payload = JSON.parse(payloadStr) as SessionPayload;

    if (!payload.userId || !payload.email) {
      return null;
    }

    // Check expiration
    if (payload.exp && Math.floor(Date.now() / 1000) > payload.exp) {
      return null;
    }

    return {
      userId: payload.userId,
      email: payload.email,
      isAdmin: Boolean(payload.isAdmin),
      iat: payload.iat,
      exp: payload.exp,
    };
  } catch {
    return null;
  }
}

/**
 * Extracts and verifies the session from an incoming NextRequest
 */
export function getSessionFromRequest(req: NextRequest): SessionPayload | null {
  const cookie = req.cookies.get(SESSION_COOKIE_NAME);
  if (!cookie?.value) return null;
  return verifySessionToken(cookie.value);
}

/**
 * Standard secure cookie options for roleflow_session
 */
export const SESSION_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: 60 * 60 * 24 * 30, // 30 days
};

/**
 * Helper to set the roleflow_session cookie on a NextResponse
 */
export function setSessionCookie(res: NextResponse, token: string): void {
  res.cookies.set(SESSION_COOKIE_NAME, token, SESSION_COOKIE_OPTIONS);
}

/**
 * Helper to clear the roleflow_session cookie
 */
export function clearSessionCookie(res: NextResponse): void {
  res.cookies.set(SESSION_COOKIE_NAME, "", {
    ...SESSION_COOKIE_OPTIONS,
    maxAge: 0,
  });
}
