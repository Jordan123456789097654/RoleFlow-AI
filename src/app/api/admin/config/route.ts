import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionFromRequest } from "@/lib/auth";
import { SystemConfig, ModelId, EffortLevel } from "@/types";
import { MODEL_IDS } from "@/lib/models";
import { enableBetterStackMaintenance, disableBetterStackMaintenance } from "@/lib/betterstack";

export const dynamic = "force-dynamic";

async function verifyAdminAuth(req: NextRequest): Promise<boolean> {
  const session = getSessionFromRequest(req);
  return Boolean(session && session.isAdmin);
}

export async function GET(req: NextRequest) {
  try {
    const isAdmin = await verifyAdminAuth(req);
    if (!isAdmin) {
      return NextResponse.json(
        { error: "Forbidden: Administrative credentials required." },
        { status: 403 }
      );
    }

    const config = await db.getSystemConfig();
    return NextResponse.json({
      success: true,
      config,
    });
  } catch (error: any) {
    console.error("Admin config GET error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to load system config" },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const isAdmin = await verifyAdminAuth(req);
    if (!isAdmin) {
      return NextResponse.json(
        { error: "Forbidden: Administrative credentials required." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const patch: Partial<SystemConfig> = {};

    if (body.guestLimit !== undefined) {
      const val = parseInt(body.guestLimit, 10);
      if (!isNaN(val) && val >= 1 && val <= 1000) {
        patch.guestLimit = val;
      }
    }

    if (body.registeredDailyLimit !== undefined) {
      const val = parseInt(body.registeredDailyLimit, 10);
      if (!isNaN(val) && val >= 1 && val <= 10000) {
        patch.registeredDailyLimit = val;
      }
    }

    if (body.maintenanceMode !== undefined) {
      const newMaint = Boolean(body.maintenanceMode);
      patch.maintenanceMode = newMaint;
      // Sync with Better Stack status page and uptime monitor
      if (newMaint) {
        enableBetterStackMaintenance().catch((err) =>
          console.error("BetterStack maintenance enable error:", err)
        );
      } else {
        disableBetterStackMaintenance().catch((err) =>
          console.error("BetterStack maintenance disable error:", err)
        );
      }
    }

    if (body.broadcastBanner !== undefined) {
      patch.broadcastBanner = String(body.broadcastBanner);
    }

    if (body.allowHighEffort !== undefined) {
      patch.allowHighEffort = Boolean(body.allowHighEffort);
    }

    if (body.apiKeysEnabled !== undefined) {
      patch.apiKeysEnabled = Boolean(body.apiKeysEnabled);
    }

    if (body.apiKeyDefaultRpm !== undefined) {
      const val = parseInt(body.apiKeyDefaultRpm, 10);
      if (!isNaN(val) && val >= 1 && val <= 120) {
        patch.apiKeyDefaultRpm = val;
      }
    }

    if (body.apiKeyDefaultRpd !== undefined) {
      const val = parseInt(body.apiKeyDefaultRpd, 10);
      if (!isNaN(val) && val >= 1 && val <= 10000) {
        patch.apiKeyDefaultRpd = val;
      }
    }

    if (body.apiKeyMaxPerUser !== undefined) {
      const val = parseInt(body.apiKeyMaxPerUser, 10);
      if (!isNaN(val) && val >= 1 && val <= 50) {
        patch.apiKeyMaxPerUser = val;
      }
    }

    if (body.forcedModel !== undefined) {
      if (body.forcedModel === null || body.forcedModel === "" || body.forcedModel === "none") {
        patch.forcedModel = null;
      } else if (MODEL_IDS.includes(body.forcedModel as ModelId)) {
        patch.forcedModel = body.forcedModel as ModelId;
      }
    }

    if (body.forcedEffort !== undefined) {
      if (body.forcedEffort === null || body.forcedEffort === "" || body.forcedEffort === "none") {
        patch.forcedEffort = null;
      } else if (["low", "medium", "high", "extra", "max"].includes(body.forcedEffort)) {
        patch.forcedEffort = body.forcedEffort as EffortLevel;
      }
    }

    const updatedConfig = await db.updateSystemConfig(patch);

    return NextResponse.json({
      success: true,
      message: "Global system configuration updated successfully.",
      config: updatedConfig,
    });
  } catch (error: any) {
    console.error("Admin config PUT error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update system config" },
      { status: 500 }
    );
  }
}

// Support POST as well for environments where PUT is restrictive
export async function POST(req: NextRequest) {
  return PUT(req);
}
