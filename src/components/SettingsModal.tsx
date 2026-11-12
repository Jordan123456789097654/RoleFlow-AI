"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  X,
  Save,
  User,
  Brain,
  Shield,
  ShieldAlert,
  Database,
  Trash2,
  Download,
  Copy,
  Check,
  Clock,
  Sparkles,
  Sun,
  Moon,
  Laptop,
  RotateCw,
  Plus,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Mail,
  Globe,
  UserCheck,
  Ban,
  Settings as SettingsIcon,
} from "lucide-react";
import { UserProfile, ModerationLogEntry, UsageStats, MemoryItem } from "@/types";

const ADMIN_EMAIL = "jordanedanield13@gmail.com";

/** localStorage key for the theme choice. Values: "light" | "dark" | "system". */
const THEME_STORAGE_KEY = "roleflow_theme";

export type SettingsTab =
  | "general"
  | "account"
  | "memory"
  | "instructions"
  | "privacy"
  | "admin";

type ThemeChoice = "light" | "dark" | "system";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile;
  onUpdate: (updated: UserProfile) => void;
  defaultTab?: SettingsTab;
  usage?: UsageStats;
  onAllChatsDeleted?: () => void;
}

// ─────────────────────────────────────────────────────────────
// Shared styles
// ─────────────────────────────────────────────────────────────

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40";

const inputClass = `w-full bg-app text-sm text-ink placeholder:text-muted/70 px-3.5 py-2.5 rounded-xl border border-line focus:outline-none focus:border-accent/60 transition-colors ${focusRing}`;

const labelClass = "block text-sm font-medium text-ink mb-1.5";

const hintClass = "block text-xs text-muted mt-1.5";

const primaryButtonClass = `inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-accent hover:bg-accent-hover text-white text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${focusRing}`;

const secondaryButtonClass = `inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-card hover:bg-hover text-ink text-sm font-medium border border-line transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${focusRing}`;

const dangerButtonClass = `inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-danger-soft hover:bg-danger/20 text-danger text-sm font-medium border border-danger/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${focusRing}`;

const cardClass = "rounded-2xl border border-line bg-card";

const successTextClass =
  "text-sm font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5";

const notice = (text: string) => (
  <div className="flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3.5 py-2.5 text-sm text-emerald-700 dark:text-emerald-400">
    <Check className="w-4 h-4 shrink-0" />
    <span>{text}</span>
  </div>
);

/** Section heading used at the top of each settings pane. */
const SectionHeader: React.FC<{
  title: string;
  description: string;
  icon?: React.ReactNode;
}> = ({ title, description, icon }) => (
  <div className="space-y-1.5">
    <h3 className="flex items-center gap-2 font-display text-2xl text-ink">
      {icon}
      <span>{title}</span>
    </h3>
    <p className="text-sm text-muted leading-relaxed">{description}</p>
  </div>
);

/** Thin-divided row inside a settings pane. */
const SettingRow: React.FC<{
  title: string;
  description?: React.ReactNode;
  children?: React.ReactNode;
  danger?: boolean;
}> = ({ title, description, children, danger }) => (
  <div className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
    <div className="min-w-0">
      <div className={`text-sm font-medium ${danger ? "text-danger" : "text-ink"}`}>{title}</div>
      {description && <div className="mt-0.5 text-sm text-muted leading-relaxed">{description}</div>}
    </div>
    {children && <div className="shrink-0">{children}</div>}
  </div>
);

const NAV_ITEMS: { id: SettingsTab; label: string; icon: React.ReactNode; adminOnly?: boolean }[] = [
  { id: "general", label: "General", icon: <User className="w-4 h-4" /> },
  { id: "account", label: "Account & quota", icon: <Clock className="w-4 h-4" /> },
  { id: "memory", label: "Memory", icon: <Brain className="w-4 h-4" /> },
  { id: "instructions", label: "Custom instructions", icon: <Sparkles className="w-4 h-4" /> },
  { id: "privacy", label: "Data & privacy", icon: <Database className="w-4 h-4" /> },
  { id: "admin", label: "Admin queue", icon: <ShieldAlert className="w-4 h-4" />, adminOnly: true },
];

