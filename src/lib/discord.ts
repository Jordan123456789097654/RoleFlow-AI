import crypto from "crypto";
import type { SystemIncident, IncidentStatus, IncidentSeverity } from "@/types";

export const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN || "";
export const DISCORD_STATUS_CHANNEL_ID = process.env.DISCORD_STATUS_CHANNEL_ID || "";
export const DISCORD_GUILD_ID = process.env.DISCORD_GUILD_ID || "";
export const DISCORD_APPLICATION_ID = process.env.DISCORD_APPLICATION_ID || "";
export const DISCORD_PUBLIC_KEY = process.env.DISCORD_PUBLIC_KEY || "";

export const STATUS_PAGE_URL = "https://status.roleflow.site";

const DISCORD_API_BASE = "https://discord.com/api/v10";

function getDiscordHeaders() {
  return {
    Authorization: `Bot ${DISCORD_BOT_TOKEN}`,
    "Content-Type": "application/json",
    "User-Agent": "DiscordBot (RoleFlow, 1.0)",
  };
}

export interface DiscordEmbedOptions {
  monitorName?: string;
  monitorCheck?: string;
  errorMessage?: string;
  state?: "created" | "recovered" | "degraded" | "maintenance";
}

/**
 * Builds the exact Discord Embed and Link Button requested:
 * - 🔴 Incident #RF-INC-0001 created - Our API is down
 * - 🟢 Incident #RF-INC-0001 recovered - Our API is up
 * - Error: Unexpected status code 502
 * - Affected monitor: Our API – HTTP HEAD https://...
 * - [View incident ↗] button
 */
export function buildIncidentMessagePayload(
  incident: SystemIncident,
  opts?: DiscordEmbedOptions
) {
  const monitorName =
    opts?.monitorName ||
    (incident.affectedServices && incident.affectedServices[0]) ||
    "RoleFlow API & Models";

  const monitorCheck =
    opts?.monitorCheck ||
    (monitorName.includes("API")
      ? "HTTP GET https://roleflow.site/api/health"
      : `Neural Inference Cluster (roleflow.site)`);

  const errorText =
    opts?.errorMessage ||
    incident.description ||
    (incident.status === "resolved"
      ? "Operational — All endpoints responding within nominal thresholds"
      : "Unexpected status code 502 / Connection Timeout");

  // Determine state
  let state = opts?.state;
  if (!state) {
    if (incident.status === "resolved") {
      state = "recovered";
    } else if (incident.severity === "maintenance" || incident.status === "monitoring") {
      state = "maintenance";
    } else if (incident.severity === "minor" || incident.status === "identified") {
      state = "degraded";
    } else {
      state = "created";
    }
  }

  let title = "";
  let color = 15548997; // Discord Red #ED4245

  if (state === "recovered") {
    title = `🟢 Incident #${incident.id} recovered - ${monitorName} is up`;
    color = 5763719; // Discord Green #57F287
  } else if (state === "degraded") {
    title = `🟡 Incident #${incident.id} degraded - ${monitorName} is degraded`;
    color = 16705372; // Discord Yellow #FEE75C
  } else if (state === "maintenance") {
    title = `🛠️ Incident #${incident.id} maintenance - ${monitorName} is under maintenance`;
    color = 5793266; // Discord Blurple #5865F2
  } else {
    // "created" / down
    title = `🔴 Incident #${incident.id} created - ${monitorName} is down`;
    color = 15548997; // Discord Red #ED4245
  }

  return {
    embeds: [
      {
        title,
        color,
        fields: [
          {
            name: "Error",
            value: errorText,
            inline: false,
          },
          {
            name: "Affected monitor",
            value: `${monitorName} – ${monitorCheck}`,
            inline: false,
          },
        ],
      },
    ],
    components: [
      {
        type: 1, // ACTION_ROW
        components: [
          {
            type: 2, // BUTTON
            style: 5, // LINK
            label: "View incident",
            url: STATUS_PAGE_URL,
          },
        ],
      },
    ],
  };
}

/**
 * Sends a new incident embed message via the Discord bot.
 */
export async function sendDiscordIncidentMessage(
  incident: SystemIncident,
  opts?: DiscordEmbedOptions
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const payload = buildIncidentMessagePayload(incident, opts);
    const res = await fetch(
      `${DISCORD_API_BASE}/channels/${DISCORD_STATUS_CHANNEL_ID}/messages`,
      {
        method: "POST",
        headers: getDiscordHeaders(),
        body: JSON.stringify(payload),
      }
    );

    if (!res.ok) {
      const errText = await res.text();
      console.error("Discord send incident error:", res.status, errText);
      return { success: false, error: `HTTP ${res.status}: ${errText}` };
    }

    const json = await res.json();
    return { success: true, messageId: json.id };
  } catch (err: any) {
    console.error("Discord send incident exception:", err);
    return { success: false, error: err?.message || "Unknown error" };
  }
}

/**
 * Updates/patches an existing incident embed message via the Discord bot.
 * If message is not found (e.g. 404), creates a new message.
 */
export async function updateDiscordIncidentMessage(
  incident: SystemIncident,
  opts?: DiscordEmbedOptions
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  if (!incident.discordMessageId) {
    return sendDiscordIncidentMessage(incident, opts);
  }

  try {
    const payload = buildIncidentMessagePayload(incident, opts);
    const res = await fetch(
      `${DISCORD_API_BASE}/channels/${DISCORD_STATUS_CHANNEL_ID}/messages/${incident.discordMessageId}`,
      {
        method: "PATCH",
        headers: getDiscordHeaders(),
        body: JSON.stringify(payload),
      }
    );

    if (res.status === 404) {
      // Original message deleted, send fresh message
      return sendDiscordIncidentMessage(incident, opts);
    }

    if (!res.ok) {
      const errText = await res.text();
      console.error("Discord patch incident error:", res.status, errText);
      return { success: false, error: `HTTP ${res.status}: ${errText}` };
    }

    const json = await res.json();
    return { success: true, messageId: json.id };
  } catch (err: any) {
    console.error("Discord patch incident exception:", err);
    return { success: false, error: err?.message || "Unknown error" };
  }
}

/**
 * Verifies Ed25519 signature for Discord Interactions (HTTP endpoints hosted on Vercel).
 */
export function verifyDiscordInteraction(
  rawBody: string,
  signature: string | null,
  timestamp: string | null
): boolean {
  if (!signature || !timestamp || !DISCORD_PUBLIC_KEY) return false;

  try {
    const publicKey = crypto.createPublicKey({
      key: Buffer.concat([
        Buffer.from("302a300506032b6570032100", "hex"),
        Buffer.from(DISCORD_PUBLIC_KEY, "hex"),
      ]),
      format: "der",
      type: "spki",
    });

    return crypto.verify(
      null,
      Buffer.from(timestamp + rawBody),
      publicKey,
      Buffer.from(signature, "hex")
    );
  } catch (e) {
    console.error("Discord interaction signature verification error:", e);
    return false;
  }
}
