"use client";

import { AlertTriangle, ExternalLink, Loader2 } from "lucide-react";
import { STATUS_BANNER, STATUS_DOT, STATUS_LABEL, STATUS_TEXT, timeAgo } from "@/lib/status";
import { useSystemStatus } from "@/lib/use-system-status";

const STATUS_PAGE = "https://status.roleflow.site";

/**
 * Live status for each model, rendered in the page itself. It replaces the old iframe, which the
 * status host blocks from embedding. The overall banner turns amber when a model is degraded and
 * red when one is down.
 */
export function SystemStatus() {
  const { data, error, loading } = useSystemStatus();

  const banner = loading
    ? "Checking systems…"
    : error && !data
      ? "Status unavailable"
      : STATUS_BANNER[data!.overall];

  const dot = loading || (error && !data) ? "" : STATUS_DOT[data!.overall];

  return (
    <div className="mx-auto max-w-2xl overflow-hidden rounded-2xl border border-line bg-card">
      <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-3.5">
        <div className="flex min-w-0 items-center gap-2.5">
          {loading ? (
            <Loader2 className="h-4 w-4 shrink-0 animate-spin text-muted" aria-hidden />
          ) : error && !data ? (
            <AlertTriangle className="h-4 w-4 shrink-0 text-muted" aria-hidden />
          ) : (
            <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${dot}`} aria-hidden />
          )}
          <p className="truncate text-sm font-medium text-ink" role="status">
            {banner}
          </p>
        </div>
        {data && <span className="shrink-0 text-xs text-muted">Updated {timeAgo(data.checkedAt)}</span>}
      </div>

      <ul className="divide-y divide-line">
        {loading &&
          [0, 1, 2, 3].map((i) => (
            <li key={i} className="flex items-center justify-between gap-3 px-5 py-3">
              <div className="h-3.5 w-40 animate-pulse rounded bg-hover" />
              <div className="h-3.5 w-16 animate-pulse rounded bg-hover" />
            </li>
          ))}

        {data?.models.map((m) => (
          <li key={m.id} className="flex items-center justify-between gap-3 px-5 py-3">
            <div className="min-w-0">
              <p className="truncate text-sm text-ink">{m.name}</p>
              <p className="truncate text-xs text-muted">{m.detail}</p>
            </div>
            <div className="flex shrink-0 items-center gap-3">
              {m.latencyMs !== null && (
                <span className="font-mono text-xs tabular-nums text-muted">{m.latencyMs} ms</span>
              )}
              <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${STATUS_TEXT[m.status]}`}>
                <span className={`h-2 w-2 rounded-full ${STATUS_DOT[m.status]}`} aria-hidden />
                {STATUS_LABEL[m.status]}
              </span>
            </div>
          </li>
        ))}
      </ul>

      <div className="flex items-center justify-between gap-3 border-t border-line px-5 py-2.5 text-xs text-muted">
        <span>{error && !data ? "We couldn't reach the status service." : "Checked every few minutes."}</span>
        <a
          href={STATUS_PAGE}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex shrink-0 items-center gap-1 text-accent hover:underline"
        >
          Incident history
          <ExternalLink className="h-3 w-3" aria-hidden />
        </a>
      </div>
    </div>
  );
}
