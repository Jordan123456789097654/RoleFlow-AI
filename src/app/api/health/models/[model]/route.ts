import { NextRequest, NextResponse } from "next/server";
import { MODEL_IDS } from "@/lib/models";
import { getOneModelHealth } from "@/lib/model-health";
import { checkHealthToken } from "@/lib/health-auth";
import type { ModelId } from "@/types";

export const dynamic = "force-dynamic";

/**
 * Health of one model, for its own Better Stack monitor. Requires the same bearer token.
 * Returns 503 only when the model is down, so a status-code monitor alerts on outages. Degraded
 * answers 200 with `"status":"degraded"` in the body. Monitors that match keywords can alert on it.
 */
export async function GET(req: NextRequest, { params }: { params: { model: string } }) {
  const headers = { "Cache-Control": "no-store" };
  const auth = checkHealthToken(req);
  if (auth === "disabled") return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (auth === "unauthorized") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const id = params.model as ModelId;
  if (!MODEL_IDS.includes(id)) {
    return NextResponse.json({ error: "Unknown model" }, { status: 404, headers });
  }

  const health = await getOneModelHealth(id);
  return NextResponse.json(
    { ...health, checkedAt: health.checkedAt },
    { status: health.status === "down" ? 503 : 200, headers }
  );
}
