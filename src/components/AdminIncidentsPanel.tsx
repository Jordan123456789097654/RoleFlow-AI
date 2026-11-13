"use client";

import React, { useState, useEffect } from "react";
import {
  Radio,
  CheckCircle,
  AlertCircle,
  Clock,
  ExternalLink,
  RefreshCw,
  Send,
  Check,
  Shield,
  Layers,
  Sparkles,
} from "lucide-react";
import type { SystemIncident } from "@/types";

export default function AdminIncidentsPanel() {
  const [incidents, setIncidents] = useState<SystemIncident[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionBusy, setActionBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  // Manual incident form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [monitorName, setMonitorName] = useState("RoleFlow API");
  const [severity, setSeverity] = useState<"critical" | "major" | "minor" | "maintenance">("critical");

  const fetchIncidents = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/incidents", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setIncidents(data.incidents || []);
      }
    } catch (e) {
      console.error("Failed to load incidents:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIncidents();
  }, []);

  const handleTestOutage = async () => {
    try {
      setActionBusy(true);
      const res = await fetch("/api/admin/incidents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "test_outage",
          error: "Unexpected status code 502",
        }),
      });
      const data = await res.json();
      if (data.success) {
        setMessage(`Created test outage ${data.incident.id} and dispatched to Discord!`);
        await fetchIncidents();
      } else {
        setMessage(`Error: ${data.error}`);
      }
    } catch (e: any) {
      setMessage(`Network error: ${e.message}`);
    } finally {
      setActionBusy(false);
    }
  };

  const handleTestRecovery = async (incidentId: string) => {
    try {
      setActionBusy(true);
      const res = await fetch("/api/admin/incidents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "test_recovery",
          incidentId,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setMessage(`Resolved incident ${incidentId} and updated Discord embed to green!`);
        await fetchIncidents();
      } else {
        setMessage(`Error: ${data.error}`);
      }
    } catch (e: any) {
      setMessage(`Network error: ${e.message}`);
    } finally {
      setActionBusy(false);
    }
  };

  const handleRunWatchdog = async () => {
    try {
      setActionBusy(true);
      const res = await fetch("/api/admin/incidents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "run_watchdog" }),
      });
      const data = await res.json();
      if (data.success) {
        setMessage(`Watchdog run complete: checked ${data.result.monitorsChecked} monitors.`);
        await fetchIncidents();
      }
    } catch (e: any) {
      setMessage(`Watchdog failed: ${e.message}`);
    } finally {
      setActionBusy(false);
    }
  };

  const handleCreateManual = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;

    try {
      setActionBusy(true);
      const res = await fetch("/api/admin/incidents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create",
          title,
          description,
          severity,
          monitorName,
          affectedServices: [monitorName],
        }),
      });
      const data = await res.json();
      if (data.success) {
        setMessage(`Created incident ${data.incident.id} and dispatched via bot!`);
        setTitle("");
        setDescription("");
        await fetchIncidents();
      }
    } catch (e: any) {
      setMessage(`Error: ${e.message}`);
    } finally {
      setActionBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-3xl text-ink">Incidents & Status Telemetry</h1>
          <p className="mt-1.5 text-sm text-muted">
            Automated Better Stack outage detection, Discord status channel dispatching, and incident numbering (RF-INC-XXXX).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleRunWatchdog}
            disabled={actionBusy}
            className="inline-flex items-center gap-1.5 rounded-xl border border-line bg-card px-3 py-1.5 text-xs font-medium text-ink transition-colors hover:bg-hover disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${actionBusy ? "animate-spin" : ""}`} />
            Run Telemetry Watchdog
          </button>
          <button
            type="button"
            onClick={handleTestOutage}
            disabled={actionBusy}
            className="inline-flex items-center gap-1.5 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-1.5 text-xs font-medium text-rose-600 hover:bg-rose-500/20 disabled:opacity-50 dark:text-rose-400"
          >
            <Send className="h-3.5 w-3.5" />
            Simulate Outage Alert
          </button>
        </div>
      </div>

      {message && (
        <div className="rounded-xl border border-accent/20 bg-accent/5 p-4 text-xs font-medium text-accent">
          {message}
        </div>
      )}

      {/* Quick Status Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-line bg-card p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-muted">Discord Bot</span>
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
          </div>
          <div className="mt-2 text-xl font-bold text-ink">RoleFlow Official Bot</div>
          <p className="mt-1 text-xs text-muted">Target: # 📡・status (1570677429536690253)</p>
        </div>

        <div className="rounded-2xl border border-line bg-card p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-muted">Better Stack</span>
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
          </div>
          <div className="mt-2 text-xl font-bold text-ink">status.roleflow.site</div>
          <p className="mt-1 text-xs text-muted">Page ID: 269433 • 6 Live Monitors</p>
        </div>

        <div className="rounded-2xl border border-line bg-card p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-muted">Active Incidents</span>
            <span className="h-2 w-2 rounded-full bg-amber-500" />
          </div>
          <div className="mt-2 text-xl font-bold text-ink">
            {incidents.filter((i) => i.status !== "resolved").length} Active
          </div>
          <p className="mt-1 text-xs text-muted">Total logged: {incidents.length}</p>
        </div>
      </div>

      {/* Manual Declare Incident */}
      <div className="rounded-2xl border border-line bg-card p-5">
        <h2 className="text-sm font-semibold text-ink">Declare Operational Incident</h2>
        <p className="mt-1 text-xs text-muted">
          Manual incidents will automatically receive the next sequential ID (e.g. RF-INC-0001) and dispatch directly to Discord.
        </p>

        <form onSubmit={handleCreateManual} className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="text-xs text-muted">Incident Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Neural Cluster High Latency"
              className="mt-1 w-full rounded-xl border border-line bg-app px-3 py-2 text-sm text-ink placeholder:text-muted/60 focus:border-accent focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="text-xs text-muted">Affected Monitor / Service</label>
            <select
              value={monitorName}
              onChange={(e) => setMonitorName(e.target.value)}
              className="mt-1 w-full rounded-xl border border-line bg-app px-3 py-2 text-sm text-ink focus:border-accent focus:outline-none"
            >
              <option value="RoleFlow API">RoleFlow API</option>
              <option value="Apex 1.0">Apex 1.0</option>
              <option value="Omni 1.0">Omni 1.0</option>
              <option value="Genesis 1.5">Genesis 1.5</option>
              <option value="Flash 2.0">Flash 2.0</option>
              <option value="RoleFlow Frontend (Landing Page)">RoleFlow Frontend (Landing Page)</option>
            </select>
          </div>

          <div className="sm:col-span-2">
            <label className="text-xs text-muted">Error / Situation Description</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Unexpected status code 502 / Upstream provider latency > 5000ms"
              className="mt-1 w-full rounded-xl border border-line bg-app px-3 py-2 text-sm text-ink placeholder:text-muted/60 focus:border-accent focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="text-xs text-muted">Severity</label>
            <select
              value={severity}
              onChange={(e) => setSeverity(e.target.value as any)}
              className="mt-1 w-full rounded-xl border border-line bg-app px-3 py-2 text-sm text-ink focus:border-accent focus:outline-none"
            >
              <option value="critical">🔴 Critical Outage</option>
              <option value="major">🔴 Major Outage</option>
              <option value="minor">🟡 Minor / Degraded</option>
              <option value="maintenance">🛠️ Maintenance</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              disabled={actionBusy}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-accent px-4 py-2 text-sm font-medium text-on-accent transition-colors hover:bg-accent-hover disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
              Dispatch Incident to Discord
            </button>
          </div>
        </form>
      </div>

      {/* Incidents Table */}
      <div className="rounded-2xl border border-line bg-card p-5">
        <h2 className="text-sm font-semibold text-ink">Recorded Incidents</h2>
        <p className="mt-1 text-xs text-muted">
          All system incidents, their Discord synchronization state, and resolution history.
        </p>

        {loading ? (
          <div className="py-8 text-center text-sm text-muted">Loading incidents...</div>
        ) : incidents.length === 0 ? (
          <div className="py-8 text-center text-sm text-muted">
            No incidents recorded. All systems are operational.
          </div>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-line text-muted">
                  <th className="pb-2 font-medium">Incident ID</th>
                  <th className="pb-2 font-medium">Title & Monitor</th>
                  <th className="pb-2 font-medium">Severity</th>
                  <th className="pb-2 font-medium">Status</th>
                  <th className="pb-2 font-medium">Discord Message</th>
                  <th className="pb-2 font-medium">Logged</th>
                  <th className="pb-2 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {incidents.map((inc) => (
                  <tr key={inc.id} className="hover:bg-hover/50">
                    <td className="py-3 font-mono font-bold text-accent">{inc.id}</td>
                    <td className="py-3">
                      <div className="font-medium text-ink">{inc.title}</div>
                      <div className="text-[11px] text-muted">{inc.description}</div>
                    </td>
                    <td className="py-3">
                      <span
                        className={`inline-block rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase ${
                          inc.severity === "critical" || inc.severity === "major"
                            ? "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                            : inc.severity === "minor"
                            ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                            : "bg-blue-500/10 text-blue-600 dark:text-blue-400"
                        }`}
                      >
                        {inc.severity}
                      </span>
                    </td>
                    <td className="py-3">
                      <span
                        className={`inline-block rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase ${
                          inc.status === "resolved"
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                            : "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                        }`}
                      >
                        {inc.status}
                      </span>
                    </td>
                    <td className="py-3 font-mono text-[11px] text-muted">
                      {inc.discordMessageId ? (
                        <span className="text-emerald-500">Synced (#{inc.discordMessageId.slice(-6)})</span>
                      ) : (
                        <span className="text-muted/60">—</span>
                      )}
                    </td>
                    <td className="py-3 text-[11px] text-muted">
                      {new Date(inc.createdAt).toLocaleString()}
                    </td>
                    <td className="py-3 text-right">
                      {inc.status !== "resolved" ? (
                        <button
                          type="button"
                          onClick={() => handleTestRecovery(inc.id)}
                          disabled={actionBusy}
                          className="inline-flex items-center gap-1 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2 py-1 text-[11px] font-medium text-emerald-600 hover:bg-emerald-500/20 disabled:opacity-50 dark:text-emerald-400"
                        >
                          <Check className="h-3 w-3" />
                          Resolve & Recover
                        </button>
                      ) : (
                        <span className="text-[11px] text-muted">Resolved</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
