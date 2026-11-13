import { NextResponse } from "next/server";
import { runStatusWatchdogCheck } from "@/lib/status-watchdog";

export const dynamic = "force-dynamic";

let lastWatchdogTime = 0;
const WATCHDOG_INTERVAL_MS = 25_000; // at most once every 25s

/**
 * Liveness check for uptime monitors (Better Stack). Cheap and dependency-free: it answers
 * 200 whenever the Node process can serve a request.
 * Asynchronously checks for active Better Stack status reports and monitor changes.
 */
export async function GET() {
  const now = Date.now();
  if (now - lastWatchdogTime > WATCHDOG_INTERVAL_MS) {
    lastWatchdogTime = now;
    // Asynchronous background sync with Better Stack (zero cron, driven by incoming health probes)
    runStatusWatchdogCheck().catch((err) =>
      console.error("Health probe watchdog sync error:", err)
    );
  }

  return NextResponse.json(
    { status: "ok", checkedAt: new Date().toISOString() },
    { headers: { "Cache-Control": "no-store" } }
  );
}
