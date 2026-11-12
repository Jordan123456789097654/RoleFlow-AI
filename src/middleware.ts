import { NextRequest, NextResponse } from "next/server";
import { verifySessionToken, SESSION_COOKIE_NAME } from "@/lib/auth";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Intercept private /api/admin/* and return 403 if not admin
  if (pathname.startsWith("/api/admin")) {
    const sessionCookie = req.cookies.get(SESSION_COOKIE_NAME)?.value;
    const session = sessionCookie ? verifySessionToken(sessionCookie) : null;

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
    const session = sessionCookie ? verifySessionToken(sessionCookie) : null;

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