function readStoredTheme(): ThemeChoice {
  try {
    const value = localStorage.getItem(THEME_STORAGE_KEY);
    if (value === "light" || value === "dark" || value === "system") return value;
  } catch (e) {
    // Storage can be blocked (private mode). Fall back to the system setting.
  }
  return "system";
}

function applyTheme(choice: ThemeChoice) {
  const prefersDark =
    typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches;
  const dark = choice === "dark" || (choice === "system" && prefersDark);
  document.documentElement.classList.toggle("dark", dark);
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  user,
  onUpdate,
  defaultTab = "general",
  usage,
  onAllChatsDeleted,
}) => {
  const isAdmin = Boolean(
    user.isAdmin || user.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase()
  );

  const [activeTab, setActiveTab] = useState<SettingsTab>(defaultTab);

  // Tab 1: General (Name, Email, Theme)
  const [name, setName] = useState(user.name);
  const [theme, setTheme] = useState<ThemeChoice>(readStoredTheme);

  // Tab 2: Account & Quota
  const [copiedId, setCopiedId] = useState(false);
  const [countdown, setCountdown] = useState<string>("");

  // Tab 3: Memory System
  const [memories, setMemories] = useState<MemoryItem[]>([]);
  const [loadingMemories, setLoadingMemories] = useState(false);
  const [newMemoryText, setNewMemoryText] = useState("");
  const [isAddingMemory, setIsAddingMemory] = useState(false);
  const [clearingMemories, setClearingMemories] = useState(false);
  const [memoryFeedback, setMemoryFeedback] = useState<string | null>(null);

  // Tab 4: Custom Instructions (Two textareas)
  const [customInstructions, setCustomInstructions] = useState(
    user.customInstructions || ""
  );
  const [responseInstructions, setResponseInstructions] = useState(
    user.responseInstructions || ""
  );

  // Save states
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Tab 5: Data & Privacy
  const [isExporting, setIsExporting] = useState(false);
  const [isDeletingChats, setIsDeletingChats] = useState(false);
  const [deleteChatsSuccess, setDeleteChatsSuccess] = useState(false);

  // Tab 6: Admin Queue
  const [logs, setLogs] = useState<ModerationLogEntry[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [logFilter, setLogFilter] = useState<string>("ALL");
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
  const [actionProcessingId, setActionProcessingId] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  // Keep state updated when user prop changes
  useEffect(() => {
    setName(user.name);
    setCustomInstructions(user.customInstructions || "");
    setResponseInstructions(user.responseInstructions || "");
  }, [user]);

  // Quota Countdown Timer to midnight UTC
  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      const tomorrow = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1));
      const diffMs = tomorrow.getTime() - now.getTime();
      const hours = Math.floor(diffMs / (1000 * 60 * 60));
      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);
      setCountdown(`${hours}h ${minutes}m ${seconds}s`);
    };

    updateCountdown();
    const timer = setInterval(updateCountdown, 1000);
    return () => clearInterval(timer);
  }, []);

  // Follow the OS setting live while the "System" theme is selected
  useEffect(() => {
    if (theme !== "system" || typeof window === "undefined") return;
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => applyTheme("system");
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, [theme]);

  // Fetch memories when memory tab opened
  useEffect(() => {
    if (isOpen && activeTab === "memory") {
      fetchMemories();
    }
  }, [isOpen, activeTab]);

  // Fetch moderation logs if admin tab opened
  useEffect(() => {
    if (isOpen && isAdmin && activeTab === "admin") {
      fetchModerationLogs();
    }
  }, [isOpen, isAdmin, activeTab]);

  if (!isOpen) return null;

  const chooseTheme = (choice: ThemeChoice) => {
    setTheme(choice);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, choice);
    } catch (e) {
      // Ignore: the theme still applies for this session.
    }
    applyTheme(choice);
  };

  const handleCopyId = () => {
    navigator.clipboard.writeText(user.id);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handleSaveAllPreferences = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSaving(true);
    setSaveSuccess(false);
    try {
      const res = await fetch("/api/users/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: user.id,
          name: name.trim() || user.name,
          customInstructions: customInstructions.trim(),
          responseInstructions: responseInstructions.trim(),
        }),
      });
      const data = await res.json();
      if (data.user) {
        onUpdate(data.user);
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 2500);
      }
    } catch (err) {
      console.error("Save profile error:", err);
    } finally {
      setSaving(false);
    }
  };

  const fetchMemories = async () => {
    setLoadingMemories(true);
    setMemoryFeedback(null);
    try {
      const res = await fetch(`/api/memory?userId=${encodeURIComponent(user.id)}`);
      const data = await res.json();
      if (data.memories) {
        setMemories(data.memories);
      }
    } catch (err) {
      console.error("Failed to fetch memories:", err);
    } finally {
      setLoadingMemories(false);
    }
  };

  const handleAddMemory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemoryText.trim()) return;
    setIsAddingMemory(true);
    try {
      const res = await fetch("/api/memory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          userEmail: user.email,
          memory: newMemoryText.trim(),
        }),
      });
      const data = await res.json();
      if (data.success && data.memory) {
        setMemories((prev) => [data.memory, ...prev]);
        setNewMemoryText("");
        setMemoryFeedback("Memory saved successfully");
        setTimeout(() => setMemoryFeedback(null), 2500);
      }
    } catch (err) {
      console.error("Failed to add memory:", err);
    } finally {
      setIsAddingMemory(false);
    }
  };

  const handleDeleteMemory = async (memoryId: string) => {
    try {
      const res = await fetch(`/api/memory?id=${encodeURIComponent(memoryId)}&userId=${encodeURIComponent(user.id)}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setMemories((prev) => prev.filter((m) => m.id !== memoryId));
        setMemoryFeedback("Memory removed");
        setTimeout(() => setMemoryFeedback(null), 2000);
      }
    } catch (err) {
      console.error("Failed to delete memory:", err);
    }
  };

  const handleClearAllMemories = async () => {
    if (!confirm("Are you sure you want to permanently clear all learned memories?")) return;
    setClearingMemories(true);
    try {
      const res = await fetch(`/api/memory?clearAll=true&userId=${encodeURIComponent(user.id)}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setMemories([]);
        setMemoryFeedback("All memories cleared");
        setTimeout(() => setMemoryFeedback(null), 2500);
      }
    } catch (err) {
      console.error("Failed to clear memories:", err);
    } finally {
      setClearingMemories(false);
    }
  };

  const handleExportData = async () => {
    setIsExporting(true);
    try {
      const chatsRes = await fetch(`/api/chats?userId=${encodeURIComponent(user.id)}`);
      const chatsData = await chatsRes.json();
      const exportObject = {
        app: "RoleFlow",
        exportedAt: new Date().toISOString(),
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          plan: isAdmin ? "ADMIN_UNLIMITED" : "FREE_TIER",
          customInstructions,
          responseInstructions,
        },
        memories,
        chats: chatsData.chats || [],
      };

      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportObject, null, 2));
      const downloadAnchor = document.createElement("a");
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `roleflow-data-export-${new Date().toISOString().split("T")[0]}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    } catch (err) {
      console.error("Failed to export data:", err);
      alert("Failed to export data. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  const handleDeleteAllChats = async () => {
    if (!confirm("Are you sure you want to permanently delete all your chats? This action cannot be undone.")) return;
    setIsDeletingChats(true);
    try {
      const res = await fetch("/api/chats", { method: "DELETE" });
      if (res.ok) {
        setDeleteChatsSuccess(true);
        if (onAllChatsDeleted) onAllChatsDeleted();
        setTimeout(() => setDeleteChatsSuccess(false), 3000);
      }
    } catch (err) {
      console.error("Failed to delete chats:", err);
      alert("Failed to delete chats.");
    } finally {
      setIsDeletingChats(false);
    }
  };

  const fetchModerationLogs = async () => {
    setLoadingLogs(true);
    setActionMessage(null);
    try {
      const res = await fetch("/api/moderation/logs", {
        headers: {
          "x-user-id": user.id,
          "x-user-email": user.email,
        },
      });
      const data = await res.json();
      if (data.logs) {
        setLogs(data.logs);
      }
    } catch (err) {
      console.error("Failed to fetch moderation logs:", err);
    } finally {
      setLoadingLogs(false);
    }
  };

  const handleExportDossier = (logId: string) => {
    const url = `/api/moderation/dossier?logId=${encodeURIComponent(logId)}`;
    const link = document.createElement("a");
    link.href = url;
    link.download = `RoleFlow-Incident-Dossier-${logId}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleModerationAction = async (
    logId: string,
    action: "UNBAN_DISMISS" | "CONFIRM_BAN"
  ) => {
    setActionProcessingId(logId);
    setActionMessage(null);
    try {
      const res = await fetch("/api/moderation/logs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": user.id,
          "x-user-email": user.email,
        },
        body: JSON.stringify({ logId, action }),
      });
      const data = await res.json();
      if (res.ok) {
        setActionMessage(
          action === "UNBAN_DISMISS"
            ? `Incident ${logId} dismissed and user unbanned.`
            : `Incident ${logId} confirmed and account permanently banned.`
        );
        fetchModerationLogs();
      } else {
        alert(data.error || "Action failed");
      }
    } catch (err: any) {
      alert(err.message || "Failed to execute moderation action");
    } finally {
      setActionProcessingId(null);
    }
  };

  const filteredLogs = logs.filter((log) => {
    if (logFilter === "ALL") return true;
    return log.status === logFilter;
  });

  const pendingLogCount = logs.filter((l) => l.status === "FLAGGED" || l.status === "APPEALED").length;

  const dailyUsed = usage ? usage.used : (user.messageCount || 0);
  const usagePercentage = isAdmin ? 0 : Math.min(100, Math.round((dailyUsed / 25) * 100));

  const visibleNav = NAV_ITEMS.filter((item) => !item.adminOnly || isAdmin);

  const themeOptions: { id: ThemeChoice; label: string; hint: string; icon: React.ReactNode }[] = [
    { id: "light", label: "Light", hint: "Warm paper", icon: <Sun className="w-4 h-4" /> },
    { id: "dark", label: "Dark", hint: "Warm charcoal", icon: <Moon className="w-4 h-4" /> },
    { id: "system", label: "System", hint: "Match your device", icon: <Laptop className="w-4 h-4" /> },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-ink/30 backdrop-blur-[2px] animate-message"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Settings"
        className="relative flex w-full max-w-3xl h-[min(640px,90vh)] flex-col overflow-hidden rounded-2xl border border-line bg-card text-ink shadow-menu md:flex-row"
      >
        {/* Left navigation (becomes a horizontal tab row on small screens) */}
        <nav
          aria-label="Settings sections"
          className="flex shrink-0 gap-1 overflow-x-auto border-b border-line bg-panel p-2 md:w-52 md:flex-col md:overflow-y-auto md:border-b-0 md:border-r"
        >
          <div className="hidden items-center gap-2 px-2.5 pb-3 pt-2 md:flex">
            <SettingsIcon className="w-4 h-4 text-muted" />
            <span className="font-display text-base text-ink">Settings</span>
            {isAdmin && (
              <span className="ml-auto rounded-full border border-amber-500/30 bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-medium text-amber-700 dark:text-amber-300">
                Admin
              </span>
            )}
          </div>

          {visibleNav.map((item) => {
            const isActive = activeTab === item.id;
            const badge =
              item.id === "memory" && memories.length > 0
                ? memories.length
                : item.id === "admin" && pendingLogCount > 0
                ? pendingLogCount
                : null;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                aria-current={isActive ? "page" : undefined}
                className={`flex shrink-0 items-center gap-2.5 whitespace-nowrap rounded-lg px-2.5 py-2 text-sm transition-colors ${focusRing} ${
                  isActive
                    ? "bg-hover text-ink font-medium"
                    : "text-muted hover:bg-hover/60 hover:text-ink"
                }`}
              >
                <span className={isActive ? "text-accent" : ""}>{item.icon}</span>
                <span>{item.label}</span>
                {badge !== null && (
                  <span className="ml-auto rounded-full border border-line bg-app px-1.5 py-0.5 text-[10px] font-medium text-muted">
                    {badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Right pane */}
        <div className="relative flex min-w-0 flex-1 flex-col">
          <div className="flex items-center justify-end px-4 pt-3 sm:px-6">
            <button
              type="button"
              onClick={onClose}
              aria-label="Close settings"
              className={`rounded-lg p-1.5 text-muted transition-colors hover:bg-hover hover:text-ink ${focusRing}`}
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-5 pb-8 pt-1 sm:px-8">
            {/* TAB 1: GENERAL */}
            {activeTab === "general" && (
              <div className="space-y-8">
                <SectionHeader
                  title="General"
                  description="Manage your display name and how RoleFlow looks on this device."
                />

                <div className="space-y-5">
                  <div>
                    <label htmlFor="settings-name" className={labelClass}>
                      Display name
                    </label>
                    <input
                      id="settings-name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Jordan Daniels"
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label htmlFor="settings-email" className={labelClass}>
                      Email address
                    </label>
                    <input
                      id="settings-email"
                      type="email"
                      value={user.email}
                      disabled
                      className={`${inputClass} cursor-not-allowed text-muted`}
                    />
                    <span className={hintClass}>Verified account authentication email.</span>
                  </div>
                </div>

                <div>
                  <div className="mb-2.5 flex items-center gap-2 text-sm font-medium text-ink">
                    <Laptop className="w-4 h-4 text-muted" />
                    <span>Theme</span>
                  </div>
                  <div role="radiogroup" aria-label="Theme" className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
                    {themeOptions.map((option) => {
                      const selected = theme === option.id;
                      return (
                        <button
                          key={option.id}
                          type="button"
                          role="radio"
                          aria-checked={selected}
                          onClick={() => chooseTheme(option.id)}
                          className={`flex items-center gap-3 rounded-xl border p-3 text-left transition-colors ${focusRing} ${
                            selected
                              ? "border-accent bg-accent-soft text-ink"
                              : "border-line bg-app text-muted hover:border-muted/50 hover:text-ink"
                          }`}
                        >
                          <span className={selected ? "text-accent" : "text-muted"}>{option.icon}</span>
                          <span className="min-w-0">
                            <span className="block text-sm font-medium">{option.label}</span>
                            <span className="block text-xs text-muted">{option.hint}</span>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                  <span className={hintClass}>Saved on this device and applied immediately.</span>
                </div>

                <div className="flex items-center justify-between gap-4 border-t border-line pt-5">
                  <div className="min-h-[1.25rem]">
                    {saveSuccess && (
                      <span className={successTextClass}>
                        <Check className="w-4 h-4" />
                        Changes saved
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleSaveAllPreferences()}
                    disabled={saving}
                    className={primaryButtonClass}
                  >
                    <Save className="w-4 h-4" />
                    <span>{saving ? "Saving..." : "Save preferences"}</span>
                  </button>
                </div>
              </div>
            )}

            {/* TAB 2: ACCOUNT & QUOTA */}
            {activeTab === "account" && (
              <div className="space-y-8">
                <SectionHeader
                  title="Account & quota"
                  description="Track your daily message usage, plan status, and account identifier."
                />

                {/* Plan */}
                <div className={`${cardClass} space-y-5 p-5`}>
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-accent">
                      <Shield className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2 text-sm font-medium text-ink">
                        <span>{isAdmin ? "Admin enterprise plan" : "Free plan"}</span>
                        <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-700 dark:text-emerald-400">
                          Active
                        </span>
                      </div>
                      <div className="text-sm text-muted">
                        {isAdmin
                          ? "Unlimited model inference tokens and priority server routing."
                          : "25 daily messages with full access to Genesis and Flash."}
                      </div>
                    </div>
                  </div>

                  {/* Quota progress */}
                  <div className="space-y-2 border-t border-line pt-5">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted">Daily usage</span>
                      <span className="font-medium tabular-nums text-ink">
                        {isAdmin ? "Unlimited" : `${dailyUsed} / 25 messages`}
                      </span>
                    </div>
                    {!isAdmin && (
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-hover">
                        <div
                          className="h-full rounded-full bg-accent transition-all duration-500"
                          style={{ width: `${usagePercentage}%` }}
                        />
                      </div>
                    )}
                  </div>

                  {/* Reset countdown */}
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 text-muted">
                      <Clock className="w-4 h-4" />
                      <span>Quota resets at midnight UTC</span>
                    </div>
                    <span className="font-medium tabular-nums text-ink">{countdown}</span>
                  </div>
                </div>

                {/* Account identifier */}
                <div>
                  <SettingRow
                    title="Account ID"
                    description={<span className="break-all font-mono text-xs select-all">{user.id}</span>}
                  >
                    <button type="button" onClick={handleCopyId} className={secondaryButtonClass}>
                      {copiedId ? <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> : <Copy className="w-4 h-4" />}
                      <span>{copiedId ? "Copied" : "Copy ID"}</span>
                    </button>
                  </SettingRow>
                </div>

                {isAdmin && (
                  <div className={`${cardClass} flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between`}>
                    <div className="flex items-center gap-3">
                      <ShieldAlert className="w-5 h-5 text-accent" />
                      <div>
                        <div className="text-sm font-medium text-ink">Admin control center</div>
                        <div className="text-sm text-muted">
                          Manage user limits, telemetry, and security moderation.
                        </div>
                      </div>
                    </div>
                    <Link href="/admin" onClick={onClose} className={primaryButtonClass}>
                      <span>Open console</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: MEMORY */}
            {activeTab === "memory" && (
              <div className="space-y-8">
                <div className="flex items-start justify-between gap-4">
                  <SectionHeader
                    title="Memory"
                    description="RoleFlow learns facts, conventions, and preferences across your conversations so future replies fit you better."
                  />
                  {memories.length > 0 && (
                    <button
                      type="button"
                      onClick={handleClearAllMemories}
                      disabled={clearingMemories}
                      className={`${dangerButtonClass} shrink-0`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Clear all</span>
                    </button>
                  )}
                </div>

                {memoryFeedback && notice(memoryFeedback)}

                {/* Add memory */}
                <form onSubmit={handleAddMemory} className="flex gap-2">
                  <input
                    type="text"
                    value={newMemoryText}
                    onChange={(e) => setNewMemoryText(e.target.value)}
                    placeholder="Teach RoleFlow something, e.g. “I prefer Tailwind and TypeScript”"
                    aria-label="New memory"
                    className={`${inputClass} py-2`}
                  />
                  <button
                    type="submit"
                    disabled={isAddingMemory || !newMemoryText.trim()}
                    className={`${primaryButtonClass} shrink-0`}
                  >
                    <Plus className="w-4 h-4" />
                    <span>{isAddingMemory ? "Saving..." : "Add"}</span>
                  </button>
                </form>

                {/* Memory list */}
                {loadingMemories ? (
                  <div className="py-10 text-center text-sm text-muted">Loading your memories...</div>
                ) : memories.length === 0 ? (
                  <div className="space-y-2 rounded-2xl border border-dashed border-line px-6 py-10 text-center">
                    <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-accent-soft text-accent">
                      <Brain className="w-5 h-5" />
                    </div>
                    <h4 className="text-sm font-medium text-ink">No memories yet</h4>
                    <p className="mx-auto max-w-sm text-sm text-muted">
                      As you chat, key facts and conventions will appear here. You can also add them yourself above.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="text-sm font-medium text-muted">Saved memories ({memories.length})</div>
                    <ul className="max-h-80 divide-y divide-line overflow-y-auto rounded-2xl border border-line bg-app">
                      {memories.map((item) => (
                        <li key={item.id} className="group flex items-start justify-between gap-3 px-4 py-3">
                          <span className="select-text text-sm leading-relaxed text-ink">{item.memory}</span>
                          <button
                            type="button"
                            onClick={() => handleDeleteMemory(item.id)}
                            className={`shrink-0 rounded-lg p-1.5 text-muted opacity-100 transition-all hover:bg-hover hover:text-danger sm:opacity-0 sm:group-hover:opacity-100 ${focusRing}`}
                            title="Delete memory"
                            aria-label="Delete memory"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* TAB 4: CUSTOM INSTRUCTIONS */}
            {activeTab === "instructions" && (
              <div className="space-y-8">
                <SectionHeader
                  title="Custom instructions"
                  description="Tell RoleFlow about yourself and how you want it to respond. These apply to every future conversation."
                />

                <div className="space-y-6">
                  <div>
                    <label htmlFor="settings-about" className={labelClass}>
                      What should RoleFlow know about you?
                    </label>
                    <textarea
                      id="settings-about"
                      value={customInstructions}
                      onChange={(e) => setCustomInstructions(e.target.value)}
                      rows={5}
                      placeholder="e.g. I am a senior engineer building cloud architectures with TypeScript, Go, and Terraform."
                      className={`${inputClass} resize-none leading-relaxed`}
                    />
                    <span className={hintClass}>Your background, role, favorite languages, and domains.</span>
                  </div>

                  <div>
                    <label htmlFor="settings-response" className={labelClass}>
                      How should RoleFlow respond?
                    </label>
                    <textarea
                      id="settings-response"
                      value={responseInstructions}
                      onChange={(e) => setResponseInstructions(e.target.value)}
                      rows={5}
                      placeholder="e.g. Be concise. Skip pleasantries. Give complete code instead of snippets."
                      className={`${inputClass} resize-none leading-relaxed`}
                    />
                    <span className={hintClass}>Style, tone, formatting, and engineering standards.</span>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-4 border-t border-line pt-5">
                  <div className="min-h-[1.25rem]">
                    {saveSuccess && (
                      <span className={successTextClass}>
                        <Check className="w-4 h-4" />
                        Instructions saved
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleSaveAllPreferences()}
                    disabled={saving}
                    className={primaryButtonClass}
                  >
                    <Save className="w-4 h-4" />
                    <span>{saving ? "Saving..." : "Save instructions"}</span>
                  </button>
                </div>
              </div>
            )}

            {/* TAB 5: DATA & PRIVACY */}
            {activeTab === "privacy" && (
              <div className="space-y-8">
                <SectionHeader
                  title="Data & privacy"
                  description="Export your data or delete your conversation history."
                />

                <div className="flex gap-3 rounded-2xl border border-line bg-app p-4">
                  <Shield className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                  <div className="space-y-1">
                    <div className="text-sm font-medium text-ink">Your data is not used for model training</div>
                    <p className="text-sm leading-relaxed text-muted">
                      RoleFlow keeps your conversations and custom instructions isolated to your account. They are never used to train public or foundational AI models.
                    </p>
                  </div>
                </div>

                <div className="divide-y divide-line">
                  <SettingRow
                    title="Export all account data"
                    description="Download your conversations, profile settings, and memories as JSON."
                  >
                    <button
                      type="button"
                      onClick={handleExportData}
                      disabled={isExporting}
                      className={secondaryButtonClass}
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>{isExporting ? "Exporting..." : "Export JSON"}</span>
                    </button>
                  </SettingRow>

                  <SettingRow
                    title="Delete all conversations"
                    description="Permanently remove every conversation thread from your account. This cannot be undone."
                    danger
                  >
                    <button
                      type="button"
                      onClick={handleDeleteAllChats}
                      disabled={isDeletingChats}
                      className={dangerButtonClass}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>{isDeletingChats ? "Deleting..." : "Delete all chats"}</span>
                    </button>
                  </SettingRow>
                </div>

                {deleteChatsSuccess && notice("All conversation threads have been deleted.")}
              </div>
            )}

            {/* TAB 6: ADMIN QUEUE */}
            {activeTab === "admin" && isAdmin && (
              <div className="space-y-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <SectionHeader
                    title="Safety & moderation"
                    description="Live trust and safety records and incident dossiers."
                  />

                  <div className="flex shrink-0 flex-wrap items-center gap-2">
                    <select
                      value={logFilter}
                      onChange={(e) => setLogFilter(e.target.value)}
                      aria-label="Filter by status"
                      className={`rounded-xl border border-line bg-app px-3 py-2 text-sm text-ink ${focusRing}`}
                    >
                      <option value="ALL">All statuses</option>
                      <option value="FLAGGED">Flagged</option>
                      <option value="APPEALED">Appealed</option>
                      <option value="BANNED">Banned</option>
                      <option value="RESOLVED">Resolved / dismissed</option>
                    </select>

                    <button
                      type="button"
                      onClick={fetchModerationLogs}
                      disabled={loadingLogs}
                      className={secondaryButtonClass}
                    >
                      <RotateCw className={`w-3.5 h-3.5 ${loadingLogs ? "animate-spin" : ""}`} />
                      <span>Refresh</span>
                    </button>

                    <Link href="/admin" onClick={onClose} className={primaryButtonClass}>
                      <span>Full console</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>

                {actionMessage && notice(actionMessage)}

                {loadingLogs ? (
                  <div className="py-12 text-center text-sm text-muted">Loading moderation records...</div>
                ) : filteredLogs.length === 0 ? (
                  <div className="space-y-2 py-12 text-center">
                    <div className="mx-auto inline-flex rounded-full border border-line bg-app p-3">
                      <ShieldAlert className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <p className="text-sm font-medium text-ink">The queue is clear</p>
                    <p className="text-sm text-muted">No moderation incidents match this filter.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredLogs.map((log) => {
                      const isTier1 = log.tier === 1;
                      const isExpanded = expandedLogId === log.id;
                      const isProcessing = actionProcessingId === log.id;

                      return (
                        <div key={log.id} className={`${cardClass} p-5`}>
                          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                            <div className="flex flex-wrap items-center gap-2">
                              <span
                                className={`rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${
                                  isTier1
                                    ? "border-danger/30 bg-danger-soft text-danger"
                                    : "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300"
                                }`}
                              >
                                {isTier1 ? "Critical · Tier 1" : "Tier 2"}
                              </span>
                              <span className="font-mono text-xs text-ink">{log.category}</span>
                              <span
                                className={`rounded-md border px-2 py-0.5 text-[11px] font-medium ${
                                  log.status === "BANNED"
                                    ? "border-danger/30 bg-danger-soft text-danger"
                                    : log.status === "APPEALED"
                                    ? "border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-300"
                                    : log.status === "RESOLVED"
                                    ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                                    : "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300"
                                }`}
                              >
                                {log.status}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5 text-xs text-muted">
                              <Clock className="w-3.5 h-3.5" />
                              <span>{log.createdAt ? new Date(log.createdAt).toLocaleString() : "Recent"}</span>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 gap-2 border-y border-line py-3 text-xs text-muted sm:grid-cols-3">
                            <div className="flex min-w-0 items-center gap-1.5">
                              <Mail className="h-3.5 w-3.5 shrink-0" />
                              <span className="truncate">{log.userEmail || "guest"}</span>
                            </div>
                            <div className="flex min-w-0 items-center gap-1.5">
                              <Globe className="h-3.5 w-3.5 shrink-0" />
                              <span className="truncate">{log.ipAddress || "127.0.0.1"}</span>
                            </div>
                            <div className="flex min-w-0 items-center gap-1.5">
                              <span className="truncate font-mono">ID: {log.id}</span>
                            </div>
                          </div>

                          <div className="mt-4">
                            <div className="mb-1.5 flex items-center justify-between text-xs font-medium text-muted">
                              <span>Flagged prompt</span>
                              <button
                                type="button"
                                onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                                className={`flex items-center gap-1 rounded text-accent hover:underline ${focusRing}`}
                              >
                                <span>{isExpanded ? "Collapse" : "Expand"}</span>
                                {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                              </button>
                            </div>
                            <pre
                              className={`whitespace-pre-wrap rounded-xl border border-line bg-app p-3 font-mono text-xs leading-relaxed text-ink overflow-x-auto ${
                                isExpanded ? "max-h-96" : "max-h-16 overflow-hidden"
                              }`}
                            >
                              <code>{log.prompt}</code>
                            </pre>
                          </div>

                          {log.appealNote && (
                            <div className="mt-3 space-y-1 rounded-xl border border-sky-500/20 bg-sky-500/10 p-3 text-xs">
                              <div className="font-medium text-sky-700 dark:text-sky-300">User appeal statement</div>
                              <p className="italic leading-relaxed text-ink">&ldquo;{log.appealNote}&rdquo;</p>
                            </div>
                          )}

                          <div className="mt-4 flex flex-wrap items-center justify-end gap-2 border-t border-line pt-3">
                            <button
                              type="button"
                              onClick={() => handleExportDossier(log.id)}
                              className={secondaryButtonClass}
                            >
                              <Download className="w-3.5 h-3.5" />
                              <span>Export dossier</span>
                            </button>

                            <button
                              type="button"
                              disabled={isProcessing}
                              onClick={() => handleModerationAction(log.id, "UNBAN_DISMISS")}
                              className={secondaryButtonClass}
                            >
                              <UserCheck className="w-3.5 h-3.5" />
                              <span>Unban / dismiss</span>
                            </button>

                            <button
                              type="button"
                              disabled={isProcessing}
                              onClick={() => handleModerationAction(log.id, "CONFIRM_BAN")}
                              className={dangerButtonClass}
                            >
                              <Ban className="w-3.5 h-3.5" />
                              <span>Confirm ban</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
