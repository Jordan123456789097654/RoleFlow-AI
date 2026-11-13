/**
 * Better Stack (Better Uptime) Maintenance Integration
 * Status Page: status.roleflow.site (Status Page ID: 269433)
 * Monitor: RoleFlow API & Database Health (Monitor ID: 5147818)
 */

// The token must come from the environment. Never commit a fallback value here.
export const BETTERSTACK_API_TOKEN = process.env.BETTERSTACK_API_TOKEN || "";
export const BETTERSTACK_STATUS_PAGE_ID =
  process.env.BETTERSTACK_STATUS_PAGE_ID || "269433";
export const BETTERSTACK_MONITOR_ID =
  process.env.BETTERSTACK_MONITOR_ID || "5147818";

const BASE_URL = "https://uptime.betterstack.com/api/v2";

function getHeaders() {
  return {
    Authorization: `Bearer ${BETTERSTACK_API_TOKEN}`,
    "Content-Type": "application/json",
  };
}

/** Per-model monitors, comma separated, e.g. "111,222,333,444". They pause with the main monitor. */
export const BETTERSTACK_MODEL_MONITOR_IDS = (process.env.BETTERSTACK_MODEL_MONITOR_IDS || "")
  .split(",")
  .map((id) => id.trim())
  .filter(Boolean);

async function setMonitorsPaused(paused: boolean): Promise<void> {
  const ids = [BETTERSTACK_MONITOR_ID, ...BETTERSTACK_MODEL_MONITOR_IDS];
  await Promise.all(
    ids.map((id) =>
      fetch(`${BASE_URL}/monitors/${id}`, {
        method: "PATCH",
        headers: getHeaders(),
        body: JSON.stringify({ paused }),
      }).catch((e) => console.error(`BetterStack ${paused ? "pause" : "unpause"} monitor ${id} err:`, e))
    )
  );
}

/**
 * Puts Better Stack into maintenance mode:
 * 1. Creates a Scheduled Maintenance report on status.roleflow.site
 * 2. Pauses the Uptime monitor so false alarm down notifications are not sent
 * 3. Updates the status page announcement banner
 */
export async function enableBetterStackMaintenance(): Promise<{
  success: boolean;
  reportId?: string;
  error?: string;
}> {
  if (!BETTERSTACK_API_TOKEN) {
    return { success: false, error: "No Better Stack API token configured" };
  }

  try {
    const startsAt = new Date().toISOString();
    // Default 4 hours maintenance window unless ended earlier
    const endsAt = new Date(Date.now() + 4 * 3600 * 1000).toISOString();

    // 1. Create Maintenance Report on status.roleflow.site
    const reportRes = await fetch(
      `${BASE_URL}/status-pages/${BETTERSTACK_STATUS_PAGE_ID}/status-reports`,
      {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({
          title: "Scheduled Maintenance",
          message:
            "RoleFlow is currently in scheduled maintenance for upgrades. Response generation is temporarily paused.",
          report_type: "maintenance",
          starts_at: startsAt,
          ends_at: endsAt,
          affected_resources: [
            { status_page_resource_id: "9040068", status: "maintenance" },
            { status_page_resource_id: "9040069", status: "maintenance" },
          ],
        }),
      }
    );

    let reportId: string | undefined = undefined;
    if (reportRes.ok) {
      const data = await reportRes.json();
      reportId = data.data?.id;
    } else {
      console.warn("BetterStack status report create returned:", reportRes.status);
    }

    // 2. Pause the uptime monitor
    await setMonitorsPaused(true);

    // 3. Set the announcement banner on status.roleflow.site
    await fetch(`${BASE_URL}/status-pages/${BETTERSTACK_STATUS_PAGE_ID}`, {
      method: "PATCH",
      headers: getHeaders(),
      body: JSON.stringify({
        announcement:
          "RoleFlow is currently undergoing scheduled maintenance. Services are temporarily paused.",
      }),
    }).catch((e) => console.error("BetterStack announcement err:", e));

    return { success: true, reportId };
  } catch (error: any) {
    console.error("BetterStack enable maintenance error:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Takes Better Stack out of maintenance mode:
 * 1. Unpauses the Uptime monitor
 * 2. Clears the status page announcement banner
 * 3. Resolves/deletes any active maintenance reports
 */
export async function disableBetterStackMaintenance(): Promise<{
  success: boolean;
  error?: string;
}> {
  if (!BETTERSTACK_API_TOKEN) {
    return { success: false, error: "No Better Stack API token configured" };
  }

  try {
    // 1. Unpause the uptime monitor
    await setMonitorsPaused(false);

    // 2. Clear status page announcement banner
    await fetch(`${BASE_URL}/status-pages/${BETTERSTACK_STATUS_PAGE_ID}`, {
      method: "PATCH",
      headers: getHeaders(),
      body: JSON.stringify({ announcement: "" }),
    }).catch((e) => console.error("BetterStack clear announcement err:", e));

    // 3. Fetch active status reports and resolve/clean them up
    const reportsRes = await fetch(
      `${BASE_URL}/status-pages/${BETTERSTACK_STATUS_PAGE_ID}/status-reports`,
      {
        headers: getHeaders(),
      }
    );

    if (reportsRes.ok) {
      const data = await reportsRes.json();
      const reports: any[] = data.data || [];
      for (const rep of reports) {
        if (
          rep.attributes?.report_type === "maintenance" &&
          rep.attributes?.aggregate_state !== "resolved"
        ) {
          // Delete or complete the maintenance window
          await fetch(
            `${BASE_URL}/status-pages/${BETTERSTACK_STATUS_PAGE_ID}/status-reports/${rep.id}`,
            {
              method: "DELETE",
              headers: getHeaders(),
            }
          ).catch((e) => console.error("BetterStack delete report err:", e));
        }
      }
    }

    return { success: true };
  } catch (error: any) {
    console.error("BetterStack disable maintenance error:", error);
    return { success: false, error: error.message };
  }
}
