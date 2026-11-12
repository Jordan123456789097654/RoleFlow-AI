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
  XCircle,
  ArrowLeft,
  Ban,
  RotateCcw,
  Search,
  Check,
  Cpu,
  Zap,
  Lock,
  FileText,
  Clock,
  Sparkles,
  ExternalLink,
} from "lucide-react";
import { UserProfile, SystemConfig, ModerationLogEntry, IncidentContext, IncidentTurn } from "@/types";

/** Shows the conversation captured when an incident was flagged, including attachments and images. */
function ConversationContext({ raw }: { raw?: string }) {
  if (!raw) {
    return (
      <div className="mt-2 text-xs text-[#858480]">
        No conversation captured for this incident (recorded before context capture was enabled).
      </div>
    );
  }
  let turns: IncidentTurn[] = [];
  try {
    turns = (JSON.parse(raw) as IncidentContext).turns;
  } catch {
    return <div className="mt-2 text-xs text-red-300">Captured conversation could not be parsed.</div>;
  }
  return (
    <details className="mt-2">
      <summary className="text-xs text-[#858480] cursor-pointer select-none">
        Conversation at time of flag ({turns.length} turns)
      </summary>
      <div className="mt-2 space-y-2 max-h-96 overflow-y-auto">
        {turns.map((t, i) => (
          <div key={i} className="bg-[#121211] border border-[#272624] rounded-lg p-2.5 text-xs">
            <div className="text-[#858480] mb-1 uppercase tracking-wide">{t.role}</div>
            {t.content && (
              <div className="text-[#f4f4f0] whitespace-pre-wrap break-words">{t.content}</div>
            )}
            {(t.attachments || []).map((a, j) => (
              <div key={j} className="mt-2">
                <div className="text-[#858480]">
                  [{a.imageDataUrl !== undefined ? "image" : "file"}] {a.name} ({a.type})
                </div>
                {a.imageDataUrl && (
                  <img
                    src={a.imageDataUrl}
                    alt={a.name}
                    className="mt-1 max-h-64 rounded border border-[#272624]"
                  />
                )}
                {a.imageDataUrl === null && (
                  <div className="mt-1 text-[#858480]">Image bytes not retained for this turn.</div>
                )}
                {a.text && (
                  <pre className="mt-1 text-[#f4f4f0] whitespace-pre-wrap break-words max-h-40 overflow-y-auto">
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
  const [activeTab, setActiveTab] = useState<"telemetry" | "config" | "users" | "moderation">("telemetry");
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
      <div className="min-h-screen bg-[#141413] text-[#f4f4f0] flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-md bg-[#1b1a19] border border-[#2d2c2a] rounded-2xl p-8 text-center shadow-2xl">
          <div className="w-14 h-14 mx-auto rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mb-5 text-rose-400">
            <Lock className="w-7 h-7" />
          </div>
          <h1 className="text-xl font-semibold text-[#f4f4f0] mb-2 font-roleflow-serif">
            Administrative Access Restricted
          </h1>
          <p className="text-sm text-[#9b9a97] mb-6 leading-relaxed">
            The RoleFlow Cluster Console requires verified system administrator privileges.
          </p>
          <div className="flex flex-col gap-3">
            <Link
              href="/chat"
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#d97706] hover:bg-[#b45309] text-white text-xs font-semibold transition-colors shadow"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Return to RoleFlow Chat</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#141413] text-[#f4f4f0] flex flex-col">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#222120] border border-amber-500/40 text-amber-200 px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 animate-message text-xs font-medium">
          <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Admin Top Header */}
      <header className="h-16 px-6 border-b border-[#242321] bg-[#141413]/95 backdrop-blur sticky top-0 z-30 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/chat"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-[#9b9a97] hover:text-[#f4f4f0] hover:bg-[#22211f] border border-[#2d2c2a] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Chat</span>
          </Link>

          <div className="h-5 w-px bg-[#2d2c2a]" />

          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-md bg-[#d97706] flex items-center justify-center text-black font-bold text-xs">
              RF
            </div>
            <div>
              <div className="text-sm font-semibold text-[#f4f4f0] tracking-tight flex items-center gap-2">
                <span>RoleFlow Admin Console</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1 font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  CLUSTER ONLINE
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleEmergencyReset}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-amber-400 hover:text-amber-300 hover:bg-amber-500/10 border border-amber-500/30 transition-colors"
            title="Reset daily usage counters for all accounts"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset All Quotas</span>
          </button>

          <button
            type="button"
            onClick={fetchAllAdminData}
            disabled={loading}
            className="p-2 rounded-lg text-[#9b9a97] hover:text-[#f4f4f0] hover:bg-[#22211f] border border-[#2d2c2a] transition-colors"
            title="Refresh telemetry"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          </button>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#1b1a19] border border-[#2d2c2a] text-xs font-mono text-[#d97706]">
            <Shield className="w-3.5 h-3.5" />
            <span>{user?.email || "System Administrator"}</span>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-6 flex flex-col gap-6">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-[#242321] pb-3 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab("telemetry")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium transition-all ${
              activeTab === "telemetry"
                ? "bg-[#252422] text-[#d97706] border border-[#383734] shadow-sm"
                : "text-[#9b9a97] hover:text-[#f4f4f0] hover:bg-[#1a1918]"
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>Cluster Telemetry</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("config")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium transition-all ${
              activeTab === "config"
                ? "bg-[#252422] text-[#d97706] border border-[#383734] shadow-sm"
                : "text-[#9b9a97] hover:text-[#f4f4f0] hover:bg-[#1a1918]"
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>System Configurations</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("users")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium transition-all ${
              activeTab === "users"
                ? "bg-[#252422] text-[#d97706] border border-[#383734] shadow-sm"
                : "text-[#9b9a97] hover:text-[#f4f4f0] hover:bg-[#1a1918]"
            }`}
          >
            <Users className="w-4 h-4" />
            <span>User Management ({usersList.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("moderation")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium transition-all ${
              activeTab === "moderation"
                ? "bg-[#252422] text-[#d97706] border border-[#383734] shadow-sm"
                : "text-[#9b9a97] hover:text-[#f4f4f0] hover:bg-[#1a1918]"
            }`}
          >
            <AlertTriangle className="w-4 h-4" />
            <span>Moderation & Legal Queue ({moderationLogs.length})</span>
          </button>
        </div>

        {/* TAB 1: SYSTEM TELEMETRY & CLUSTER HEALTH */}
        {activeTab === "telemetry" && (
          <div className="space-y-6">
            {/* Model Nodes Status Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Genesis 1.0 */}
              <div className="bg-[#1b1a19] border border-[#2d2c2a] rounded-2xl p-5 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl pointer-events-none" />
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Cpu className="w-4 h-4 text-amber-500" />
                    <span className="text-sm font-semibold text-[#f4f4f0]">RoleFlow Genesis 1.0</span>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold">
                    ONLINE
                  </span>
                </div>
                <p className="text-xs text-[#9b9a97] mb-4">
                  Flagship 120B reasoning model for software engineering, architecture, and multi-step logic.
                </p>
                <div className="grid grid-cols-2 gap-3 pt-3 border-t border-[#252422] text-xs">
                  <div>
                    <span className="text-[#858480] text-[11px] block">Avg Latency</span>
                    <span className="font-mono text-[#f4f4f0] font-medium">~840 ms</span>
                  </div>
                  <div>
                    <span className="text-[#858480] text-[11px] block">Context Window</span>
                    <span className="font-mono text-[#f4f4f0] font-medium">128k tokens</span>
                  </div>
                </div>
              </div>

              {/* Flash 1.0 */}
              <div className="bg-[#1b1a19] border border-[#2d2c2a] rounded-2xl p-5 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-sky-500/5 rounded-full blur-2xl pointer-events-none" />
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-sky-400" />
                    <span className="text-sm font-semibold text-[#f4f4f0]">RoleFlow Flash 1.0</span>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold">
                    ONLINE
                  </span>
                </div>
                <p className="text-xs text-[#9b9a97] mb-4">
                  Ultra-fast 27B model for instantaneous streaming code iterations and quick queries.
                </p>
                <div className="grid grid-cols-2 gap-3 pt-3 border-t border-[#252422] text-xs">
                  <div>
                    <span className="text-[#858480] text-[11px] block">Avg Latency</span>
                    <span className="font-mono text-[#f4f4f0] font-medium">~185 ms</span>
                  </div>
                  <div>
                    <span className="text-[#858480] text-[11px] block">Context Window</span>
                    <span className="font-mono text-[#f4f4f0] font-medium">128k tokens</span>
                  </div>
                </div>
              </div>

              {/* Inference Pool */}
              <div className="bg-[#1b1a19] border border-[#2d2c2a] rounded-2xl p-5 shadow-sm relative overflow-hidden">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Server className="w-4 h-4 text-emerald-400" />
                    <span className="text-sm font-semibold text-[#f4f4f0]">Groq Inference Pool</span>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold">
                    {stats?.modelKeys.active || 0} KEYS ACTIVE
                  </span>
                </div>
                <p className="text-xs text-[#9b9a97] mb-4">
                  Multi-key load balancing pool with automatic zero-downtime failover and rate limit bypass.
                </p>
                <div className="grid grid-cols-2 gap-3 pt-3 border-t border-[#252422] text-xs">
                  <div>
                    <span className="text-[#858480] text-[11px] block">Pool Health</span>
                    <span className="font-mono text-emerald-400 font-medium">Operational</span>
                  </div>
                  <div>
                    <span className="text-[#858480] text-[11px] block">Failover Mechanism</span>
                    <span className="font-mono text-[#f4f4f0] font-medium">Round-robin</span>
                  </div>
                </div>
              </div>
            </div>

            {/* KPI Stat Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-[#1b1a19] border border-[#2d2c2a] rounded-2xl p-5">
                <div className="text-[#858480] text-xs font-medium mb-1">Total Registered Users</div>
                <div className="text-2xl font-bold text-[#f4f4f0] font-mono">
                  {usersList.length || stats?.totalUsers || 0}
                </div>
                <div className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" />
                  <span>Authenticated via Email</span>
                </div>
              </div>

              <div className="bg-[#1b1a19] border border-[#2d2c2a] rounded-2xl p-5">
                <div className="text-[#858480] text-xs font-medium mb-1">Total Chats / Sessions</div>
                <div className="text-2xl font-bold text-[#f4f4f0] font-mono">
                  {stats?.totalChats || 0}
                </div>
                <div className="text-[11px] text-[#858480] mt-1">
                  Active isolated sessions
                </div>
              </div>

              <div className="bg-[#1b1a19] border border-[#2d2c2a] rounded-2xl p-5">
                <div className="text-[#858480] text-xs font-medium mb-1">Moderation Incidents</div>
                <div className="text-2xl font-bold text-rose-400 font-mono">
                  {moderationLogs.length}
                </div>
                <div className="text-[11px] text-rose-400/80 mt-1">
                  {moderationLogs.filter((l) => l.tier === 1).length} Tier 1 hard blocks
                </div>
              </div>

              <div className="bg-[#1b1a19] border border-[#2d2c2a] rounded-2xl p-5">
                <div className="text-[#858480] text-xs font-medium mb-1">Cluster Memory Engine</div>
                <div className="text-2xl font-bold text-amber-400 font-mono">
                  Active
                </div>
                <div className="text-[11px] text-[#858480] mt-1">
                  Personalized long-term recall
                </div>
              </div>
            </div>

            {/* Inference Key Overview */}
            {stats?.modelKeys.keysMasked && stats.modelKeys.keysMasked.length > 0 && (
              <div className="bg-[#1b1a19] border border-[#2d2c2a] rounded-2xl p-5">
                <h3 className="text-xs font-semibold text-[#f4f4f0] uppercase tracking-wider mb-3">
                  Configured Groq Inference Keys ({stats.modelKeys.keysMasked.length})
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {stats.modelKeys.keysMasked.map((keyMask, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between px-3 py-2 rounded-lg bg-[#141413] border border-[#272624] text-xs font-mono text-[#9b9a97]"
                    >
                      <span className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-400" />
                        Key #{idx + 1}
                      </span>
                      <span className="text-[#f4f4f0]">{keyMask}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: SYSTEM CONFIGURATIONS */}
        {activeTab === "config" && (
          <div className="space-y-6 max-w-4xl">
            <div className="bg-[#1b1a19] border border-[#2d2c2a] rounded-2xl p-6 space-y-6">
              <div>
                <h2 className="text-base font-semibold text-[#f4f4f0] mb-1 font-claude-serif">
                  Global Rate Limits & Cluster Quotas
                </h2>
                <p className="text-xs text-[#9b9a97]">
                  Changes here take effect immediately across all guest sessions and registered user accounts.
                </p>
              </div>

              {/* Slider 1: Guest Limit */}
              <div className="space-y-2 pt-4 border-t border-[#252422]">
                <div className="flex items-center justify-between text-xs">
                  <label htmlFor="guest-limit" className="font-medium text-[#f4f4f0]">
                    Guest Complimentary Message Limit
                  </label>
                  <span className="font-mono text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 font-semibold">
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
                  className="w-full accent-amber-500 bg-[#252422] rounded-lg cursor-pointer h-2"
                />
                <p className="text-[11px] text-[#858480]">
                  Default: 5 messages. Number of complimentary questions allowed for unregistered guest visitors.
                </p>
              </div>

              {/* Slider 2: Registered Daily Limit */}
              <div className="space-y-2 pt-4 border-t border-[#252422]">
                <div className="flex items-center justify-between text-xs">
                  <label htmlFor="daily-quota" className="font-medium text-[#f4f4f0]">
                    Registered User Daily Quota
                  </label>
                  <span className="font-mono text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 font-semibold">
                    {config.registeredDailyLimit} messages / day
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
                  className="w-full accent-amber-500 bg-[#252422] rounded-lg cursor-pointer h-2"
                />
                <p className="text-[11px] text-[#858480]">
                  Default: 25 messages/day. Daily quota per registered free-tier user. Resets at midnight UTC.
                </p>
              </div>

              {/* Toggles */}
              <div className="space-y-4 pt-4 border-t border-[#252422]">
                {/* Maintenance Mode */}
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs font-medium text-[#f4f4f0] flex items-center gap-2">
                      <span>Cluster Maintenance Mode</span>
                      {config.maintenanceMode && (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
                          ACTIVE
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-[#858480]">
                      When enabled, non-admin chat queries receive a maintenance notice.
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setConfig({ ...config, maintenanceMode: !config.maintenanceMode })}
                    className={`w-12 h-6 rounded-full transition-colors p-1 flex items-center ${
                      config.maintenanceMode ? "bg-rose-500 justify-end" : "bg-[#2d2c2a] justify-start"
                    }`}
                  >
                    <div className="w-4 h-4 rounded-full bg-white shadow-md" />
                  </button>
                </div>

                {/* Allow High Effort */}
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs font-medium text-[#f4f4f0]">
                      Allow High Effort Reasoning
                    </div>
                    <div className="text-[11px] text-[#858480]">
                      Permits users to select Extra and Max reasoning effort depths.
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setConfig({ ...config, allowHighEffort: !config.allowHighEffort })}
                    className={`w-12 h-6 rounded-full transition-colors p-1 flex items-center ${
                      config.allowHighEffort ? "bg-amber-500 justify-end" : "bg-[#2d2c2a] justify-start"
                    }`}
                  >
                    <div className="w-4 h-4 rounded-full bg-white shadow-md" />
                  </button>
                </div>
              </div>

              {/* Broadcast Banner */}
              <div className="space-y-2 pt-4 border-t border-[#252422]">
                <label htmlFor="broadcast-banner" className="block text-xs font-medium text-[#f4f4f0]">
                  Global Broadcast Announcement Banner
                </label>
                <input
                  id="broadcast-banner"
                  type="text"
                  placeholder="e.g. Scheduled cluster maintenance at 03:00 UTC. RoleFlow Genesis 1.0 upgrade live."
                  value={config.broadcastBanner}
                  onChange={(e) => setConfig({ ...config, broadcastBanner: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#141413] border border-[#2d2c2a] text-xs text-[#f4f4f0] placeholder-[#6d6c68] focus:outline-none focus:border-[#d97706]"
                />
                {config.broadcastBanner.trim() && (
                  <div className="mt-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                    <span className="font-medium">Preview:</span>
                    <span>{config.broadcastBanner}</span>
                  </div>
                )}
              </div>

              {/* Save Button */}
              <div className="pt-4 flex items-center justify-end gap-3 border-t border-[#252422]">
                {configSuccess && (
                  <span className="text-xs text-emerald-400 flex items-center gap-1 font-medium">
                    <Check className="w-4 h-4" />
                    Saved!
                  </span>
                )}
                <button
                  type="button"
                  onClick={handleSaveConfig}
                  disabled={configSaving}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#d97706] hover:bg-[#b45309] text-white text-xs font-semibold transition-all shadow-md disabled:opacity-50"
                >
                  {configSaving ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving Configurations...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Save System Configurations</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: USER MANAGEMENT */}
        {activeTab === "users" && (
          <div className="space-y-4">
            {/* Controls Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="relative w-full sm:w-80">
                <Search className="w-3.5 h-3.5 text-[#858480] absolute left-3.5 top-3" />
                <input
                  type="text"
                  placeholder="Search user by email, name, id..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-[#1b1a19] border border-[#2d2c2a] text-xs text-[#f4f4f0] placeholder-[#6d6c68] focus:outline-none focus:border-[#d97706]"
                />
              </div>

              <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto">
                {(["all", "admins", "banned", "active"] as const).map((filterKey) => (
                  <button
                    key={filterKey}
                    type="button"
                    onClick={() => setUserFilter(filterKey)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors uppercase tracking-wider text-[11px] ${
                      userFilter === filterKey
                        ? "bg-[#2d2c2a] text-[#d97706] border border-[#383734]"
                        : "text-[#858480] hover:text-[#f4f4f0] hover:bg-[#1b1a19]"
                    }`}
                  >
                    {filterKey}
                  </button>
                ))}
              </div>
            </div>

            {/* Users Table */}
            <div className="bg-[#1b1a19] border border-[#2d2c2a] rounded-2xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#141413] border-b border-[#242321] text-[#858480] uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="px-5 py-3.5 font-medium">User Profile</th>
                      <th className="px-4 py-3.5 font-medium">Role</th>
                      <th className="px-4 py-3.5 font-medium">Status</th>
                      <th className="px-4 py-3.5 font-medium">Daily Quota Used</th>
                      <th className="px-4 py-3.5 font-medium">Strikes</th>
                      <th className="px-5 py-3.5 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#242321]">
                    {filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-5 py-8 text-center text-[#858480]">
                          No registered users found matching filter.
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map((u) => {
                        const isAdminUser = Boolean(u.isAdmin);
                        const isSelf = u.id === user?.id || Boolean(user?.email && u.email.toLowerCase() === user.email.toLowerCase());
                        return (
                          <tr key={u.id} className="hover:bg-[#201f1e] transition-colors">
                            {/* User Profile */}
                            <td className="px-5 py-3.5">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-[#272624] border border-[#383734] flex items-center justify-center text-xs font-semibold text-[#d97706] shrink-0">
                                  {u.name ? u.name.charAt(0).toUpperCase() : u.email.charAt(0).toUpperCase()}
                                </div>
                                <div className="truncate max-w-[200px]">
                                  <div className="font-medium text-[#f4f4f0] truncate">{u.name || "Anonymous User"}</div>
                                  <div className="text-[11px] text-[#858480] truncate font-mono">{u.email}</div>
                                </div>
                              </div>
                            </td>

                            {/* Role */}
                            <td className="px-4 py-3.5">
                              {isAdminUser ? (
                                <span className="inline-flex items-center gap-1 text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/30">
                                  <Shield className="w-3 h-3" />
                                  ADMIN
                                </span>
                              ) : (
                                <span className="text-[10px] font-mono text-[#858480] px-2 py-0.5 rounded bg-[#242321]">
                                  USER
                                </span>
                              )}
                            </td>

                            {/* Status */}
                            <td className="px-4 py-3.5">
                              {u.isBanned ? (
                                <span className="inline-flex items-center gap-1 text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20">
                                  <Ban className="w-3 h-3" />
                                  SUSPENDED
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                  ACTIVE
                                </span>
                              )}
                            </td>

                            {/* Daily Quota */}
                            <td className="px-4 py-3.5">
                              <div className="font-mono text-xs text-[#f4f4f0]">
                                {isAdminUser ? (
                                  <span className="text-amber-400 font-semibold">Unlimited</span>
                                ) : (
                                  <span>
                                    {u.messageCount || 0} / {config.registeredDailyLimit}
                                  </span>
                                )}
                              </div>
                              <div className="text-[10px] text-[#858480]">
                                {u.lastResetDate ? `Reset: ${u.lastResetDate}` : "Never"}
                              </div>
                            </td>

                            {/* Strikes */}
                            <td className="px-4 py-3.5">
                              <span
                                className={`font-mono text-xs ${
                                  (u.strikes || 0) > 0 ? "text-rose-400 font-bold" : "text-[#858480]"
                                }`}
                              >
                                {u.strikes || 0}
                              </span>
                            </td>

                            {/* Actions */}
                            <td className="px-5 py-3.5 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                {/* Toggle Admin */}
                                {!isSelf && (
                                  <button
                                    type="button"
                                    onClick={() => handleUserAction("toggleAdmin", u)}
                                    disabled={userActionLoading === `toggleAdmin-${u.id}`}
                                    className={`p-1.5 rounded-lg border transition-colors ${
                                      u.isAdmin
                                        ? "text-amber-400 border-amber-500/30 hover:bg-amber-500/10"
                                        : "text-[#858480] border-[#2d2c2a] hover:text-[#f4f4f0] hover:bg-[#252422]"
                                    }`}
                                    title={u.isAdmin ? "Revoke Admin Rights" : "Grant Admin Rights"}
                                  >
                                    <Shield className="w-3.5 h-3.5" />
                                  </button>
                                )}

                                {/* Ban / Unban */}
                                {!isSelf && (
                                  <button
                                    type="button"
                                    onClick={() => handleUserAction(u.isBanned ? "unbanUser" : "banUser", u)}
                                    disabled={userActionLoading === `${u.isBanned ? "unbanUser" : "banUser"}-${u.id}`}
                                    className={`p-1.5 rounded-lg border transition-colors ${
                                      u.isBanned
                                        ? "text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10"
                                        : "text-rose-400 border-rose-500/30 hover:bg-rose-500/10"
                                    }`}
                                    title={u.isBanned ? "Lift Suspension" : "Ban / Suspend Account"}
                                  >
                                    <Ban className="w-3.5 h-3.5" />
                                  </button>
                                )}

                                {/* Reset Quota */}
                                <button
                                  type="button"
                                  onClick={() => handleUserAction("resetQuota", u)}
                                  disabled={userActionLoading === `resetQuota-${u.id}`}
                                  className="p-1.5 rounded-lg border border-[#2d2c2a] text-[#858480] hover:text-amber-400 hover:bg-[#252422] transition-colors"
                                  title="Reset Daily Quota to 0"
                                >
                                  <RotateCcw className="w-3.5 h-3.5" />
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

        {/* TAB 4: MODERATION & LEGAL QUEUE */}
        {activeTab === "moderation" && (
          <div className="space-y-4">
            {/* Filter Controls */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <span className="text-xs text-[#858480]">Status:</span>
                <select
                  value={modStatusFilter}
                  onChange={(e) => setModStatusFilter(e.target.value)}
                  className="px-3 py-1.5 rounded-xl bg-[#1b1a19] border border-[#2d2c2a] text-xs text-[#f4f4f0] focus:outline-none focus:border-[#d97706]"
                >
                  <option value="all">All Statuses</option>
                  <option value="FLAGGED">FLAGGED (Pending)</option>
                  <option value="BANNED">BANNED (Zero Tolerance)</option>
                  <option value="APPEALED">APPEALED</option>
                  <option value="RESOLVED">RESOLVED</option>
                </select>

                <span className="text-xs text-[#858480] ml-2">Tier:</span>
                <select
                  value={modTierFilter}
                  onChange={(e) => setModTierFilter(e.target.value)}
                  className="px-3 py-1.5 rounded-xl bg-[#1b1a19] border border-[#2d2c2a] text-xs text-[#f4f4f0] focus:outline-none focus:border-[#d97706]"
                >
                  <option value="all">All Tiers</option>
                  <option value="1">Tier 1: Zero-Tolerance Extremism/Violence</option>
                  <option value="2">Tier 2: Cyberattack & Exploitation</option>
                </select>
              </div>

              <div className="text-xs text-[#858480]">
                Showing {filteredLogs.length} of {moderationLogs.length} incident records
              </div>
            </div>

            {/* Moderation Incidents List */}
            {filteredLogs.length === 0 ? (
              <div className="bg-[#1b1a19] border border-[#2d2c2a] rounded-2xl p-12 text-center text-[#858480] text-xs">
                <CheckCircle className="w-8 h-8 text-emerald-400/50 mx-auto mb-2" />
                No moderation incidents matching current filter criteria.
              </div>
            ) : (
              <div className="space-y-3">
                {filteredLogs.map((log) => {
                  const isTier1 = log.tier === 1;
                  return (
                    <div
                      key={log.id}
                      className="bg-[#1b1a19] border border-[#2d2c2a] rounded-2xl p-5 shadow-sm space-y-3"
                    >
                      {/* Top incident meta */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#252422] pb-3">
                        <div className="flex items-center gap-2.5">
                          <span
                            className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                              isTier1
                                ? "bg-rose-500/10 text-rose-400 border-rose-500/30"
                                : "bg-amber-500/10 text-amber-400 border-amber-500/30"
                            }`}
                          >
                            TIER {log.tier}: {log.category}
                          </span>
                          <span className="text-xs font-mono text-[#858480]">{log.id}</span>
                        </div>

                        <div className="flex items-center gap-3 text-xs text-[#858480]">
                          <span className="font-mono">{new Date(log.createdAt).toLocaleString()}</span>
                          <span className="font-mono bg-[#141413] px-2 py-0.5 rounded border border-[#272624]">
                            IP: {log.ipAddress || "127.0.0.1"}
                          </span>
                          <span
                            className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded ${
                              log.status === "BANNED"
                                ? "bg-rose-500/20 text-rose-300"
                                : log.status === "RESOLVED"
                                ? "bg-emerald-500/20 text-emerald-300"
                                : "bg-amber-500/20 text-amber-300"
                            }`}
                          >
                            {log.status}
                          </span>
                        </div>
                      </div>

                      {/* User & Prompt */}
                      <div>
                        <div className="text-xs text-[#858480] mb-1">
                          Account: <span className="text-[#f4f4f0] font-mono">{log.userEmail}</span> ({log.userId})
                        </div>
                        <div className="bg-[#121211] border border-[#272624] rounded-xl p-3 text-xs text-[#f4f4f0] font-mono break-words whitespace-pre-wrap max-h-32 overflow-y-auto">
                          {log.prompt}
                        </div>
                        <ConversationContext raw={log.context} />
                        {log.appealNote && (
                          <div className="mt-2 text-xs text-amber-300 bg-amber-500/10 border border-amber-500/20 rounded-lg p-2.5">
                            <span className="font-semibold block mb-0.5">User Appeal Statement:</span>
                            {log.appealNote}
                          </div>
                        )}
                      </div>

                      {/* Action Bar */}
                      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                        {log.matchedKeywords && log.matchedKeywords.length > 0 && (
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[10px] text-[#858480]">Matched Rules:</span>
                            {log.matchedKeywords.map((kw, i) => (
                              <span
                                key={i}
                                className="text-[10px] font-mono bg-[#252422] text-[#9b9a97] px-1.5 py-0.5 rounded border border-[#333230]"
                              >
                                {kw}
                              </span>
                            ))}
                          </div>
                        )}

                        <div className="flex items-center gap-2 ml-auto">
                          {/* 1-Click DHS/IC3 Dossier Download */}
                          <a
                            href={`/api/moderation/dossier?logId=${log.id}`}
                            download={`RoleFlow-Incident-Dossier-${log.id}.txt`}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#252422] hover:bg-[#302f2d] text-[#f4f4f0] text-xs font-medium border border-[#383734] transition-colors"
                            title="Download Legal DHS/IC3 Incident Dossier"
                          >
                            <Download className="w-3.5 h-3.5 text-sky-400" />
                            <span>1-Click Dossier Download</span>
                          </a>

                          {/* Confirm Ban */}
                          {log.status !== "BANNED" && (
                            <button
                              type="button"
                              onClick={() => handleModerationAction(log.id, "CONFIRM_BAN")}
                              disabled={modActionLoading === `CONFIRM_BAN-${log.id}`}
                              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-medium border border-rose-500/30 transition-colors"
                            >
                              <Ban className="w-3.5 h-3.5" />
                              <span>Confirm Ban</span>
                            </button>
                          )}

                          {/* Dismiss / Resolve */}
                          {log.status !== "RESOLVED" && (
                            <button
                              type="button"
                              onClick={() => handleModerationAction(log.id, "UNBAN_DISMISS")}
                              disabled={modActionLoading === `UNBAN_DISMISS-${log.id}`}
                              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-xs font-medium border border-emerald-500/30 transition-colors"
                            >
                              <CheckCircle className="w-3.5 h-3.5" />
                              <span>Dismiss & Lift Ban</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
