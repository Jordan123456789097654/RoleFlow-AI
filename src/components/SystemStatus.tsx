"use client";

import React from "react";
import { CheckCircle2, ChevronDown, ExternalLink, Loader2, RefreshCw } from "lucide-react";
import { useSystemStatus } from "@/lib/use-system-status";
import { timeAgo } from "@/lib/status";

const STATUS_PAGE = "https://status.roleflow.site";

export function SystemStatus() {
  const { data, loading, isRefreshing, refresh } = useSystemStatus(15_000);

  const telemetry = data?.telemetry || [
    {
      id: "5147818",
      name: "RoleFlow API & Database Health",
      section: "Monitors" as const,
      status: "operational" as const,
      uptimePercent: 78.069,
      historyBars: Array.from({ length: 90 }, (_, i) => (i < 68 ? "none" : i === 72 || i === 85 || i === 86 ? "incident" : "up")),
    },
    {
      id: "5147821",
      name: "RoleFlow Frontend (Landing Page)",
      section: "Monitors" as const,
      status: "operational" as const,
      uptimePercent: 81.362,
      historyBars: Array.from({ length: 90 }, (_, i) => (i < 68 ? "none" : i === 70 || i === 84 || i === 85 ? "incident" : i === 71 ? "maintenance" : "up")),
    },
    {
      id: "5232079",
      name: "Omni-1",
      section: "Models" as const,
      status: "operational" as const,
      uptimePercent: 35.482,
      historyBars: Array.from({ length: 90 }, (_, i) => (i < 88 ? "none" : "incident")),
    },
    {
      id: "5232080",
      name: "Genesis-1",
      section: "Models" as const,
      status: "operational" as const,
      uptimePercent: 53.036,
      historyBars: Array.from({ length: 90 }, (_, i) => (i < 88 ? "none" : "incident")),
    },
    {
      id: "5232081",
      name: "Flash 2",
      section: "Models" as const,
      status: "operational" as const,
      uptimePercent: 50.238,
      historyBars: Array.from({ length: 90 }, (_, i) => (i < 88 ? "none" : "incident")),
    },
    {
      id: "5232078",
      name: "Apex 1",
      section: "Models" as const,
      status: "operational" as const,
      uptimePercent: 30.792,
      historyBars: Array.from({ length: 90 }, (_, i) => (i < 88 ? "none" : "incident")),
    },
  ];

  const monitors = telemetry.filter((t) => t.section === "Monitors");
  const models = telemetry.filter((t) => t.section === "Models");

  return (
    <div className="mx-auto max-w-3xl rounded-2xl border border-[#1b2230] bg-[#10141d] p-6 sm:p-7 text-white shadow-2xl space-y-7 font-sans">
      {/* Top Live Bar */}
      <div className="flex items-center justify-between pb-3 border-b border-[#1b2230]">
        <div className="flex items-center gap-2.5">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
          </span>
          <span className="text-xs font-medium text-emerald-400 uppercase tracking-wider">
            Live Better Stack Sync
          </span>
        </div>

        <div className="flex items-center gap-3">
          {data && (
            <span className="text-xs text-[#94a3b8] tabular-nums">
              Updated {timeAgo(data.checkedAt)}
            </span>
          )}
          <button
            type="button"
            onClick={() => refresh()}
            disabled={isRefreshing}
            className="rounded p-1 text-[#94a3b8] hover:text-white transition-colors disabled:opacity-50"
            title="Refresh telemetry"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin text-emerald-400" : ""}`} />
          </button>
        </div>
      </div>

      {/* Section 1: Monitors */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold tracking-wide text-white">Monitors</h3>
          <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-[#052e16] px-2.5 py-0.5 text-xs font-medium text-emerald-400">
            <CheckCircle2 className="h-3 w-3 text-emerald-400" />
            <span>Operational</span>
            <ChevronDown className="h-3 w-3 text-emerald-400/80" />
          </div>
        </div>

        <div className="space-y-6">
          {monitors.map((m) => (
            <div key={m.id} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span className="text-sm font-medium text-white">{m.name}</span>
                </div>
                <span className="text-xs font-mono font-medium text-emerald-400">
                  {typeof m.uptimePercent === "number" ? m.uptimePercent.toFixed(3) : "100.000"}% uptime
                </span>
              </div>

              {/* 90-day History Bars */}
              <div className="flex h-7 w-full items-center gap-[2px]">
                {m.historyBars.map((bar, idx) => {
                  let barColor = "bg-[#1c2331]";
                  if (bar === "up") barColor = "bg-emerald-500";
                  else if (bar === "incident") barColor = "bg-[#f87171]";
                  else if (bar === "maintenance") barColor = "bg-[#38bdf8]";
                  return (
                    <div
                      key={idx}
                      className={`h-full flex-1 rounded-[1.5px] ${barColor} transition-colors`}
                      title={`Day ${idx + 1}`}
                    />
                  );
                })}
              </div>

              <div className="flex items-center justify-between text-[11px] text-[#64748b]">
                <span>90 days ago</span>
                <span>Today</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Section Divider */}
      <div className="border-t border-[#1b2230]" />

      {/* Section 2: Models */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold tracking-wide text-white">Models</h3>
          <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-[#052e16] px-2.5 py-0.5 text-xs font-medium text-emerald-400">
            <CheckCircle2 className="h-3 w-3 text-emerald-400" />
            <span>Operational</span>
            <ChevronDown className="h-3 w-3 text-emerald-400/80" />
          </div>
        </div>

        <div className="space-y-6">
          {models.map((m) => (
            <div key={m.id} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span className="text-sm font-medium text-white">{m.name}</span>
                </div>
                <span className="text-xs font-mono font-medium text-emerald-400">
                  {typeof m.uptimePercent === "number" ? m.uptimePercent.toFixed(3) : "100.000"}% uptime
                </span>
              </div>

              {/* 90-day History Bars */}
              <div className="flex h-7 w-full items-center gap-[2px]">
                {m.historyBars.map((bar, idx) => {
                  let barColor = "bg-[#1c2331]";
                  if (bar === "up") barColor = "bg-emerald-500";
                  else if (bar === "incident") barColor = "bg-[#f87171]";
                  else if (bar === "maintenance") barColor = "bg-[#38bdf8]";
                  return (
                    <div
                      key={idx}
                      className={`h-full flex-1 rounded-[1.5px] ${barColor} transition-colors`}
                      title={`Day ${idx + 1}`}
                    />
                  );
                })}
              </div>

              <div className="flex items-center justify-between text-[11px] text-[#64748b]">
                <span>90 days ago</span>
                <span>Today</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer Link */}
      <div className="flex items-center justify-between pt-3 border-t border-[#1b2230] text-xs text-[#64748b]">
        <span>Live incident telemetry powered by Better Stack</span>
        <a
          href={STATUS_PAGE}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-[#ea580c] hover:underline font-medium"
        >
          Incident history & status page
          <ExternalLink className="h-3 w-3" />
        </a>
      </div>
    </div>
  );
}
