/**
 * Shared, client-safe status types and display helpers. Keep this file free of server imports so
 * both the public status section and the admin dashboard can use it.
 */

export type HealthStatus = "operational" | "degraded" | "down";

/** One model as shown to the public. Never includes key labels or raw provider errors. */
export interface PublicModelStatus {
  id: string;
  name: string;
  status: HealthStatus;
  latencyMs: number | null;
  checkedAt: string;
  detail: string;
}

export interface PublicStatus {
  overall: HealthStatus;
  checkedAt: string;
  models: PublicModelStatus[];
}

export const STATUS_LABEL: Record<HealthStatus, string> = {
  operational: "Operational",
  degraded: "Degraded",
  down: "Down",
};

export const STATUS_BANNER: Record<HealthStatus, string> = {
  operational: "All systems operational",
  degraded: "Some models are degraded",
  down: "Some models are down",
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

/** "just now", "3 min ago", "2 h ago". */
export function timeAgo(iso: string, now: number = Date.now()): string {
  const seconds = Math.max(0, Math.round((now - Date.parse(iso)) / 1000));
  if (seconds < 60) return "just now";
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  return `${Math.round(minutes / 60)} h ago`;
}
