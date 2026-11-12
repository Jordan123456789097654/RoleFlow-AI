"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Shield,
  Activity,
  Server,
  Users,
  Sliders,
  AlertTriangle,
  Download,
  RefreshCw,
  CheckCircle,
  ArrowLeft,
  Ban,
  RotateCcw,
  Search,
  Check,
  Cpu,
  Zap,
  Lock,
  Clock,
  Sparkles,
} from "lucide-react";
import { UserProfile, SystemConfig, ModerationLogEntry, IncidentContext, IncidentTurn } from "@/types";

type AdminTab = "telemetry" | "config" | "users" | "moderation";

const focusRing = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40";

const inputClass = `w-full rounded-xl border border-line bg-app px-3.5 py-2.5 text-sm text-ink placeholder:text-muted/70 focus:outline-none focus:border-accent/60 transition-colors ${focusRing}`;

const primaryButtonClass = `inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-50 ${focusRing}`;

const secondaryButtonClass = `inline-flex items-center gap-1.5 rounded-xl border border-line bg-card px-3 py-1.5 text-xs font-medium text-ink transition-colors hover:bg-hover disabled:cursor-not-allowed disabled:opacity-50 ${focusRing}`;

const dangerButtonClass = `inline-flex items-center gap-1.5 rounded-xl border border-danger/30 bg-danger-soft px-3 py-1.5 text-xs font-medium text-danger transition-colors hover:bg-danger/20 disabled:cursor-not-allowed disabled:opacity-50 ${focusRing}`;

const cardClass = "rounded-2xl border border-line bg-card";

const NAV: { id: AdminTab; label: string; icon: React.ReactNode }[] = [
  { id: "telemetry", label: "Overview", icon: <Activity className="h-4 w-4" /> },
  { id: "config", label: "System settings", icon: <Sliders className="h-4 w-4" /> },
  { id: "users", label: "Users", icon: <Users className="h-4 w-4" /> },
  { id: "moderation", label: "Moderation", icon: <AlertTriangle className="h-4 w-4" /> },
];

