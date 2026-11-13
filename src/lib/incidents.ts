import { db } from "@/lib/db";
import {
  sendDiscordIncidentMessage,
  updateDiscordIncidentMessage,
  DiscordEmbedOptions,
} from "@/lib/discord";
import type {
  SystemIncident,
  IncidentStatus,
  IncidentSeverity,
  IncidentUpdateEntry,
} from "@/types";

export interface CreateIncidentOptions {
  title: string;
  description: string;
  status?: IncidentStatus;
  severity?: IncidentSeverity;
  affectedServices?: string[];
  source?: "betterstack" | "internal" | "manual";
  sourceMonitorId?: string;
  sourceReportId?: string;
  monitorName?: string;
  monitorCheck?: string;
}

export interface UpdateIncidentOptions {
  status?: IncidentStatus;
  severity?: IncidentSeverity;
  message?: string;
  description?: string;
  monitorName?: string;
  monitorCheck?: string;
}

/**
 * Creates and announces a new incident with automated ID (RF-INC-XXXX).
 * Sends the announcement to Discord # 📡・status via the bot.
 */
export async function createSystemIncident(
  opts: CreateIncidentOptions
): Promise<SystemIncident> {
  const { id, incidentNumber } = await db.getNextSystemIncidentNumber();
  const now = new Date().toISOString();

  const status: IncidentStatus = opts.status || "investigating";
  const severity: IncidentSeverity = opts.severity || "major";

  const initialUpdate: IncidentUpdateEntry = {
    id: `upd_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    status,
    message: opts.description,
    timestamp: now,
  };

  const incident: SystemIncident = {
    id,
    incidentNumber,
    title: opts.title,
    description: opts.description,
    status,
    severity,
    affectedServices: opts.affectedServices || [opts.monitorName || "RoleFlow API"],
    source: opts.source || "internal",
    sourceMonitorId: opts.sourceMonitorId,
    sourceReportId: opts.sourceReportId,
    createdAt: now,
    updatedAt: now,
    updates: [initialUpdate],
  };

  // Determine state for embed
  let state: DiscordEmbedOptions["state"] = "created";
  if (severity === "maintenance") state = "maintenance";
  else if (severity === "minor") state = "degraded";

  // Dispatch via Discord Bot
  const discordRes = await sendDiscordIncidentMessage(incident, {
    monitorName: opts.monitorName,
    monitorCheck: opts.monitorCheck,
    errorMessage: opts.description,
    state,
  });

  if (discordRes.success && discordRes.messageId) {
    incident.discordMessageId = discordRes.messageId;
  }

  await db.saveSystemIncident(incident);
  return incident;
}

/**
 * Updates an ongoing incident and updates the Discord message embed in-place.
 */
export async function updateSystemIncident(
  incidentId: string,
  opts: UpdateIncidentOptions
): Promise<SystemIncident | null> {
  const incident = await db.getSystemIncidentById(incidentId);
  if (!incident) return null;

  const now = new Date().toISOString();
  if (opts.status) incident.status = opts.status;
  if (opts.severity) incident.severity = opts.severity;
  if (opts.description) incident.description = opts.description;
  incident.updatedAt = now;

  if (opts.message) {
    incident.updates.push({
      id: `upd_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      status: incident.status,
      message: opts.message,
      timestamp: now,
    });
  }

  // Update in Discord
  const discordRes = await updateDiscordIncidentMessage(incident, {
    monitorName: opts.monitorName,
    monitorCheck: opts.monitorCheck,
    errorMessage: opts.message || opts.description || incident.description,
  });

  if (discordRes.success && discordRes.messageId) {
    incident.discordMessageId = discordRes.messageId;
  }

  await db.saveSystemIncident(incident);
  return incident;
}

/**
 * Resolves an active incident and turns the Discord embed green (recovered).
 */
export async function resolveSystemIncident(
  incidentId: string,
  opts?: { resolutionMessage?: string; monitorName?: string; monitorCheck?: string }
): Promise<SystemIncident | null> {
  const incident = await db.getSystemIncidentById(incidentId);
  if (!incident) return null;

  const now = new Date().toISOString();
  incident.status = "resolved";
  incident.resolvedAt = now;
  incident.updatedAt = now;

  const msg =
    opts?.resolutionMessage ||
    "Operational — All systems operational and recovered within normal parameters.";

  incident.updates.push({
    id: `upd_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    status: "resolved",
    message: msg,
    timestamp: now,
  });

  // Turn embed green in Discord
  const discordRes = await updateDiscordIncidentMessage(incident, {
    monitorName: opts?.monitorName,
    monitorCheck: opts?.monitorCheck,
    errorMessage: incident.description, // Keep original error context
    state: "recovered",
  });

  if (discordRes.success && discordRes.messageId) {
    incident.discordMessageId = discordRes.messageId;
  }

  await db.saveSystemIncident(incident);
  return incident;
}

/**
 * Looks up any active (unresolved) incident matching a specific Better Stack monitor ID.
 */
export async function getActiveIncidentForMonitor(
  monitorId: string
): Promise<SystemIncident | null> {
  const all = await db.getSystemIncidents();
  return (
    all.find(
      (inc) =>
        inc.sourceMonitorId === monitorId && inc.status !== "resolved"
    ) || null
  );
}

/**
 * Looks up any active (unresolved) incident matching a specific Better Stack report ID.
 */
export async function getActiveIncidentForReport(
  reportId: string
): Promise<SystemIncident | null> {
  const all = await db.getSystemIncidents();
  return (
    all.find(
      (inc) =>
        inc.sourceReportId === reportId && inc.status !== "resolved"
    ) || null
  );
}

/**
 * Returns all active (unresolved) incidents.
 */
export async function getActiveSystemIncidents(): Promise<SystemIncident[]> {
  const all = await db.getSystemIncidents();
  return all.filter((inc) => inc.status !== "resolved");
}
