import { NextRequest, NextResponse } from "next/server";
import {
  createSystemIncident,
  updateSystemIncident,
  resolveSystemIncident,
  getActiveIncidentForMonitor,
  getActiveIncidentForReport,
} from "@/lib/incidents";

/**
 * Better Stack Inbound Webhook Endpoint
 * Listens for monitor outages, degradations, maintenance alerts, and recoveries.
 * Automatically provisions sequential incident IDs (RF-INC-XXXX) and dispatches
 * real-time embeds directly to Discord # 📡・status via the bot.
 */
export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.json().catch(() => null);
    if (!rawBody) {
      return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
    }

    // Better Stack can deliver payloads under several top-level keys
    const eventType =
      rawBody.event_type ||
      rawBody.type ||
      rawBody.event ||
      rawBody.incident?.status ||
      "";

    // Extract monitor info
    const monitorObj =
      rawBody.data?.attributes ||
      rawBody.monitor ||
      rawBody.incident?.attributes ||
      rawBody.incident ||
      {};

    const monitorId = String(
      rawBody.data?.id ||
      monitorObj.id ||
      monitorObj.monitor_id ||
      rawBody.monitor_id ||
      ""
    );

    const monitorName =
      monitorObj.pronounceable_name ||
      monitorObj.name ||
      monitorObj.monitor_name ||
      "RoleFlow API & Models";

    const monitorUrl =
      monitorObj.url ||
      (monitorName.includes("API")
        ? "https://roleflow.site/api/health"
        : "https://roleflow.site");

    const httpMethod = monitorObj.http_method || "HTTP GET";
    const monitorCheck = `${httpMethod} ${monitorUrl}`;

    const rawStatus = String(
      monitorObj.status ||
      eventType ||
      ""
    ).toLowerCase();

    const cause =
      monitorObj.cause ||
      monitorObj.response_summary ||
      rawBody.cause ||
      (monitorObj.response_code
        ? `Unexpected status code ${monitorObj.response_code}`
        : "Connection timeout / Service unavailable");

    const isResolved =
      rawStatus.includes("up") ||
      rawStatus.includes("resolved") ||
      rawStatus.includes("recover") ||
      eventType.includes("resolved");

    const isMaintenance =
      rawStatus.includes("maintenance") ||
      eventType.includes("maintenance");

    const isDegraded =
      rawStatus.includes("degraded") ||
      eventType.includes("degraded");

    if (isResolved) {
      const active = await getActiveIncidentForMonitor(monitorId);
      if (active) {
        const resolved = await resolveSystemIncident(active.id, {
          monitorName,
          monitorCheck,
          resolutionMessage: "Operational — All endpoints responding within nominal thresholds",
        });
        return NextResponse.json({
          status: "resolved",
          incidentId: active.id,
          incident: resolved,
        });
      }
      return NextResponse.json({ status: "ignored_no_active_incident" });
    }

    // Otherwise, it's an outage, degradation, or maintenance
    const existing = await getActiveIncidentForMonitor(monitorId);
    if (existing) {
      const updated = await updateSystemIncident(existing.id, {
        severity: isMaintenance ? "maintenance" : isDegraded ? "minor" : "major",
        description: cause,
        monitorName,
        monitorCheck,
        message: `Status update: ${rawStatus}. ${cause}`,
      });
      return NextResponse.json({
        status: "updated",
        incidentId: existing.id,
        incident: updated,
      });
    }

    // Create brand new incident
    const newIncident = await createSystemIncident({
      title: `${monitorName} ${isMaintenance ? "Maintenance" : isDegraded ? "Degradation" : "Outage"}`,
      description: cause,
      status: "investigating",
      severity: isMaintenance ? "maintenance" : isDegraded ? "minor" : "critical",
      affectedServices: [monitorName],
      source: "betterstack",
      sourceMonitorId: monitorId || undefined,
      monitorName,
      monitorCheck,
    });

    return NextResponse.json({
      status: "created",
      incidentId: newIncident.id,
      incident: newIncident,
    });
  } catch (err: any) {
    console.error("Better Stack webhook handler error:", err);
    return NextResponse.json({ error: err?.message || "Internal error" }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    status: "healthy",
    endpoint: "Better Stack Outage & Incident Webhook Listener",
    discordTarget: "RoleFlow Official Bot (# 📡・status)",
  });
}
