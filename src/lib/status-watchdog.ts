import {
  BETTERSTACK_API_TOKEN,
  BETTERSTACK_STATUS_PAGE_ID,
} from "@/lib/betterstack";
import {
  createSystemIncident,
  resolveSystemIncident,
  getActiveIncidentForMonitor,
  getActiveIncidentForReport,
  getActiveSystemIncidents,
} from "@/lib/incidents";

const BASE_URL = "https://uptime.betterstack.com/api/v2";

function getHeaders() {
  return {
    Authorization: `Bearer ${BETTERSTACK_API_TOKEN}`,
    "Content-Type": "application/json",
    "User-Agent": "RoleFlow-Watchdog/1.0",
  };
}

export interface WatchdogCheckResult {
  monitorsChecked: number;
  incidentsCreated: string[];
  incidentsResolved: string[];
  activeIncidentCount: number;
  timestamp: string;
}

/**
 * Actively polls Better Stack monitors and status reports.
 * Detects outages, maintenance, and degradations.
 * Auto-creates RF-INC-XXXX incident IDs and dispatches to Discord # 📡・status via the bot.
 * Auto-recovers and edits embeds to green when systems come back up.
 */
export async function runStatusWatchdogCheck(): Promise<WatchdogCheckResult> {
  const result: WatchdogCheckResult = {
    monitorsChecked: 0,
    incidentsCreated: [],
    incidentsResolved: [],
    activeIncidentCount: 0,
    timestamp: new Date().toISOString(),
  };

  if (!BETTERSTACK_API_TOKEN) {
    return result;
  }

  try {
    // 1. Fetch live monitors from Better Stack
    const res = await fetch(`${BASE_URL}/monitors`, {
      headers: getHeaders(),
      cache: "no-store",
    });

    if (!res.ok) {
      console.error("Watchdog: failed to fetch Better Stack monitors:", res.status);
      return result;
    }

    const json = await res.json();
    const monitors: any[] = json.data || [];
    result.monitorsChecked = monitors.length;

    for (const m of monitors) {
      const mid = String(m.id);
      const attrs = m.attributes || {};
      const status = String(attrs.status || "").toLowerCase();
      const paused = Boolean(attrs.paused);
      const name = attrs.pronounceable_name || attrs.name || `Monitor ${mid}`;
      const url = attrs.url || "https://roleflow.site/api/health";
      const httpMethod = attrs.http_method || "HTTP GET";
      const checkDesc = `${httpMethod} ${url}`;

      const activeIncident = await getActiveIncidentForMonitor(mid);

      if (status === "down" || (status !== "up" && !paused)) {
        // Monitor is down or degraded
        if (!activeIncident) {
          const isDegraded = status === "degraded";
          const newInc = await createSystemIncident({
            title: `${name} ${isDegraded ? "Degradation" : "Outage"}`,
            description: attrs.last_check_message || "Unexpected status code 502",
            status: "investigating",
            severity: isDegraded ? "minor" : "critical",
            affectedServices: [name],
            source: "betterstack",
            sourceMonitorId: mid,
            monitorName: name,
            monitorCheck: checkDesc,
          });
          result.incidentsCreated.push(newInc.id);
        }
      } else if (status === "up" && !paused) {
        // Monitor is operational
        if (activeIncident) {
          const resolved = await resolveSystemIncident(activeIncident.id, {
            monitorName: name,
            monitorCheck: checkDesc,
            resolutionMessage: "Operational — All endpoints responding within nominal thresholds",
          });
          if (resolved) {
            result.incidentsResolved.push(activeIncident.id);
          }
        }
      }
    }

    // 2. Fetch live status reports from Better Stack Status Page (269433)
    try {
      const repRes = await fetch(
        `${BASE_URL}/status-pages/${BETTERSTACK_STATUS_PAGE_ID}/status-reports`,
        { headers: getHeaders(), cache: "no-store" }
      );
      if (repRes.ok) {
        const repJson = await repRes.json();
        const reports: any[] = repJson.data || [];
        for (const rep of reports) {
          const rid = String(rep.id);
          const rAttrs = rep.attributes || {};
          const isClosed = Boolean(rAttrs.closed_at);
          const activeRepInc = await getActiveIncidentForReport(rid);

          if (!isClosed) {
            if (!activeRepInc) {
              const state = String(rAttrs.aggregate_state || "degraded").toLowerCase();
              const isMaintenance = rAttrs.report_type === "maintenance" || state.includes("maintenance");
              const isOutage = state.includes("outage") || state.includes("down");

              const newInc = await createSystemIncident({
                title: rAttrs.title || "Degraded Performance",
                description: rAttrs.title || "Elevated latency and degraded performance across services",
                status: "investigating",
                severity: isMaintenance ? "maintenance" : isOutage ? "critical" : "minor",
                affectedServices: ["Neural Inference Clusters (Apex, Omni, Genesis, Flash)"],
                source: "betterstack",
                sourceReportId: rid,
                monitorName: "Neural Inference Clusters (Apex, Omni, Genesis, Flash)",
                monitorCheck: "roleflow.site",
              });
              result.incidentsCreated.push(newInc.id);
            }
          } else {
            if (activeRepInc) {
              const res = await resolveSystemIncident(activeRepInc.id, {
                monitorName: "Neural Inference Clusters (Apex, Omni, Genesis, Flash)",
                monitorCheck: "roleflow.site",
                resolutionMessage: "Operational — Issue resolved and nominal performance restored.",
              });
              if (res) result.incidentsResolved.push(activeRepInc.id);
            }
          }
        }
      }
    } catch (repErr) {
      console.error("Watchdog status reports error:", repErr);
    }

    const activeList = await getActiveSystemIncidents();
    result.activeIncidentCount = activeList.length;
  } catch (err) {
    console.error("Watchdog check error:", err);
  }

  return result;
}
