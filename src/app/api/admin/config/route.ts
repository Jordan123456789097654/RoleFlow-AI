import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionFromRequest } from "@/lib/auth";
import { SystemConfig } from "@/types";

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
      patch.maintenanceMode = Boolean(body.maintenanceMode);
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
