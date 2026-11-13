/**
 * Shared, client-safe status types and display helpers.
 */

export type HealthStatus = "operational" | "degraded" | "down";

export interface MonitorTelemetryItem {
  id: string;
  name: string;
  section: "Monitors" | "Models";
  status: HealthStatus;
  uptimePercent: number;
  historyBars: ("none" | "up" | "incident" | "maintenance")[];
}

/** One model or backend service as shown to the public. */
export interface PublicModelStatus {
  id: string;
  name: string;
  status: HealthStatus;
  latencyMs: number | null;
  checkedAt: string;
  detail: string;
  category?: "backend" | "model";
}

export interface SystemStats {
  uptimePercent: number;
  avgLatencyMs: number;
  healthySystems: number;
  totalSystems: number;
  activeKeys: number;
  totalKeys: number;
}

export interface PublicStatus {
  overall: HealthStatus;
  checkedAt: string;
  stats?: SystemStats;
  telemetry?: MonitorTelemetryItem[];
  backend?: PublicModelStatus[];
  models: PublicModelStatus[];
}

export const STATUS_LABEL: Record<HealthStatus, string> = {
  operational: "Operational",
  degraded: "Degraded",
  down: "Down",
};

export const STATUS_BANNER: Record<HealthStatus, string> = {
  operational: "All systems operational",
  degraded: "Some systems are degraded",
  down: "Some systems are experiencing outages",
};

export const STATUS_DOT: Record<HealthStatus, string> = {
  operational: "bg-emerald-500",
  degraded: "bg-amber-500",
  down: "bg-danger",
};

export const STATUS_TEXT: Record<HealthStatus, string> = {
  operational: "text-emerald-700 dark:text-emerald-400",
  degraded: "text-amber-700 dark:text-amber-300",
  down: "text-danger",
};

/** "just now", "5s ago", "3 min ago", "2 h ago". */
export function timeAgo(iso: string, now: number = Date.now()): string {
  const seconds = Math.max(0, Math.round((now - Date.parse(iso)) / 1000));
  if (seconds < 5) return "just now";
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  return `${Math.round(minutes / 60)} h ago`;
}
