import { NextResponse } from "next/server";
import { getModelHealth, overallStatus, toPublicModelStatus } from "@/lib/model-health";

export const dynamic = "force-dynamic";

/**
 * Public status for the home page and admin dashboard. Unauthenticated, so it returns only what
 * visitors may see: each model's status, latency and a generic note. It always answers 200, so the
 * page can render "degraded" or "down" itself. Probes are cached for five minutes, so repeated
 * visits do not spend model inference quota.
 */
export async function GET() {
  const models = await getModelHealth();
  const body = {
    overall: overallStatus(models),
    checkedAt: new Date().toISOString(),
    models: models.map(toPublicModelStatus),
  };
  return NextResponse.json(body, {
    headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=60" },
  });
}
