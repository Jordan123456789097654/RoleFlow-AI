"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Shield,
  Activity,
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
  Lock,
  Clock,
  Sparkles,
  Mail,
  MessageSquare,
} from "lucide-react";
import { UserProfile, SystemConfig, ModerationLogEntry, IncidentContext, IncidentTurn } from "@/types";
import AdminEmailsPanel from "@/components/AdminEmailsPanel";
import AdminBlogPanel from "@/components/AdminBlogPanel";
import AdminLicenseKeysPanel from "@/components/AdminLicenseKeysPanel";
import AdminLawRequestsPanel from "@/components/AdminLawRequestsPanel";
import { Scale, Ticket, BookOpen, Gavel, Radio, PenLine } from "lucide-react";
import AdminPunishmentsPanel from "@/components/AdminPunishmentsPanel";
import AdminHandbookPanel from "@/components/AdminHandbookPanel";
import AdminIncidentsPanel from "@/components/AdminIncidentsPanel";
import ReferralModal from "@/components/ReferralModal";
import AdminChatsPanel from "@/components/AdminChatsPanel";

type AdminTab = "attention" | "config" | "users" | "chats" | "moderation" | "blog" | "emails" | "licenses" | "law" | "handbook" | "punishments" | "incidents";

const focusRing = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40";

const inputClass = `w-full rounded-xl border border-line bg-app px-3.5 py-2.5 text-sm text-ink placeholder:text-muted/70 focus:outline-none focus:border-accent/60 transition-colors ${focusRing}`;

const primaryButtonClass = `inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2 text-sm font-medium text-on-accent transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-50 ${focusRing}`;

const secondaryButtonClass = `inline-flex items-center gap-1.5 rounded-xl border border-line bg-card px-3 py-1.5 text-xs font-medium text-ink transition-colors hover:bg-hover disabled:cursor-not-allowed disabled:opacity-50 ${focusRing}`;

const dangerButtonClass = `inline-flex items-center gap-1.5 rounded-xl border border-danger/30 bg-danger-soft px-3 py-1.5 text-xs font-medium text-danger transition-colors hover:bg-danger/20 disabled:cursor-not-allowed disabled:opacity-50 ${focusRing}`;

const cardClass = "rounded-2xl border border-line bg-card";

