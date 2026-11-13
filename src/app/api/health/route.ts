import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * Liveness check for uptime monitors (Better Stack). Cheap and dependency-free: it answers
 * 200 whenever the Node process can serve a request, and does not touch the database.
 * Maintenance mode does not change this response, so planned downtime is not reported as an outage.
 */
export async function GET() {
  return NextResponse.json(
    { status: "ok", checkedAt: new Date().toISOString() },
    { headers: { "Cache-Control": "no-store" } }
  );
}
