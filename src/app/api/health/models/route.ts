import { NextRequest, NextResponse } from "next/server";
import { getModelHealth, overallStatus } from "@/lib/model-health";
import { checkHealthToken } from "@/lib/health-auth";

export const dynamic = "force-dynamic";

/**
 * Health of every model, for Better Stack. Requires `Authorization: Bearer <HEALTH_CHECK_TOKEN>`.
 * Returns 200 when every model is operational or degraded, and 503 when any model is down.
 * Per-model monitors use GET /api/health/models/[model] instead.
 */
export async function GET(req: NextRequest) {
  const auth = checkHealthToken(req);
  if (auth === "disabled") return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (auth === "unauthorized") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const models = await getModelHealth();
  const status = overallStatus(models);
  return NextResponse.json(
    { status, checkedAt: new Date().toISOString(), models },
    { status: status === "down" ? 503 : 200, headers: { "Cache-Control": "no-store" } }
  );
}