const NAV: { id: AdminTab; label: string; icon: React.ReactNode }[] = [
  { id: "attention", label: "Needs attention", icon: <Activity className="h-4 w-4" /> },
  { id: "incidents", label: "Incidents & Status", icon: <Radio className="h-4 w-4" /> },
  { id: "config", label: "System settings", icon: <Sliders className="h-4 w-4" /> },
  { id: "users", label: "Users", icon: <Users className="h-4 w-4" /> },
  { id: "punishments", label: "Punishments", icon: <Gavel className="h-4 w-4" /> },
  { id: "chats", label: "User Chats (Support)", icon: <MessageSquare className="h-4 w-4" /> },
  { id: "blog", label: "Blog Posts", icon: <PenLine className="h-4 w-4" /> },
  { id: "moderation", label: "Moderation", icon: <AlertTriangle className="h-4 w-4" /> },
  { id: "emails", label: "Emails", icon: <Mail className="h-4 w-4" /> },
  { id: "licenses", label: "License keys", icon: <Ticket className="h-4 w-4" /> },
  { id: "law", label: "Law enforcement", icon: <Scale className="h-4 w-4" /> },
  { id: "handbook", label: "Handbook", icon: <BookOpen className="h-4 w-4" /> },
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
  const [activeTab, setActiveTab] = useState<AdminTab>("attention");
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isAdminAuthorized, setIsAdminAuthorized] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  // Telemetry data
  const [stats, setStats] = useState<{
    totalUsers: number;
    totalChats: number;
    modelKeys: { total: number; active: number; keysMasked: string[]; cooling?: { label: string; reason: string; retryAt: string }[] };
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
    apiKeysEnabled: true,
    apiKeyDefaultRpm: 30,
    apiKeyDefaultRpd: 2500,
    apiKeyMaxPerUser: 5,
    forcedModel: null,
    forcedEffort: "low",
  });
  const [configSaving, setConfigSaving] = useState(false);
  const [configSuccess, setConfigSuccess] = useState(false);
  const [selectedUserForChats, setSelectedUserForChats] = useState("");

  // Users data
  const [usersList, setUsersList] = useState<UserProfile[]>([]);
  const [userSearch, setUserSearch] = useState("");
  const [userFilter, setUserFilter] = useState<"all" | "admins" | "banned" | "active">("all");
  const [userActionLoading, setUserActionLoading] = useState<string | null>(null);

  // Moderation filter
  const [modStatusFilter, setModStatusFilter] = useState<string>("all");
  const [modTierFilter, setModTierFilter] = useState<string>("all");
  const [modActionLoading, setModActionLoading] = useState<string | null>(null);
  const [modSearch, setModSearch] = useState("");
  const [modCategoryFilter, setModCategoryFilter] = useState<string>("all");
  const [modUserFilter, setModUserFilter] = useState<string>("");
  const [selectedLogIds, setSelectedLogIds] = useState<Set<string>>(new Set());
  const [noteDrafts, setNoteDrafts] = useState<Record<string, string>>({});
  const [bulkBusy, setBulkBusy] = useState(false);

  // Notification Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [referralLog, setReferralLog] = useState<ModerationLogEntry | null>(null);
  const [referredIds, setReferredIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (activeTab !== "moderation") return;
    fetch("/api/admin/referrals", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : { referrals: [] }))
      .then((d) => setReferredIds(new Set((d.referrals || []).map((r: any) => r.incidentId))))
      .catch(() => {});
  }, [activeTab]);

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
        if (data.config) setConfig((prev) => ({ ...prev, ...data.config }));
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
  const handleUserAction = async (
    action: "toggleAdmin" | "banUser" | "unbanUser" | "resetQuota" | "warnUser" | "suspendUser",
    targetUser: UserProfile,
    extra: Record<string, unknown> = {}
  ) => {
    const payload: Record<string, unknown> = { ...extra };
    if (action === "warnUser" || action === "suspendUser" || action === "banUser") {
      const reason = window.prompt("Reason for this action. It is kept in the punishment history.")?.trim() || "";
      if (reason.length < 3) {
        showToast("A reason of at least 3 characters is required.");
        return;
      }
      payload.reason = reason;
    }
    setUserActionLoading(`${action}-${targetUser.id}`);
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, userId: targetUser.id, email: targetUser.email, ...payload }),
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

  // Moderation actions. The server records each one on the incident with the admin's email.
  type ModAction = "UNBAN_DISMISS" | "CONFIRM_BAN" | "WARN" | "SUSPEND" | "ESCALATE" | "REOPEN" | "NOTE";

  const runModerationAction = async (logId: string, action: ModAction, extra: Record<string, unknown> = {}) => {
    const res = await fetch("/api/moderation/logs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ logId, action, ...extra }),
    });
    const data = await res.json().catch(() => ({}));
    return { ok: res.ok, message: data.message || data.error || "Done." };
  };

  const handleModerationAction = async (logId: string, action: ModAction, extra: Record<string, unknown> = {}) => {
    setModActionLoading(`${action}-${logId}`);
    try {
      const result = await runModerationAction(logId, action, extra);
      showToast(result.message);
      if (result.ok) {
        await fetchModerationLogs();
        await fetchUsers();
      }
      return result.ok;
    } catch (e) {
      showToast("Network error updating moderation log.");
      return false;
    } finally {
      setModActionLoading(null);
    }
  };

  const handleBulkAction = async (action: ModAction, extra: Record<string, unknown> = {}) => {
    const ids: string[] = Array.from(selectedLogIds);
    if (ids.length === 0) return;
    setBulkBusy(true);
    let done = 0;
    for (const id of ids) {
      try {
        const result = await runModerationAction(id, action, extra);
        if (result.ok) done++;
      } catch (_) {
        // Counted as not updated.
      }
    }
    showToast(`${done} of ${ids.length} incidents updated.`);
    setSelectedLogIds(new Set());
    await fetchModerationLogs();
    await fetchUsers();
    setBulkBusy(false);
  };

  const handleSaveNote = async (logId: string) => {
    const text = (noteDrafts[logId] || "").trim();
    if (!text) return;
    const ok = await handleModerationAction(logId, "NOTE", { note: text });
    if (ok) setNoteDrafts((d) => ({ ...d, [logId]: "" }));
  };

  const toggleSelected = (id: string, checked: boolean) =>
    setSelectedLogIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });

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
  const q = modSearch.trim().toLowerCase();
  const filteredLogs = moderationLogs.filter((log) => {
    if (modStatusFilter !== "all" && log.status !== modStatusFilter) return false;
    if (modTierFilter !== "all" && String(log.tier) !== modTierFilter) return false;
    if (modCategoryFilter !== "all" && log.category !== modCategoryFilter) return false;
    if (modUserFilter && log.userEmail !== modUserFilter) return false;
    if (q && !(log.userEmail.toLowerCase().includes(q) || log.prompt.toLowerCase().includes(q) || log.id.toLowerCase().includes(q))) return false;
    return true;
  });
  const categories = Array.from(new Set(moderationLogs.map((l) => l.category))).sort();

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

  const pendingCount = moderationLogs.filter((l) => l.status === "FLAGGED" || l.status === "APPEALED" || l.status === "ESCALATED").length;
  const pendingItems = moderationLogs
    .filter((l) => l.status === "FLAGGED" || l.status === "APPEALED" || l.status === "ESCALATED")
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const newUsersThisWeek = usersList.filter((u) => new Date(u.createdAt).getTime() >= weekAgo).length;
  const bannedCount = usersList.filter((u) => u.isBanned).length;
  const recentUsers = [...usersList]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

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

        <main key={activeTab} className="rf-panel-enter min-w-0 flex-1 px-4 py-6 sm:px-6 md:py-8">
          {/* NEEDS ATTENTION */}
          {activeTab === "attention" && (
            <div className="space-y-8">
              <div>
                <h1 className="font-display text-3xl text-ink">Needs attention</h1>
                <p className="mt-1.5 text-sm text-muted">Open reviews, new sign-ups, and accounts that need a look.</p>
              </div>

              <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                <StatCard
                  label="Awaiting review"
                  value={pendingCount}
                  valueClassName={pendingCount > 0 ? "text-danger" : ""}
                  hint={pendingCount > 0 ? "Flagged or appealed" : "Queue is clear"}
                />
                <StatCard
                  label="Total users"
                  value={usersList.length || stats?.totalUsers || 0}
                  hint={`${newUsersThisWeek} joined in the last 7 days`}
                />
                <StatCard label="Banned accounts" value={bannedCount} hint="Blocked from chatting" />
                <StatCard label="Chats" value={stats?.totalChats || 0} hint="Across all accounts" />
              </div>

              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <section className={`${cardClass} p-5`}>
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <h2 className="text-sm font-medium text-ink">Waiting for review</h2>
                    <button type="button" onClick={() => setActiveTab("moderation")} className={secondaryButtonClass}>
                      Open moderation
                    </button>
                  </div>
                  {pendingItems.length === 0 ? (
                    <p className="py-6 text-center text-sm text-muted">Nothing is waiting for review.</p>
                  ) : (
                    <ul className="divide-y divide-line">
                      {pendingItems.map((item) => (
                        <li key={item.id} className="flex items-center justify-between gap-3 py-3 text-sm">
                          <div className="min-w-0">
                            <div className="truncate text-ink">{item.userEmail}</div>
                            <div className="mt-0.5 truncate text-xs text-muted">
                              {item.category} · {new Date(item.createdAt).toLocaleString()}
                            </div>
                          </div>
                          <Badge tone={item.status === "APPEALED" ? "info" : "warning"}>
                            {item.status === "APPEALED" ? "Appealed" : "Flagged"}
                          </Badge>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>

                <section className={`${cardClass} p-5`}>
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <h2 className="text-sm font-medium text-ink">Recent sign-ups</h2>
                    <button type="button" onClick={() => setActiveTab("users")} className={secondaryButtonClass}>
                      View users
                    </button>
                  </div>
                  {recentUsers.length === 0 ? (
                    <p className="py-6 text-center text-sm text-muted">No accounts yet.</p>
                  ) : (
                    <ul className="divide-y divide-line">
                      {recentUsers.map((u) => (
                        <li key={u.id} className="flex items-center justify-between gap-3 py-3 text-sm">
                          <div className="min-w-0">
                            <div className="truncate text-ink">{u.name || u.email}</div>
                            <div className="mt-0.5 truncate text-xs text-muted">
                              {u.email} · joined {new Date(u.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                          {u.isBanned ? (
                            <Badge tone="danger">Banned</Badge>
                          ) : u.isAdmin ? (
                            <Badge tone="info">Admin</Badge>
                          ) : null}
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              </div>
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
                  {(config.broadcastBanner ?? "").trim() && (
                    <div className="flex items-center gap-2.5 rounded-xl border border-accent/30 bg-accent-soft px-3.5 py-2.5 text-sm text-ink">
                      <Sparkles className="h-4 w-4 shrink-0 text-accent" />
                      <span className="font-medium">Preview:</span>
                      <span className="min-w-0 break-words">{config.broadcastBanner}</span>
                    </div>
                  )}
                </div>

                {/* Emergency Model & Effort Overrides */}
                <div className="space-y-4 p-5 bg-accent/5">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-accent" />
                    <span className="text-sm font-semibold text-ink">
                      Outage & High Traffic Overrides (Forced Model & Effort)
                    </span>
                  </div>
                  <p className="text-xs text-muted leading-relaxed">
                    Lock the entire system to a single model or effort level during upstream provider outages or TPM spikes.
                    When a model is forced, any attempts to use other models will display:
                    <span className="font-mono text-ink block mt-1 p-2 rounded bg-app border border-line">
                      &quot;We are experiencing issues reaching this model. Please switch to [allowed model name].&quot;
                    </span>
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                    {/* Forced Model Dropdown */}
                    <div className="space-y-1.5">
                      <label htmlFor="forced-model" className="block text-xs font-semibold text-ink">
                        Forced Model Restriction
                      </label>
                      <select
                        id="forced-model"
                        value={config.forcedModel || ""}
                        onChange={(e) =>
                          setConfig({ ...config, forcedModel: (e.target.value as any) || null })
                        }
                        className={`rounded-xl border border-line bg-card px-3.5 py-2 text-sm text-ink w-full ${focusRing}`}
                      >
                        <option value="">None (All 4 models active)</option>
                        <option value="roleflow-flash-2">RoleFlow Flash 2.0 (Fast, lightweight)</option>
                        <option value="roleflow-genesis-1">RoleFlow Genesis 1.5 (Balanced)</option>
                        <option value="roleflow-omni-1">RoleFlow Omni 1.0 (Frontier reasoning)</option>
                        <option value="roleflow-apex-1">RoleFlow Apex 1.0 (Highest intelligence)</option>
                      </select>
                      {config.forcedModel && (
                        <p className="text-[11px] text-accent font-medium">
                          Active: Other models blocked with switch notice.
                        </p>
                      )}
                    </div>

                    {/* Forced Effort Dropdown */}
                    <div className="space-y-1.5">
                      <label htmlFor="forced-effort" className="block text-xs font-semibold text-ink">
                        Forced Effort Restriction
                      </label>
                      <select
                        id="forced-effort"
                        value={config.forcedEffort || ""}
                        onChange={(e) =>
                          setConfig({ ...config, forcedEffort: (e.target.value as any) || null })
                        }
                        className={`rounded-xl border border-line bg-card px-3.5 py-2 text-sm text-ink w-full ${focusRing}`}
                      >
                        <option value="">None (Users choose freely)</option>
                        <option value="low">Low (Fastest, lowest tokens - Prevents 413 TPM limits)</option>
                        <option value="medium">Medium (Standard)</option>
                        <option value="high">High (Deep reasoning)</option>
                        <option value="extra">Extra</option>
                        <option value="max">Max</option>
                      </select>
                      {config.forcedEffort && (
                        <p className="text-[11px] text-accent font-medium">
                          Active: Only {config.forcedEffort.toUpperCase()} effort allowed.
                        </p>
                      )}
                    </div>
                  </div>
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
                                    onClick={() => {
                                      setSelectedUserForChats(u.email);
                                      setActiveTab("chats");
                                    }}
                                    className={`rounded-lg border border-line p-1.5 text-muted transition-colors hover:bg-hover hover:text-ink disabled:opacity-50 ${focusRing}`}
                                    title="Inspect user chats (Support)"
                                    aria-label="Inspect user chats"
                                  >
                                    <MessageSquare className="h-3.5 w-3.5" />
                                  </button>

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

          {/* USER CHATS (SUPPORT & BUG INSPECTOR) */}
          {activeTab === "chats" && <AdminChatsPanel initialUserFilter={selectedUserForChats} />}

          {/* BLOG POSTS */}
          {activeTab === "blog" && <AdminBlogPanel />}

          {/* EMAILS */}
          {activeTab === "emails" && <AdminEmailsPanel />}
          {activeTab === "licenses" && <AdminLicenseKeysPanel />}
          {activeTab === "law" && <AdminLawRequestsPanel />}
          {activeTab === "punishments" && (
            <AdminPunishmentsPanel
              users={usersList}
              logs={moderationLogs}
              onChanged={async () => {
                await fetchUsers();
                await fetchModerationLogs();
              }}
              onOpenIncidents={(email) => {
                setModUserFilter(email);
                setActiveTab("moderation");
              }}
            />
          )}
          {activeTab === "handbook" && <AdminHandbookPanel />}
          {activeTab === "incidents" && <AdminIncidentsPanel />}

          {/* MODERATION */}
          {referralLog && (
            <ReferralModal
              log={referralLog}
              onClose={() => setReferralLog(null)}
              onSent={(id) => setReferredIds((s) => new Set(s).add(id))}
            />
          )}
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
                    <option value="ESCALATED">Escalated</option>
                    <option value="RESOLVED">Resolved</option>
                  </select>

                  <input
                    type="search"
                    value={modSearch}
                    onChange={(e) => setModSearch(e.target.value)}
                    placeholder="Search email, prompt, or ID"
                    aria-label="Search incidents"
                    className={`min-w-[220px] rounded-xl border border-line bg-card px-3 py-2 text-sm text-ink placeholder:text-muted/70 ${focusRing}`}
                  />
                  <label htmlFor="mod-category" className="sr-only">Category</label>
                  <select
                    id="mod-category"
                    value={modCategoryFilter}
                    onChange={(e) => setModCategoryFilter(e.target.value)}
                    className={`rounded-xl border border-line bg-card px-3 py-2 text-sm text-ink ${focusRing}`}
                  >
                    <option value="all">All categories</option>
                    {categories.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
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

              {modUserFilter && (() => {
                const account = usersList.find((x) => x.email === modUserFilter);
                const accountIncidents = moderationLogs.filter((l) => l.userEmail === modUserFilter);
                const suspendedNow = Boolean(account?.isBanned && account?.suspendedUntil && Date.parse(account.suspendedUntil) > Date.now());
                const loadingFor = (a: string) => userActionLoading === `${a}-${account?.id}`;
                return (
                  <section className={`${cardClass} space-y-4 p-5`}>
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h2 className="text-sm font-medium text-ink">Account history</h2>
                        <p className="mt-0.5 truncate font-mono text-xs text-muted">{modUserFilter}</p>
                      </div>
                      <button type="button" onClick={() => setModUserFilter("")} className={secondaryButtonClass}>
                        Close
                      </button>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      {!account ? (
                        <Badge tone="neutral">Account not found</Badge>
                      ) : account.isBanned ? (
                        suspendedNow ? (
                          <Badge tone="warning">Suspended until {new Date(account.suspendedUntil as string).toLocaleString()}</Badge>
                        ) : (
                          <Badge tone="danger">Banned</Badge>
                        )
                      ) : (
                        <Badge tone="success">Active</Badge>
                      )}
                      <Badge tone="neutral">{account?.strikes ?? 0} strikes</Badge>
                      <Badge tone="neutral">{accountIncidents.length} incidents</Badge>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <button type="button" disabled={!account || loadingFor("warnUser")} onClick={() => account && handleUserAction("warnUser", account)} className={secondaryButtonClass}>
                        <AlertTriangle className="h-3.5 w-3.5" />
                        <span>Warn</span>
                      </button>
                      <button type="button" disabled={!account || loadingFor("suspendUser")} onClick={() => account && confirm(`Suspend ${account.email} for 7 days?`) && handleUserAction("suspendUser", account, { days: 7 })} className={secondaryButtonClass}>
                        <Clock className="h-3.5 w-3.5" />
                        <span>Suspend 7 days</span>
                      </button>
                      <button type="button" disabled={!account || loadingFor("suspendUser")} onClick={() => account && confirm(`Suspend ${account.email} for 30 days?`) && handleUserAction("suspendUser", account, { days: 30 })} className={secondaryButtonClass}>
                        <Clock className="h-3.5 w-3.5" />
                        <span>Suspend 30 days</span>
                      </button>
                      {account?.isBanned ? (
                        <button type="button" disabled={loadingFor("unbanUser")} onClick={() => account && handleUserAction("unbanUser", account)} className={secondaryButtonClass}>
                          <CheckCircle className="h-3.5 w-3.5" />
                          <span>Lift ban or suspension</span>
                        </button>
                      ) : (
                        <button type="button" disabled={!account || loadingFor("banUser")} onClick={() => account && confirm(`Permanently ban ${account.email}?`) && handleUserAction("banUser", account)} className={dangerButtonClass}>
                          <Ban className="h-3.5 w-3.5" />
                          <span>Ban</span>
                        </button>
                      )}
                    </div>

                    {accountIncidents.length > 0 && (
                      <ul className="divide-y divide-line rounded-xl border border-line">
                        {accountIncidents.map((l) => (
                          <li key={l.id} className="flex flex-wrap items-center justify-between gap-2 px-3.5 py-2.5 text-xs">
                            <span className="font-mono text-ink">{l.category}</span>
                            <span className="tabular-nums text-muted">{new Date(l.createdAt).toLocaleString()}</span>
                            <span className="font-mono text-muted">{l.status}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </section>
                );
              })()}

              {selectedLogIds.size > 0 && (
                <div className="sticky top-3 z-20 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-card p-3 shadow-menu">
                  <span className="text-sm font-medium text-ink">{selectedLogIds.size} selected</span>
                  <div className="flex flex-wrap gap-2">
                    <button type="button" disabled={bulkBusy} onClick={() => handleBulkAction("UNBAN_DISMISS")} className={secondaryButtonClass}>
                      Dismiss and lift ban
                    </button>
                    <button type="button" disabled={bulkBusy} onClick={() => handleBulkAction("WARN")} className={secondaryButtonClass}>
                      Warn
                    </button>
                    <button type="button" disabled={bulkBusy} onClick={() => handleBulkAction("ESCALATE")} className={secondaryButtonClass}>
                      Escalate
                    </button>
                    <button type="button" disabled={bulkBusy} onClick={() => handleBulkAction("REOPEN")} className={secondaryButtonClass}>
                      Reopen
                    </button>
                    <button type="button" disabled={bulkBusy} onClick={() => confirm(`Suspend ${selectedLogIds.size} accounts for 7 days?`) && handleBulkAction("SUSPEND", { days: 7 })} className={dangerButtonClass}>
                      Suspend 7 days
                    </button>
                    <button type="button" disabled={bulkBusy} onClick={() => setSelectedLogIds(new Set())} className={secondaryButtonClass}>
                      Clear
                    </button>
                  </div>
                </div>
              )}

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
                            <input
                              type="checkbox"
                              checked={selectedLogIds.has(log.id)}
                              onChange={(e) => toggleSelected(log.id, e.target.checked)}
                              className="h-4 w-4 accent-accent"
                              aria-label={`Select incident ${log.id}`}
                            />
                            <Badge tone={isTier1 ? "danger" : "warning"}>
                              Tier {log.tier}
                            </Badge>
                            <span className="font-mono text-xs text-ink">{log.category}</span>
                            <span className="font-mono text-[11px] text-muted">{log.id}</span>
                          </div>
                          <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
                            <span className="tabular-nums">{new Date(log.createdAt).toLocaleString()}</span>
                            <span className="font-mono">IP {log.ipAddress || "127.0.0.1"}</span>
                            {isTier1 && (referredIds.has(log.id) ? (
                              <span className="rounded-full border border-line bg-app px-2 py-0.5 text-[11px] font-medium text-muted">Referred</span>
                            ) : (
                              <button type="button" onClick={() => setReferralLog(log)} className={dangerButtonClass}>
                                Refer to authorities
                              </button>
                            ))}
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

                        {/* Staff notes and audit trail */}
                        {(log.adminNotes?.length ?? 0) > 0 && (
                          <ul className="space-y-1.5 rounded-xl border border-line bg-app p-3.5 text-xs">
                            {(log.adminNotes ?? []).map((n) => (
                              <li key={n.id} className="flex flex-wrap gap-x-2 gap-y-0.5">
                                <span className="tabular-nums text-muted">{new Date(n.createdAt).toLocaleString()}</span>
                                <span className="font-mono text-muted">{n.authorEmail}</span>
                                <span className={n.kind === "action" ? "italic text-muted" : "text-ink"}>{n.text}</span>
                              </li>
                            ))}
                          </ul>
                        )}
                        <div className="flex gap-2">
                          <input
                            value={noteDrafts[log.id] || ""}
                            onChange={(e) => setNoteDrafts((d) => ({ ...d, [log.id]: e.target.value }))}
                            placeholder="Add an internal note (staff only)"
                            maxLength={2000}
                            aria-label="Internal note"
                            className={inputClass}
                          />
                          <button
                            type="button"
                            onClick={() => handleSaveNote(log.id)}
                            disabled={!(noteDrafts[log.id] || "").trim() || modActionLoading === `NOTE-${log.id}`}
                            className={secondaryButtonClass}
                          >
                            Add note
                          </button>
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

                            <button
                              type="button"
                              onClick={() => setModUserFilter(log.userEmail)}
                              className={secondaryButtonClass}
                              title="Show every incident and the account status for this user"
                            >
                              <Users className="h-3.5 w-3.5" />
                              <span>Account history</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleModerationAction(log.id, "WARN")}
                              disabled={modActionLoading === `WARN-${log.id}`}
                              className={secondaryButtonClass}
                            >
                              <AlertTriangle className="h-3.5 w-3.5" />
                              <span>Warn</span>
                            </button>

                            {log.status !== "BANNED" && (
                              <button
                                type="button"
                                onClick={() => confirm(`Suspend ${log.userEmail} for 7 days?`) && handleModerationAction(log.id, "SUSPEND", { days: 7 })}
                                disabled={modActionLoading === `SUSPEND-${log.id}`}
                                className={secondaryButtonClass}
                              >
                                <Clock className="h-3.5 w-3.5" />
                                <span>Suspend 7 days</span>
                              </button>
                            )}

                            {log.status === "ESCALATED" ? (
                              <button
                                type="button"
                                onClick={() => handleModerationAction(log.id, "REOPEN")}
                                disabled={modActionLoading === `REOPEN-${log.id}`}
                                className={secondaryButtonClass}
                              >
                                <span>Reopen</span>
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleModerationAction(log.id, "ESCALATE")}
                                disabled={modActionLoading === `ESCALATE-${log.id}`}
                                className={secondaryButtonClass}
                              >
                                <Shield className="h-3.5 w-3.5" />
                                <span>Escalate</span>
                              </button>
                            )}

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
