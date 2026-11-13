import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { MODELS } from "@/lib/models";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const config = await db.getSystemConfig();
    const forcedModelSpec = config.forcedModel ? MODELS[config.forcedModel] : null;

    return NextResponse.json({
      success: true,
      maintenanceMode: Boolean(config.maintenanceMode),
      broadcastBanner: config.broadcastBanner || "",
      allowHighEffort: Boolean(config.allowHighEffort),
      forcedModel: config.forcedModel ?? null,
      forcedModelName: forcedModelSpec?.name ?? null,
      forcedEffort: config.forcedEffort ?? null,
    });
  } catch (error: any) {
    console.error("Public config GET error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to load config" },
      { status: 500 }
    );
  }
}