/** Small status pill. Palette colors are reserved for status like this. */
function Badge({
  tone,
  children,
  mono = false,
}: {
  tone: "neutral" | "danger" | "success" | "warning" | "info";
  children?: React.ReactNode;
  mono?: boolean;
}) {
  const tones: Record<typeof tone, string> = {
    neutral: "border-line bg-hover text-muted",
    danger: "border-danger/30 bg-danger-soft text-danger",
    success: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
    warning: "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300",
    info: "border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-300",
  };
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium ${mono ? "font-mono" : ""} ${tones[tone]}`}
    >
      {children}
    </span>
  );
}

/** Accessible on/off switch. */
function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={onChange}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
        checked ? "bg-accent" : "bg-hover border border-line"
      } ${focusRing}`}
    >
      <span
        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
          checked ? "translate-x-5" : "translate-x-0.5"
        }`}
      />
    </button>
  );
}

/** Stat tile used on the overview. */
function StatCard({
  label,
  value,
  hint,
  valueClassName = "",
}: {
  label: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
  valueClassName?: string;
}) {
  return (
    <div className={`${cardClass} p-5`}>
      <div className="text-sm text-muted">{label}</div>
      <div className={`mt-1.5 font-display text-3xl tabular-nums text-ink ${valueClassName}`}>{value}</div>
      {hint && <div className="mt-1.5 text-xs text-muted">{hint}</div>}
    </div>
  );
}

/** Model status card on the overview. */
function ModelCard({
  icon,
  name,
  description,
  status,
  stats,
}: {
  icon: React.ReactNode;
  name: string;
  description: string;
  status: React.ReactNode;
  stats: { label: string; value: string }[];
}) {
  return (
    <div className={`${cardClass} flex flex-col p-5`}>
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sm font-medium text-ink">
          <span className="text-accent">{icon}</span>
          <span>{name}</span>
        </div>
        {status}
      </div>
      <p className="mb-4 text-sm leading-relaxed text-muted">{description}</p>
      <div className="mt-auto grid grid-cols-2 gap-3 border-t border-line pt-3">
        {stats.map((s) => (
          <div key={s.label}>
            <div className="text-xs text-muted">{s.label}</div>
            <div className="mt-0.5 text-sm font-medium tabular-nums text-ink">{s.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Shows the conversation captured when an incident was flagged, including attachments and images. */
function ConversationContext({ raw }: { raw?: string }) {
  if (!raw) {
    return (
      <div className="mt-2 text-xs text-muted">
        No conversation captured for this incident (recorded before context capture was enabled).
      </div>
    );
  }
  let turns: IncidentTurn[] = [];
  try {
    turns = (JSON.parse(raw) as IncidentContext).turns;
  } catch {
    return <div className="mt-2 text-xs text-danger">Captured conversation could not be parsed.</div>;
  }
  return (
    <details className="mt-2">
      <summary className={`cursor-pointer select-none rounded text-xs text-muted hover:text-ink ${focusRing}`}>
        Conversation at time of flag ({turns.length} turns)
      </summary>
      <div className="mt-2 max-h-96 space-y-2 overflow-y-auto">
        {turns.map((t, i) => (
          <div key={i} className="rounded-xl border border-line bg-app p-3 text-xs">
            <div className="mb-1 text-[10px] font-medium uppercase tracking-wide text-muted">{t.role}</div>
            {t.content && <div className="whitespace-pre-wrap break-words text-ink">{t.content}</div>}
            {(t.attachments || []).map((a, j) => (
              <div key={j} className="mt-2">
                <div className="text-muted">
                  [{a.imageDataUrl !== undefined ? "image" : "file"}] {a.name} ({a.type})
                </div>
                {a.imageDataUrl && (
                  <img
                    src={a.imageDataUrl}
                    alt={a.name}
                    className="mt-1 max-h-64 rounded-lg border border-line"
                  />
                )}
                {a.imageDataUrl === null && (
                  <div className="mt-1 text-muted">Image bytes not retained for this turn.</div>
                )}
                {a.text && (
                  <pre className="mt-1 max-h-40 overflow-y-auto whitespace-pre-wrap break-words text-ink">
                    {a.text}
                  </pre>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>
    </details>
  );
}

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<AdminTab>("telemetry");
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isAdminAuthorized, setIsAdminAuthorized] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  // Telemetry data
  const [stats, setStats] = useState<{
    totalUsers: number;
    totalChats: number;
    modelKeys: { total: number; active: number; keysMasked: string[] };
    users: any[];
  } | null>(null);
  const [moderationLogs, setModerationLogs] = useState<ModerationLogEntry[]>([]);
  const [totalMemories, setTotalMemories] = useState<number>(0);

  // System Configurations
  const [config, setConfig] = useState<SystemConfig>({
    guestLimit: 5,
    registeredDailyLimit: 25,
    maintenanceMode: false,
    broadcastBanner: "",
    allowHighEffort: true,
  });
  const [configSaving, setConfigSaving] = useState(false);
  const [configSuccess, setConfigSuccess] = useState(false);

  // Users data
  const [usersList, setUsersList] = useState<UserProfile[]>([]);
  const [userSearch, setUserSearch] = useState("");
  const [userFilter, setUserFilter] = useState<"all" | "admins" | "banned" | "active">("all");
  const [userActionLoading, setUserActionLoading] = useState<string | null>(null);

  // Moderation filter
  const [modStatusFilter, setModStatusFilter] = useState<string>("all");
  const [modTierFilter, setModTierFilter] = useState<string>("all");
  const [modActionLoading, setModActionLoading] = useState<string | null>(null);

  // Notification Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Auth & Initial Data Load
  useEffect(() => {
    let localUser: UserProfile | null = null;
    const saved = localStorage.getItem("roleflow_user");
    if (saved) {
      try {
        localUser = JSON.parse(saved);
        setUser(localUser);
      } catch (e) {}
    } else {
      const match = document.cookie.match(/roleflow_user=([^;]+)/);
      if (match && match[1]) {
        try {
          localUser = JSON.parse(decodeURIComponent(match[1]));
          setUser(localUser);
        } catch (e) {}
      }
    }

    const hasAdminFlag = Boolean(localUser?.isAdmin);

    if (hasAdminFlag) {
      setIsAdminAuthorized(true);
      fetchAllAdminData();
    } else {
      // Check config endpoint to verify server-side auth
      fetch("/api/admin/config")
        .then((res) => {
          if (res.ok) {
            setIsAdminAuthorized(true);
            fetchAllAdminData();
          } else {
            setIsAdminAuthorized(false);
            setLoading(false);
          }
        })
        .catch(() => {
          setIsAdminAuthorized(false);
          setLoading(false);
        });
    }
  }, []);

  const fetchAllAdminData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchStats(),
        fetchConfig(),
        fetchUsers(),
        fetchModerationLogs(),
      ]);
    } catch (err) {
      console.error("Admin data load error:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await fetch("/api/admin/stats");
      if (res.ok) {
        const data = await res.json();
        if (data.stats) setStats(data.stats);
      }
    } catch (e) {
      console.error("Failed to fetch stats:", e);
    }
  };

  const fetchConfig = async () => {
    try {
      const res = await fetch("/api/admin/config");
      if (res.ok) {
        const data = await res.json();
        if (data.config) setConfig(data.config);
      }
    } catch (e) {
      console.error("Failed to fetch config:", e);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/admin/users");
      if (res.ok) {
        const data = await res.json();
        if (data.users) setUsersList(data.users);
      }
    } catch (e) {
      console.error("Failed to fetch users:", e);
    }
  };

  const fetchModerationLogs = async () => {
    try {
      const res = await fetch("/api/moderation/logs");
      if (res.ok) {
        const data = await res.json();
        if (data.logs) setModerationLogs(data.logs);
      }
    } catch (e) {
      console.error("Failed to fetch moderation logs:", e);
    }
  };

  // Config Update
  const handleSaveConfig = async () => {
    setConfigSaving(true);
    try {
      const res = await fetch("/api/admin/config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });
      if (res.ok) {
        const data = await res.json();
        setConfig(data.config);
        setConfigSuccess(true);
        showToast("System configurations persisted successfully.");
        setTimeout(() => setConfigSuccess(false), 3000);
      } else {
        const err = await res.json();
        showToast(err.error || "Failed to update configuration.");
      }
    } catch (e) {
      showToast("Network error updating system config.");
    } finally {
      setConfigSaving(false);
    }
  };

  // User Actions
  const handleUserAction = async (action: "toggleAdmin" | "banUser" | "unbanUser" | "resetQuota", targetUser: UserProfile) => {
    setUserActionLoading(`${action}-${targetUser.id}`);
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, userId: targetUser.id, email: targetUser.email }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast(data.message || `Action ${action} completed.`);
        await fetchUsers();
      } else {
        showToast(data.error || "Action failed.");
      }
    } catch (e) {
      showToast("Network error performing action.");
    } finally {
      setUserActionLoading(null);
    }
  };

  // Moderation Actions
  const handleModerationAction = async (logId: string, action: "UNBAN_DISMISS" | "CONFIRM_BAN") => {
    setModActionLoading(`${action}-${logId}`);
    try {
      const res = await fetch("/api/moderation/logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ logId, action }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast(data.message || "Incident status updated.");
        await fetchModerationLogs();
        await fetchUsers();
      } else {
        showToast(data.error || "Failed to update moderation log.");
      }
    } catch (e) {
      showToast("Network error updating moderation log.");
    } finally {
      setModActionLoading(null);
    }
  };

  // Emergency Global Reset
  const handleEmergencyReset = async () => {
    if (!confirm("Are you sure you want to reset all message usage counters for all registered users and guests?")) {
      return;
    }
    try {
      const res = await fetch("/api/admin/reset-limits", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        showToast(data.message || "All usage limits successfully reset.");
        await fetchUsers();
        await fetchStats();
      } else {
        showToast(data.error || "Failed to reset limits.");
      }
    } catch (e) {
      showToast("Network error during reset.");
    }
  };

  // Filtered Users
  const filteredUsers = usersList.filter((u) => {
    const query = userSearch.toLowerCase();
    const matchSearch =
      u.email.toLowerCase().includes(query) ||
      u.name.toLowerCase().includes(query) ||
      u.id.toLowerCase().includes(query);
    if (!matchSearch) return false;

    if (userFilter === "admins") return Boolean(u.isAdmin);
    if (userFilter === "banned") return Boolean(u.isBanned);
    if (userFilter === "active") return !u.isBanned;
    return true;
  });

  // Filtered Moderation Logs
  const filteredLogs = moderationLogs.filter((log) => {
    if (modStatusFilter !== "all" && log.status !== modStatusFilter) return false;
    if (modTierFilter !== "all" && String(log.tier) !== modTierFilter) return false;
    return true;
  });

  // Access Denied Screen
  if (isAdminAuthorized === false) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-app p-6 text-ink">
        <div className="w-full max-w-md rounded-2xl border border-line bg-card p-8 text-center shadow-menu">
          <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-accent-soft text-accent">
            <Lock className="h-6 w-6" />
          </div>
          <h1 className="mb-2 font-display text-2xl text-ink">Admin access required</h1>
          <p className="mb-6 text-sm leading-relaxed text-muted">
            This console is available only to verified RoleFlow administrators.
          </p>
          <Link href="/chat" className={`${primaryButtonClass} w-full justify-center`}>
            <ArrowLeft className="h-4 w-4" />
            <span>Back to chat</span>
          </Link>
        </div>
      </div>
    );
  }

  const pendingCount = moderationLogs.filter((l) => l.status === "FLAGGED" || l.status === "APPEALED").length;

  return (
    <div className="flex min-h-screen flex-col bg-app text-ink">
      {/* Toast */}
      {toastMessage && (
        <div
          role="status"
          className="animate-message fixed bottom-6 right-6 z-50 flex max-w-sm items-center gap-3 rounded-xl border border-line bg-card px-4 py-3 text-sm text-ink shadow-menu"
        >
          <Sparkles className="h-4 w-4 shrink-0 text-accent" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top bar */}
      <header className="sticky top-0 z-30 border-b border-line bg-app/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-4">
            <Link
              href="/chat"
              className={`flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm text-muted transition-colors hover:bg-hover hover:text-ink ${focusRing}`}
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Back to chat</span>
            </Link>
            <div className="hidden h-5 w-px bg-line sm:block" />
            <div className="flex min-w-0 items-center gap-2.5">
              <span className="font-display text-lg text-ink truncate">Admin console</span>
              <span className="hidden items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-700 dark:text-emerald-400 md:inline-flex">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                Online
              </span>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={handleEmergencyReset}
              className={dangerButtonClass}
              title="Reset daily usage counters for all accounts"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Reset all quotas</span>
            </button>

            <button
              type="button"
              onClick={fetchAllAdminData}
              disabled={loading}
              className="rounded-lg border border-line bg-card p-2 text-muted transition-colors hover:bg-hover hover:text-ink disabled:opacity-50"
              title="Refresh data"
              aria-label="Refresh data"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            </button>

            <div className="hidden max-w-[220px] items-center gap-2 truncate rounded-lg border border-line bg-card px-3 py-1.5 text-xs text-muted md:flex">
              <Shield className="h-3.5 w-3.5 shrink-0 text-accent" />
              <span className="truncate">{user?.email || "Administrator"}</span>
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col md:flex-row">
        {/* Side navigation (horizontal row on small screens) */}
        <nav
          aria-label="Admin sections"
          className="flex shrink-0 gap-1 overflow-x-auto border-b border-line px-4 py-2 sm:px-6 md:w-56 md:flex-col md:overflow-visible md:border-b-0 md:border-r md:px-3 md:py-6"
        >
          {NAV.map((item) => {
            const isActive = activeTab === item.id;
            const badge =
              item.id === "moderation" && pendingCount > 0
                ? pendingCount
                : item.id === "users"
                ? usersList.length
                : null;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                aria-current={isActive ? "page" : undefined}
                className={`flex shrink-0 items-center gap-2.5 whitespace-nowrap rounded-lg px-3 py-2 text-sm transition-colors ${focusRing} ${
                  isActive ? "bg-hover font-medium text-ink" : "text-muted hover:bg-hover/60 hover:text-ink"
                }`}
              >
                <span className={isActive ? "text-accent" : ""}>{item.icon}</span>
                <span>{item.label}</span>
                {badge !== null && (
                  <span className="ml-auto rounded-full border border-line bg-app px-1.5 py-0.5 text-[10px] font-medium tabular-nums text-muted">
                    {badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 md:py-8">
          {/* OVERVIEW */}
          {activeTab === "telemetry" && (
            <div className="space-y-8">
              <div>
                <h1 className="font-display text-3xl text-ink">Overview</h1>
                <p className="mt-1.5 text-sm text-muted">Model health, usage, and safety at a glance.</p>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <ModelCard
                  icon={<Cpu className="h-4 w-4" />}
                  name="RoleFlow Genesis 1.0"
                  description="Flagship model for software engineering, architecture, and multi-step reasoning."
                  status={<Badge tone="success">Online</Badge>}
                  stats={[
                    { label: "Avg latency", value: "~840 ms" },
                    { label: "Context window", value: "128k tokens" },
                  ]}
                />
                <ModelCard
                  icon={<Zap className="h-4 w-4" />}
                  name="RoleFlow Flash 1.0"
                  description="Fast model for quick questions and rapid iteration."
                  status={<Badge tone="success">Online</Badge>}
                  stats={[
                    { label: "Avg latency", value: "~185 ms" },
                    { label: "Context window", value: "128k tokens" },
                  ]}
                />
                <ModelCard
                  icon={<Server className="h-4 w-4" />}
                  name="Inference pool"
                  description="Multi-key load balancing with automatic failover when a key is rate limited."
                  status={<Badge tone="success" mono>{stats?.modelKeys.active || 0} keys active</Badge>}
                  stats={[
                    { label: "Pool health", value: "Operational" },
                    { label: "Failover", value: "Round-robin" },
                  ]}
                />
              </div>

              <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                <StatCard
                  label="Registered users"
                  value={usersList.length || stats?.totalUsers || 0}
                  hint={<span className="text-emerald-700 dark:text-emerald-400">Signed in with email</span>}
                />
                <StatCard label="Chats" value={stats?.totalChats || 0} hint="Across all accounts" />
                <StatCard
                  label="Incidents"
                  value={moderationLogs.length}
                  valueClassName={moderationLogs.length > 0 ? "text-danger" : ""}
                  hint={`${moderationLogs.filter((l) => l.tier === 1).length} tier 1 blocks`}
                />
                <StatCard label="Memory" value="Active" hint="Personalized recall" />
              </div>

              {stats?.modelKeys.keysMasked && stats.modelKeys.keysMasked.length > 0 && (
                <div className={`${cardClass} p-5`}>
                  <h2 className="mb-3 text-sm font-medium text-ink">
                    Configured inference keys ({stats.modelKeys.keysMasked.length})
                  </h2>
                  <ul className="grid grid-cols-1 gap-2 md:grid-cols-2">
                    {stats.modelKeys.keysMasked.map((keyMask, idx) => (
                      <li
                        key={idx}
                        className="flex items-center justify-between rounded-xl border border-line bg-app px-3.5 py-2.5 text-xs"
                      >
                        <span className="flex items-center gap-2 text-muted">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                          Key {idx + 1}
                        </span>
                        <span className="font-mono text-ink">{keyMask}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* SYSTEM SETTINGS */}
          {activeTab === "config" && (
            <div className="max-w-2xl space-y-8">
              <div>
                <h1 className="font-display text-3xl text-ink">System settings</h1>
                <p className="mt-1.5 text-sm text-muted">
                  Changes take effect immediately for guests and registered users.
                </p>
              </div>

              <div className={`${cardClass} divide-y divide-line`}>
                {/* Guest limit */}
                <div className="space-y-3 p-5">
                  <div className="flex items-center justify-between gap-3">
                    <label htmlFor="guest-limit" className="text-sm font-medium text-ink">
                      Guest message limit
                    </label>
                    <span className="rounded-md bg-accent-soft px-2 py-0.5 text-xs font-medium tabular-nums text-accent">
                      {config.guestLimit} messages
                    </span>
                  </div>
                  <input
                    id="guest-limit"
                    type="range"
                    min="1"
                    max="50"
                    step="1"
                    value={config.guestLimit}
                    onChange={(e) => setConfig({ ...config, guestLimit: parseInt(e.target.value, 10) })}
                    className="h-2 w-full cursor-pointer accent-[rgb(var(--c-accent))]"
                  />
                  <p className="text-xs text-muted">
                    Default 5. Complimentary messages for visitors who are not signed in.
                  </p>
                </div>

                {/* Registered daily quota */}
                <div className="space-y-3 p-5">
                  <div className="flex items-center justify-between gap-3">
                    <label htmlFor="daily-quota" className="text-sm font-medium text-ink">
                      Daily quota per user
                    </label>
                    <span className="rounded-md bg-accent-soft px-2 py-0.5 text-xs font-medium tabular-nums text-accent">
                      {config.registeredDailyLimit} / day
                    </span>
                  </div>
                  <input
                    id="daily-quota"
                    type="range"
                    min="5"
                    max="200"
                    step="5"
                    value={config.registeredDailyLimit}
                    onChange={(e) => setConfig({ ...config, registeredDailyLimit: parseInt(e.target.value, 10) })}
                    className="h-2 w-full cursor-pointer accent-[rgb(var(--c-accent))]"
                  />
                  <p className="text-xs text-muted">
                    Default 25. Resets at midnight UTC.
                  </p>
                </div>

                {/* Maintenance mode */}
                <div className="flex items-start justify-between gap-4 p-5">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2 text-sm font-medium text-ink">
                      <span>Maintenance mode</span>
                      {config.maintenanceMode && <Badge tone="danger">Active</Badge>}
                    </div>
                    <div className="mt-0.5 text-xs text-muted">
                      When on, non-admin chat requests receive a maintenance notice.
                    </div>
                  </div>
                  <Toggle
                    label="Maintenance mode"
                    checked={config.maintenanceMode}
                    onChange={() => setConfig({ ...config, maintenanceMode: !config.maintenanceMode })}
                  />
                </div>

                {/* High effort */}
                <div className="flex items-start justify-between gap-4 p-5">
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-ink">High-effort reasoning</div>
                    <div className="mt-0.5 text-xs text-muted">
                      Lets users choose the Extra and Max reasoning levels.
                    </div>
                  </div>
                  <Toggle
                    label="Allow high-effort reasoning"
                    checked={config.allowHighEffort}
                    onChange={() => setConfig({ ...config, allowHighEffort: !config.allowHighEffort })}
                  />
                </div>

                {/* Broadcast banner */}
                <div className="space-y-3 p-5">
                  <label htmlFor="broadcast-banner" className="block text-sm font-medium text-ink">
                    Announcement banner
                  </label>
                  <input
                    id="broadcast-banner"
                    type="text"
                    placeholder="e.g. Scheduled maintenance at 03:00 UTC."
                    value={config.broadcastBanner}
                    onChange={(e) => setConfig({ ...config, broadcastBanner: e.target.value })}
                    className={inputClass}
                  />
                  {config.broadcastBanner.trim() && (
                    <div className="flex items-center gap-2.5 rounded-xl border border-accent/30 bg-accent-soft px-3.5 py-2.5 text-sm text-ink">
                      <Sparkles className="h-4 w-4 shrink-0 text-accent" />
                      <span className="font-medium">Preview:</span>
                      <span className="min-w-0 break-words">{config.broadcastBanner}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3">
                {configSuccess && (
                  <span className="flex items-center gap-1.5 text-sm font-medium text-emerald-700 dark:text-emerald-400">
                    <Check className="h-4 w-4" />
                    Saved
                  </span>
                )}
                <button type="button" onClick={handleSaveConfig} disabled={configSaving} className={primaryButtonClass}>
                  {configSaving ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4" />
                      <span>Save changes</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* USERS */}
          {activeTab === "users" && (
            <div className="space-y-6">
              <div>
                <h1 className="font-display text-3xl text-ink">Users</h1>
                <p className="mt-1.5 text-sm text-muted">{usersList.length} accounts</p>
              </div>

              <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="relative w-full sm:w-80">
                  <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                  <input
                    type="text"
                    placeholder="Search by name, email, or ID"
                    aria-label="Search users"
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    className={`${inputClass} py-2 pl-10`}
                  />
                </div>

                <div role="tablist" aria-label="Filter users" className="flex items-center gap-1 overflow-x-auto rounded-xl border border-line bg-card p-1">
                  {(["all", "admins", "banned", "active"] as const).map((filterKey) => (
                    <button
                      key={filterKey}
                      type="button"
                      role="tab"
                      aria-selected={userFilter === filterKey}
                      onClick={() => setUserFilter(filterKey)}
                      className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium capitalize transition-colors ${focusRing} ${
                        userFilter === filterKey ? "bg-hover text-ink" : "text-muted hover:text-ink"
                      }`}
                    >
                      {filterKey}
                    </button>
                  ))}
                </div>
              </div>

              <div className={`${cardClass} overflow-hidden`}>
                <div className="max-h-[70vh] overflow-auto">
                  <table className="w-full min-w-[720px] text-left text-sm">
                    <thead className="sticky top-0 z-10 border-b border-line bg-panel text-xs text-muted">
                      <tr>
                        <th scope="col" className="px-5 py-3 font-medium">User</th>
                        <th scope="col" className="px-4 py-3 font-medium">Role</th>
                        <th scope="col" className="px-4 py-3 font-medium">Status</th>
                        <th scope="col" className="px-4 py-3 font-medium">Daily quota</th>
                        <th scope="col" className="px-4 py-3 font-medium">Strikes</th>
                        <th scope="col" className="px-5 py-3 text-right font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-line">
                      {filteredUsers.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-5 py-10 text-center text-sm text-muted">
                            No users match this filter.
                          </td>
                        </tr>
                      ) : (
                        filteredUsers.map((u) => {
                          const isAdminUser = Boolean(u.isAdmin);
                          const isSelf =
                            u.id === user?.id ||
                            Boolean(user?.email && u.email.toLowerCase() === user.email.toLowerCase());
                          return (
                            <tr key={u.id} className="transition-colors hover:bg-hover/50">
                              <td className="px-5 py-3.5">
                                <div className="flex items-center gap-3">
                                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent-soft text-xs font-medium text-accent">
                                    {u.name ? u.name.charAt(0).toUpperCase() : u.email.charAt(0).toUpperCase()}
                                  </div>
                                  <div className="min-w-0 max-w-[220px]">
                                    <div className="truncate font-medium text-ink">{u.name || "Unnamed user"}</div>
                                    <div className="truncate text-xs text-muted">{u.email}</div>
                                  </div>
                                </div>
                              </td>

                              <td className="px-4 py-3.5">
                                {isAdminUser ? <Badge tone="warning">Admin</Badge> : <Badge tone="neutral">User</Badge>}
                              </td>

                              <td className="px-4 py-3.5">
                                {u.isBanned ? (
                                  <Badge tone="danger">
                                    <Ban className="h-3 w-3" />
                                    Suspended
                                  </Badge>
                                ) : (
                                  <Badge tone="success">Active</Badge>
                                )}
                              </td>

                              <td className="px-4 py-3.5">
                                <div className="tabular-nums text-ink">
                                  {isAdminUser ? (
                                    <span className="text-muted">Unlimited</span>
                                  ) : (
                                    <span>
                                      {u.messageCount || 0} / {config.registeredDailyLimit}
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-1 text-[11px] text-muted">
                                  <Clock className="h-3 w-3" />
                                  {u.lastResetDate ? `Reset ${u.lastResetDate}` : "Never reset"}
                                </div>
                              </td>

                              <td className="px-4 py-3.5">
                                <span className={`tabular-nums ${(u.strikes || 0) > 0 ? "font-medium text-danger" : "text-muted"}`}>
                                  {u.strikes || 0}
                                </span>
                              </td>

                              <td className="px-5 py-3.5">
                                <div className="flex items-center justify-end gap-1.5">
                                  {!isSelf && (
                                    <button
                                      type="button"
                                      onClick={() => handleUserAction("toggleAdmin", u)}
                                      disabled={userActionLoading === `toggleAdmin-${u.id}`}
                                      className={`rounded-lg border p-1.5 transition-colors disabled:opacity-50 ${focusRing} ${
                                        u.isAdmin
                                          ? "border-amber-500/30 text-amber-700 hover:bg-amber-500/10 dark:text-amber-300"
                                          : "border-line text-muted hover:bg-hover hover:text-ink"
                                      }`}
                                      title={u.isAdmin ? "Revoke admin rights" : "Grant admin rights"}
                                      aria-label={u.isAdmin ? "Revoke admin rights" : "Grant admin rights"}
                                    >
                                      <Shield className="h-3.5 w-3.5" />
                                    </button>
                                  )}

                                  {!isSelf && (
                                    <button
                                      type="button"
                                      onClick={() => handleUserAction(u.isBanned ? "unbanUser" : "banUser", u)}
                                      disabled={userActionLoading === `${u.isBanned ? "unbanUser" : "banUser"}-${u.id}`}
                                      className={`rounded-lg border p-1.5 transition-colors disabled:opacity-50 ${focusRing} ${
                                        u.isBanned
                                          ? "border-emerald-500/30 text-emerald-700 hover:bg-emerald-500/10 dark:text-emerald-400"
                                          : "border-danger/30 text-danger hover:bg-danger-soft"
                                      }`}
                                      title={u.isBanned ? "Lift suspension" : "Suspend account"}
                                      aria-label={u.isBanned ? "Lift suspension" : "Suspend account"}
                                    >
                                      <Ban className="h-3.5 w-3.5" />
                                    </button>
                                  )}

                                  <button
                                    type="button"
                                    onClick={() => handleUserAction("resetQuota", u)}
                                    disabled={userActionLoading === `resetQuota-${u.id}`}
                                    className={`rounded-lg border border-line p-1.5 text-muted transition-colors hover:bg-hover hover:text-ink disabled:opacity-50 ${focusRing}`}
                                    title="Reset daily quota to 0"
                                    aria-label="Reset daily quota to 0"
                                  >
                                    <RotateCcw className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* MODERATION */}
          {activeTab === "moderation" && (
            <div className="space-y-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h1 className="font-display text-3xl text-ink">Moderation</h1>
                  <p className="mt-1.5 text-sm text-muted">
                    Showing {filteredLogs.length} of {moderationLogs.length} incident records.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <label htmlFor="mod-status" className="sr-only">Status</label>
                  <select
                    id="mod-status"
                    value={modStatusFilter}
                    onChange={(e) => setModStatusFilter(e.target.value)}
                    className={`rounded-xl border border-line bg-card px-3 py-2 text-sm text-ink ${focusRing}`}
                  >
                    <option value="all">All statuses</option>
                    <option value="FLAGGED">Flagged (pending)</option>
                    <option value="BANNED">Banned</option>
                    <option value="APPEALED">Appealed</option>
                    <option value="RESOLVED">Resolved</option>
                  </select>

                  <label htmlFor="mod-tier" className="sr-only">Tier</label>
                  <select
                    id="mod-tier"
                    value={modTierFilter}
                    onChange={(e) => setModTierFilter(e.target.value)}
                    className={`rounded-xl border border-line bg-card px-3 py-2 text-sm text-ink ${focusRing}`}
                  >
                    <option value="all">All tiers</option>
                    <option value="1">Tier 1: violent extremism</option>
                    <option value="2">Tier 2: cyberattack and exploitation</option>
                  </select>
                </div>
              </div>

              {filteredLogs.length === 0 ? (
                <div className={`${cardClass} flex flex-col items-center gap-2 px-6 py-14 text-center`}>
                  <CheckCircle className="h-7 w-7 text-emerald-600 dark:text-emerald-400" />
                  <p className="text-sm font-medium text-ink">No incidents match these filters</p>
                  <p className="text-sm text-muted">The queue is clear for the current selection.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredLogs.map((log) => {
                    const isTier1 = log.tier === 1;
                    return (
                      <article key={log.id} className={`${cardClass} space-y-4 p-5`}>
                        {/* Incident meta */}
                        <div className="flex flex-col gap-2 border-b border-line pb-4 sm:flex-row sm:items-center sm:justify-between">
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge tone={isTier1 ? "danger" : "warning"}>
                              Tier {log.tier}
                            </Badge>
                            <span className="font-mono text-xs text-ink">{log.category}</span>
                            <span className="font-mono text-[11px] text-muted">{log.id}</span>
                          </div>
                          <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
                            <span className="tabular-nums">{new Date(log.createdAt).toLocaleString()}</span>
                            <span className="font-mono">IP {log.ipAddress || "127.0.0.1"}</span>
                            <Badge
                              tone={
                                log.status === "BANNED"
                                  ? "danger"
                                  : log.status === "RESOLVED"
                                  ? "success"
                                  : "warning"
                              }
                            >
                              {log.status}
                            </Badge>
                          </div>
                        </div>

                        {/* Account and prompt */}
                        <div className="space-y-2">
                          <div className="text-xs text-muted">
                            Account <span className="font-mono text-ink">{log.userEmail}</span>{" "}
                            <span className="font-mono">({log.userId})</span>
                          </div>
                          <div className="max-h-32 overflow-y-auto whitespace-pre-wrap break-words rounded-xl border border-line bg-app p-3.5 font-mono text-xs text-ink">
                            {log.prompt}
                          </div>
                          <ConversationContext raw={log.context} />
                          {log.appealNote && (
                            <div className="rounded-xl border border-sky-500/20 bg-sky-500/10 p-3 text-xs">
                              <span className="mb-0.5 block font-medium text-sky-700 dark:text-sky-300">
                                User appeal
                              </span>
                              <span className="text-ink">{log.appealNote}</span>
                            </div>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                          {log.matchedKeywords && log.matchedKeywords.length > 0 ? (
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span className="text-[11px] text-muted">Matched rules</span>
                              {log.matchedKeywords.map((kw, i) => (
                                <span
                                  key={i}
                                  className="rounded-md border border-line bg-hover px-1.5 py-0.5 font-mono text-[11px] text-muted"
                                >
                                  {kw}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span />
                          )}

                          <div className="ml-auto flex flex-wrap items-center gap-2">
                            <a
                              href={`/api/moderation/dossier?logId=${log.id}`}
                              download={`RoleFlow-Incident-Dossier-${log.id}.txt`}
                              className={secondaryButtonClass}
                              title="Download the legal incident dossier"
                            >
                              <Download className="h-3.5 w-3.5" />
                              <span>Download dossier</span>
                            </a>

                            {log.status !== "BANNED" && (
                              <button
                                type="button"
                                onClick={() => handleModerationAction(log.id, "CONFIRM_BAN")}
                                disabled={modActionLoading === `CONFIRM_BAN-${log.id}`}
                                className={dangerButtonClass}
                              >
                                <Ban className="h-3.5 w-3.5" />
                                <span>Confirm ban</span>
                              </button>
                            )}

                            {log.status !== "RESOLVED" && (
                              <button
                                type="button"
                                onClick={() => handleModerationAction(log.id, "UNBAN_DISMISS")}
                                disabled={modActionLoading === `UNBAN_DISMISS-${log.id}`}
                                className={secondaryButtonClass}
                              >
                                <CheckCircle className="h-3.5 w-3.5" />
                                <span>Dismiss and lift ban</span>
                              </button>
                            )}
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
