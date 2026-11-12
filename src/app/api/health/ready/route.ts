import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * Readiness check: verifies the app can reach its database. Returns 503 when a dependency is
 * down, so monitors can alert on it. Error details are logged server-side and never returned.
 */
export async function GET() {
  const checkedAt = new Date().toISOString();
  try {
    await db.ping();
    return NextResponse.json(
      { status: "ok", checks: { database: "ok" }, checkedAt },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    console.error("Readiness check failed: database unreachable.", error);
    return NextResponse.json(
      { status: "degraded", checks: { database: "error" }, checkedAt },
      { status: 503, headers: { "Cache-Control": "no-store" } }
    );
  }
}
