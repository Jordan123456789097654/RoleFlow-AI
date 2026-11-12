import { NextRequest, NextResponse } from "next/server";

export const SESSION_COOKIE_NAME = "roleflow_session";

interface EdgeSessionPayload {
  userId: string;
  email: string;
  isAdmin: boolean;
  exp?: number;
}

/**
 * Edge-compatible cryptographic session verification using Web Crypto API.
 * Avoids Node.js 'crypto' module imports which crash in the Edge Runtime.
 */
async function verifyEdgeSession(token: string): Promise<EdgeSessionPayload | null> {
  if (!token || typeof token !== "string") return null;
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [data, signature] = parts;
  if (!data || !signature) return null;

  try {
    const secret = process.env.SESSION_SECRET;
    if (secret) {
      const enc = new TextEncoder();
      const key = await crypto.subtle.importKey(
        "raw",
        enc.encode(secret),
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["sign"]
      );
      const sigBytes = await crypto.subtle.sign("HMAC", key, enc.encode(data));
      let binary = "";
      const bytes = new Uint8Array(sigBytes);
      for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      const expectedSig = btoa(binary)
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/, "");

      if (signature !== expectedSig) {
        return null;
      }
    }

    // Decode base64url data payload in Edge environment
    const base64 = data.replace(/-/g, "+").replace(/_/g, "/");
    const jsonStr = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    const payload = JSON.parse(jsonStr) as EdgeSessionPayload;

    if (!payload.userId || !payload.email) return null;
    if (payload.exp && Math.floor(Date.now() / 1000) > payload.exp) return null;

    return payload;
  } catch {
    return null;
  }
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Intercept private /api/admin/* and return 403 if not admin
  if (pathname.startsWith("/api/admin")) {
    const sessionCookie = req.cookies.get(SESSION_COOKIE_NAME)?.value;
    const session = sessionCookie ? await verifyEdgeSession(sessionCookie) : null;

    if (!session || !session.isAdmin) {
      return NextResponse.json(
        { error: "Forbidden: Admin privileges required." },
        { status: 403 }
      );
    }
    return NextResponse.next();
  }

  // Intercept /admin and /admin/* and require a valid session where isAdmin === true
  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    const sessionCookie = req.cookies.get(SESSION_COOKIE_NAME)?.value;
    const session = sessionCookie ? await verifyEdgeSession(sessionCookie) : null;

    if (!session || !session.isAdmin) {
      const chatUrl = new URL("/chat", req.url);
      return NextResponse.redirect(chatUrl);
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin",
    "/admin/:path*",
    "/api/admin/:path*",
  ],
};
