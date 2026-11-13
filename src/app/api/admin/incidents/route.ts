import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionFromRequest } from "@/lib/auth";
import {
  createSystemIncident,
  updateSystemIncident,
  resolveSystemIncident,
} from "@/lib/incidents";
import { runStatusWatchdogCheck } from "@/lib/status-watchdog";

export const dynamic = "force-dynamic";

async function verifyAdminAuth(req: NextRequest): Promise<boolean> {
  const session = getSessionFromRequest(req);
  return Boolean(session && session.isAdmin);
}

export async function GET(req: NextRequest) {
  try {
    const isAdmin = await verifyAdminAuth(req);
    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const incidents = await db.getSystemIncidents();
    const active = incidents.filter((i) => i.status !== "resolved");

    return NextResponse.json({
      success: true,
      incidents,
      totalCount: incidents.length,
      activeCount: active.length,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to load incidents" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const isAdmin = await verifyAdminAuth(req);
    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const action = body.action || "create";

    if (action === "test_outage") {
      const inc = await createSystemIncident({
        title: "RoleFlow API Outage (Test)",
        description: body.error || "Unexpected status code 502",
        status: "investigating",
        severity: "critical",
        affectedServices: ["RoleFlow API"],
        source: "manual",
        monitorName: "RoleFlow API",
        monitorCheck: "HTTP GET https://roleflow.site/api/health",
      });
      return NextResponse.json({ success: true, incident: inc });
    }

    if (action === "test_recovery" && body.incidentId) {
      const inc = await resolveSystemIncident(body.incidentId, {
        monitorName: body.monitorName || "RoleFlow API",
        monitorCheck: "HTTP GET https://roleflow.site/api/health",
        resolutionMessage: "Operational — All endpoints responding within nominal thresholds",
      });
      return NextResponse.json({ success: true, incident: inc });
    }

    if (action === "run_watchdog") {
      const res = await runStatusWatchdogCheck();
      return NextResponse.json({ success: true, result: res });
    }

    if (action === "create") {
      const inc = await createSystemIncident({
        title: body.title || "System Incident",
        description: body.description || "Unexpected error detected",
        status: body.status || "investigating",
        severity: body.severity || "major",
        affectedServices: body.affectedServices || ["RoleFlow Core"],
        source: "manual",
        monitorName: body.monitorName,
        monitorCheck: body.monitorCheck,
      });
      return NextResponse.json({ success: true, incident: inc });
    }

    if (action === "resolve" && body.incidentId) {
      const inc = await resolveSystemIncident(body.incidentId, {
        resolutionMessage: body.resolutionMessage,
        monitorName: body.monitorName,
        monitorCheck: body.monitorCheck,
      });
      return NextResponse.json({ success: true, incident: inc });
    }

    if (action === "update" && body.incidentId) {
      const inc = await updateSystemIncident(body.incidentId, {
        status: body.status,
        severity: body.severity,
        message: body.message,
        description: body.description,
        monitorName: body.monitorName,
        monitorCheck: body.monitorCheck,
      });
      return NextResponse.json({ success: true, incident: inc });
    }

    return NextResponse.json({ error: "Invalid action or parameters" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to process incident action" },
      { status: 500 }
    );
  }
}
