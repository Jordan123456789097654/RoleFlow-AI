"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  X,
  Save,
  User,
  Brain,
  Sliders,
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
  AlertTriangle,
  RotateCw,
  Plus,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Mail,
  Globe,
  UserCheck,
  Ban,
} from "lucide-react";
import { UserProfile, ModerationLogEntry, UsageStats, MemoryItem } from "@/types";

const ADMIN_EMAIL = "jordanedanield13@gmail.com";

export type SettingsTab =
  | "general"
  | "account"
  | "memory"
  | "instructions"
  | "privacy"
  | "admin";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile;
  onUpdate: (updated: UserProfile) => void;
  defaultTab?: SettingsTab;
  usage?: UsageStats;
  onAllChatsDeleted?: () => void;
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
  const [theme, setTheme] = useState<"dark" | "system" | "amber">("dark");

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

  const dailyUsed = usage ? usage.used : (user.messageCount || 0);
  const dailyLimit = isAdmin ? Infinity : 25;
  const dailyRemaining = isAdmin ? "Unlimited" : Math.max(0, 25 - dailyUsed);
  const usagePercentage = isAdmin ? 0 : Math.min(100, Math.round((dailyUsed / 25) * 100));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col bg-[#171615] border border-[#2e2d2b] rounded-2xl shadow-2xl overflow-hidden">
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#282725] bg-[#1a1918]">
          <div className="flex items-center gap-2.5">
            <Sliders className="w-4 h-4 text-[#d97706]" />
            <h3 className="text-base font-semibold text-[#f4f4f0]">
              Settings
            </h3>
            {isAdmin && (
              <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                ADMIN ACCESS
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#9b9a97] hover:text-[#f4f4f0] hover:bg-[#252422] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tabbed Navigation Structure */}
        <div className="flex items-center gap-1 px-6 pt-2 border-b border-[#242321] bg-[#131312] overflow-x-auto select-none">
          <button
            type="button"
            onClick={() => setActiveTab("general")}
            className={`flex items-center gap-2 px-3.5 py-2.5 text-xs font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === "general"
                ? "border-[#d97706] text-[#f4f4f0]"
                : "border-transparent text-[#8a8984] hover:text-[#c4c3be]"
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>General</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("account")}
            className={`flex items-center gap-2 px-3.5 py-2.5 text-xs font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === "account"
                ? "border-[#d97706] text-[#f4f4f0]"
                : "border-transparent text-[#8a8984] hover:text-[#c4c3be]"
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Account &amp; Quota</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("memory")}
            className={`flex items-center gap-2 px-3.5 py-2.5 text-xs font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === "memory"
                ? "border-[#d97706] text-[#f4f4f0]"
                : "border-transparent text-[#8a8984] hover:text-[#c4c3be]"
            }`}
          >
            <Brain className="w-3.5 h-3.5" />
            <span>Memory System</span>
            {memories.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-[#272624] text-[#d97706] border border-[#3b3a36]">
                {memories.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("instructions")}
            className={`flex items-center gap-2 px-3.5 py-2.5 text-xs font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === "instructions"
                ? "border-[#d97706] text-[#f4f4f0]"
                : "border-transparent text-[#8a8984] hover:text-[#c4c3be]"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Custom Instructions</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("privacy")}
            className={`flex items-center gap-2 px-3.5 py-2.5 text-xs font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === "privacy"
                ? "border-[#d97706] text-[#f4f4f0]"
                : "border-transparent text-[#8a8984] hover:text-[#c4c3be]"
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>Data &amp; Privacy</span>
          </button>

          {isAdmin && (
            <button
              type="button"
              onClick={() => setActiveTab("admin")}
              className={`flex items-center gap-2 px-3.5 py-2.5 text-xs font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === "admin"
                  ? "border-red-500 text-red-400"
                  : "border-transparent text-[#8a8984] hover:text-red-300"
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
              <span>Admin Queue</span>
              {logs.filter((l) => l.status === "FLAGGED" || l.status === "APPEALED").length >
                0 && (
                <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-red-500/20 text-red-400 border border-red-500/30">
                  {
                    logs.filter((l) => l.status === "FLAGGED" || l.status === "APPEALED")
                      .length
                  }
                </span>
              )}
            </button>
          )}
        </div>

        {/* Tab Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* TAB 1: GENERAL */}
          {activeTab === "general" && (
            <div className="space-y-6 max-w-2xl">
              <div>
                <h4 className="text-sm font-medium text-[#f4f4f0] mb-1">
                  General Preferences
                </h4>
                <p className="text-xs text-[#9b9a97]">
                  Manage your public persona, identity, and application visual theme.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-[#c4c3be] mb-1.5 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-[#d97706]" />
                    <span>Display Name</span>
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Jordan Daniels"
                    className="w-full bg-[#1f1e1d] text-sm text-[#f4f4f0] placeholder-[#7d7c78] px-3.5 py-2.5 rounded-xl border border-[#302f2d] focus:outline-none focus:border-[#d97706]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#c4c3be] mb-1.5 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-[#d97706]" />
                    <span>Email Address</span>
                  </label>
                  <input
                    type="email"
                    value={user.email}
                    disabled
                    className="w-full bg-[#181716] text-sm text-[#888782] px-3.5 py-2.5 rounded-xl border border-[#282725] cursor-not-allowed"
                  />
                  <span className="text-[11px] text-[#787772] mt-1 block">
                    Verified account authentication email.
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#c4c3be] mb-2 flex items-center gap-1.5">
                    <Moon className="w-3.5 h-3.5 text-[#d97706]" />
                    <span>Color Theme</span>
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    <button
                      type="button"
                      onClick={() => setTheme("dark")}
                      className={`p-3 rounded-xl border text-left flex items-center gap-2.5 transition-all ${
                        theme === "dark"
                          ? "bg-[#252422] border-[#d97706] text-[#f4f4f0]"
                          : "bg-[#1d1c1b] border-[#2f2e2c] text-[#8e8d89] hover:text-[#d0cfcb]"
                      }`}
                    >
                      <Moon className="w-4 h-4 text-[#d97706]" />
                      <div>
                        <div className="text-xs font-medium">Dark (Default)</div>
                        <div className="text-[10px] text-[#777672]">Rich charcoal</div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setTheme("amber")}
                      className={`p-3 rounded-xl border text-left flex items-center gap-2.5 transition-all ${
                        theme === "amber"
                          ? "bg-[#252422] border-[#d97706] text-[#f4f4f0]"
                          : "bg-[#1d1c1b] border-[#2f2e2c] text-[#8e8d89] hover:text-[#d0cfcb]"
                      }`}
                    >
                      <Sun className="w-4 h-4 text-[#f59e0b]" />
                      <div>
                        <div className="text-xs font-medium">Warm Terracotta</div>
                        <div className="text-[10px] text-[#777672]">Warm ambient</div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setTheme("system")}
                      className={`p-3 rounded-xl border text-left flex items-center gap-2.5 transition-all ${
                        theme === "system"
                          ? "bg-[#252422] border-[#d97706] text-[#f4f4f0]"
                          : "bg-[#1d1c1b] border-[#2f2e2c] text-[#8e8d89] hover:text-[#d0cfcb]"
                      }`}
                    >
                      <Laptop className="w-4 h-4 text-sky-400" />
                      <div>
                        <div className="text-xs font-medium">System</div>
                        <div className="text-[10px] text-[#777672]">Match OS</div>
                      </div>
                    </button>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-[#262523] flex items-center justify-between">
                {saveSuccess ? (
                  <span className="text-xs text-emerald-400 font-medium flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5" />
                    Changes saved successfully
                  </span>
                ) : (
                  <span />
                )}
                <button
                  type="button"
                  onClick={() => handleSaveAllPreferences()}
                  disabled={saving}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#f4f4f0] hover:bg-white text-[#141413] text-xs font-semibold transition-colors shadow"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{saving ? "Saving..." : "Save Preferences"}</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: ACCOUNT & QUOTA */}
          {activeTab === "account" && (
            <div className="space-y-6 max-w-2xl">
              <div>
                <h4 className="text-sm font-medium text-[#f4f4f0] mb-1">
                  Account Plan &amp; Quota
                </h4>
                <p className="text-xs text-[#9b9a97]">
                  Monitor your daily message consumption, plan status, and identity credentials.
                </p>
              </div>

              {/* Plan Banner */}
              <div className="p-5 rounded-2xl bg-gradient-to-br from-[#1e1d1b] to-[#161514] border border-[#2f2e2c] space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#282725] border border-[#3b3a37] flex items-center justify-center text-[#d97706]">
                      <Shield className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-[#f4f4f0] flex items-center gap-2">
                        <span>{isAdmin ? "Admin Enterprise Plan" : "Community Free Plan"}</span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                          ACTIVE
                        </span>
                      </div>
                      <div className="text-xs text-[#8a8985]">
                        {isAdmin
                          ? "Unlimited model inference tokens and priority server routing."
                          : "25 daily high-precision messages with full access to Genesis & Flash."}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quota Progress */}
                <div className="space-y-2 pt-2 border-t border-[#292826]">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#999894]">Daily Usage</span>
                    <span className="font-mono text-[#f4f4f0]">
                      {isAdmin ? "Unlimited (0 / ∞)" : `${dailyUsed} / 25 messages used`}
                    </span>
                  </div>
                  {!isAdmin && (
                    <div className="w-full bg-[#242321] h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-[#d97706] h-full rounded-full transition-all duration-500"
                        style={{ width: `${usagePercentage}%` }}
                      />
                    </div>
                  )}
                </div>

                {/* Reset Countdown */}
                <div className="flex items-center justify-between pt-2 text-xs text-[#82817c]">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-[#d97706]" />
                    <span>Quota Resets At Midnight UTC:</span>
                  </div>
                  <span className="font-mono font-medium text-[#f4f4f0]">{countdown}</span>
                </div>
              </div>

              {/* Account Identifier Card */}
              <div className="p-4 rounded-xl bg-[#1b1a19] border border-[#2b2a28] flex items-center justify-between">
                <div>
                  <div className="text-xs text-[#8a8985] font-medium">Account ID</div>
                  <div className="font-mono text-xs text-[#e4e3de] select-all mt-0.5">
                    {user.id}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleCopyId}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#252422] hover:bg-[#302f2d] text-xs font-medium text-[#f4f4f0] border border-[#383734] transition-colors"
                >
                  {copiedId ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedId ? "Copied" : "Copy ID"}</span>
                </button>
              </div>

              {isAdmin && (
                <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <ShieldAlert className="w-4 h-4 text-amber-400" />
                    <div>
                      <div className="text-xs font-medium text-amber-300">Admin Control Center</div>
                      <div className="text-[11px] text-[#9b9a97]">
                        Access user limits, telemetry, and security moderation.
                      </div>
                    </div>
                  </div>
                  <Link
                    href="/admin"
                    onClick={onClose}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#d97706] hover:bg-[#b45309] text-xs font-semibold text-white transition-colors"
                  >
                    <span>Open Console</span>
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: MEMORY SYSTEM */}
          {activeTab === "memory" && (
            <div className="space-y-6 max-w-2xl">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h4 className="text-sm font-medium text-[#f4f4f0] mb-1 flex items-center gap-2">
                    <Brain className="w-4 h-4 text-[#d97706]" />
                    <span>RoleFlow Memory System</span>
                  </h4>
                  <p className="text-xs text-[#9b9a97] leading-relaxed">
                    RoleFlow automatically learns and stores facts, coding conventions, and preferences
                    across your sessions to tailor future responses.
                  </p>
                </div>

                {memories.length > 0 && (
                  <button
                    type="button"
                    onClick={handleClearAllMemories}
                    disabled={clearingMemories}
                    className="shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-medium border border-red-500/20 transition-colors"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Clear All</span>
                  </button>
                )}
              </div>

              {memoryFeedback && (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400 flex items-center gap-2">
                  <Check className="w-3.5 h-3.5" />
                  <span>{memoryFeedback}</span>
                </div>
              )}

              {/* Add Custom Memory Input */}
              <form onSubmit={handleAddMemory} className="flex gap-2">
                <input
                  type="text"
                  value={newMemoryText}
                  onChange={(e) => setNewMemoryText(e.target.value)}
                  placeholder="Teach RoleFlow a memory (e.g. 'I prefer Tailwind and TypeScript')"
                  className="flex-1 bg-[#1f1e1d] text-xs text-[#f4f4f0] placeholder-[#7d7c78] px-3.5 py-2 rounded-xl border border-[#302f2d] focus:outline-none focus:border-[#d97706]"
                />
                <button
                  type="submit"
                  disabled={isAddingMemory || !newMemoryText.trim()}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#d97706] hover:bg-[#b45309] text-white text-xs font-semibold transition-colors disabled:opacity-50"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{isAddingMemory ? "Saving..." : "Add Memory"}</span>
                </button>
              </form>

              {/* Memory Items List */}
              {loadingMemories ? (
                <div className="py-8 text-center text-xs text-[#888782]">
                  Loading your learned memories...
                </div>
              ) : memories.length === 0 ? (
                <div className="p-8 rounded-2xl bg-[#1b1a19] border border-[#2b2a28] text-center space-y-2">
                  <div className="w-10 h-10 rounded-full bg-[#242321] border border-[#33322f] flex items-center justify-center text-[#d97706] mx-auto">
                    <Brain className="w-5 h-5" />
                  </div>
                  <h5 className="text-xs font-semibold text-[#f4f4f0]">No Memories Yet</h5>
                  <p className="text-xs text-[#8a8984] max-w-sm mx-auto">
                    As you chat with RoleFlow, key facts and conventions will appear here automatically, or you can add them manually above.
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  <div className="text-xs font-medium text-[#888782] px-1">
                    Learned Facts ({memories.length})
                  </div>
                  <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                    {memories.map((item) => (
                      <div
                        key={item.id}
                        className="group flex items-center justify-between p-3 rounded-xl bg-[#1d1c1a] border border-[#2c2b29] hover:border-[#3d3c39] transition-all"
                      >
                        <div className="flex items-start gap-2.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#d97706] mt-2 shrink-0" />
                          <span className="text-xs text-[#deddd9] leading-relaxed select-text">
                            {item.memory}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDeleteMemory(item.id)}
                          className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-[#858480] hover:text-red-400 hover:bg-[#282725] transition-all"
                          title="Delete memory"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: CUSTOM INSTRUCTIONS */}
          {activeTab === "instructions" && (
            <div className="space-y-6 max-w-2xl">
              <div>
                <h4 className="text-sm font-medium text-[#f4f4f0] mb-1 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#d97706]" />
                  <span>Custom Instructions</span>
                </h4>
                <p className="text-xs text-[#9b9a97]">
                  Tailor how RoleFlow thinks, reasons, and formats code across all future conversations.
                </p>
              </div>

              <div className="space-y-5">
                {/* Textarea 1 */}
                <div>
                  <label className="block text-xs font-medium text-[#c4c3be] mb-1.5">
                    What would you like RoleFlow to know about you?
                  </label>
                  <textarea
                    value={customInstructions}
                    onChange={(e) => setCustomInstructions(e.target.value)}
                    rows={4}
                    placeholder="e.g. I am a senior engineer building cloud architectures with TypeScript, Go, and Terraform. Assume strong technical context."
                    className="w-full bg-[#1f1e1d] text-sm text-[#f4f4f0] placeholder-[#7d7c78] p-3.5 rounded-xl border border-[#302f2d] focus:outline-none focus:border-[#d97706] resize-none leading-relaxed"
                  />
                  <span className="text-[11px] text-[#787772] mt-1 block">
                    Your background, role, favorite programming languages, and domains.
                  </span>
                </div>

                {/* Textarea 2 */}
                <div>
                  <label className="block text-xs font-medium text-[#c4c3be] mb-1.5">
                    How would you like RoleFlow to respond?
                  </label>
                  <textarea
                    value={responseInstructions}
                    onChange={(e) => setResponseInstructions(e.target.value)}
                    rows={4}
                    placeholder="e.g. Be concise and precise. Avoid conversational pleasantries. Provide complete code implementations instead of snippets when asked."
                    className="w-full bg-[#1f1e1d] text-sm text-[#f4f4f0] placeholder-[#7d7c78] p-3.5 rounded-xl border border-[#302f2d] focus:outline-none focus:border-[#d97706] resize-none leading-relaxed"
                  />
                  <span className="text-[11px] text-[#787772] mt-1 block">
                    Style, tone, formatting preferences, and engineering standards.
                  </span>
                </div>
              </div>

              <div className="pt-4 border-t border-[#262523] flex items-center justify-between">
                {saveSuccess ? (
                  <span className="text-xs text-emerald-400 font-medium flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5" />
                    Instructions saved successfully
                  </span>
                ) : (
                  <span />
                )}
                <button
                  type="button"
                  onClick={() => handleSaveAllPreferences()}
                  disabled={saving}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#f4f4f0] hover:bg-white text-[#141413] text-xs font-semibold transition-colors shadow"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{saving ? "Saving..." : "Save Instructions"}</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 5: DATA & PRIVACY */}
          {activeTab === "privacy" && (
            <div className="space-y-6 max-w-2xl">
              <div>
                <h4 className="text-sm font-medium text-[#f4f4f0] mb-1 flex items-center gap-2">
                  <Database className="w-4 h-4 text-[#d97706]" />
                  <span>Data &amp; Privacy</span>
                </h4>
                <p className="text-xs text-[#9b9a97]">
                  Manage your data export, conversational retention, and privacy commitments.
                </p>
              </div>

              {/* Privacy highlights */}
              <div className="p-4 rounded-xl bg-[#1a1918] border border-[#2a2927] space-y-2 text-xs text-[#999894]">
                <div className="flex items-center gap-2 text-emerald-400 font-medium">
                  <Shield className="w-4 h-4" />
                  <span>Zero Public Model Training</span>
                </div>
                <p className="leading-relaxed text-[#8a8985]">
                  RoleFlow strictly isolates user conversation logs and custom instructions. Your data is never used to train public or foundational AI models.
                </p>
              </div>

              {/* Data Export Box */}
              <div className="p-4 rounded-xl bg-[#1d1c1a] border border-[#2b2a28] flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-[#f4f4f0]">Export All Account Data</div>
                  <div className="text-xs text-[#8a8985] mt-0.5">
                    Download complete conversational histories, artifacts, profile settings, and memories as JSON.
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleExportData}
                  disabled={isExporting}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#252422] hover:bg-[#302f2d] text-xs font-medium text-[#f4f4f0] border border-[#383734] transition-colors shrink-0"
                >
                  <Download className="w-3.5 h-3.5 text-[#d97706]" />
                  <span>{isExporting ? "Exporting..." : "Export JSON"}</span>
                </button>
              </div>

              {/* Delete All Chats */}
              <div className="p-4 rounded-xl bg-red-950/20 border border-red-900/30 flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-red-400">Delete All Conversations</div>
                  <div className="text-xs text-[#a3a29d] mt-0.5">
                    Permanently wipe all conversation threads and message logs from your account.
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleDeleteAllChats}
                  disabled={isDeletingChats}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-semibold border border-red-500/30 transition-colors shrink-0"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{isDeletingChats ? "Deleting..." : "Delete All Chats"}</span>
                </button>
              </div>

              {deleteChatsSuccess && (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400">
                  ✓ All conversation threads have been successfully deleted.
                </div>
              )}
            </div>
          )}

          {/* TAB 6: ADMIN QUEUE */}
          {activeTab === "admin" && isAdmin && (
            <div className="space-y-6">
              {/* Header section */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#262523]">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <ShieldAlert className="w-4 h-4 text-red-400" />
                    <h4 className="text-base font-semibold text-[#f4f4f0]">
                      Safety &amp; Moderation Queue
                    </h4>
                  </div>
                  <p className="text-xs text-[#9b9a97]">
                    Live Trust &amp; Safety audit records and incident dossiers.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={logFilter}
                    onChange={(e) => setLogFilter(e.target.value)}
                    className="bg-[#201f1e] text-xs text-[#c5c4be] px-3 py-1.5 rounded-xl border border-[#333230] focus:outline-none"
                  >
                    <option value="ALL">All Statuses</option>
                    <option value="FLAGGED">Flagged</option>
                    <option value="APPEALED">Appealed</option>
                    <option value="BANNED">Banned</option>
                    <option value="RESOLVED">Resolved / Dismissed</option>
                  </select>

                  <button
                    type="button"
                    onClick={fetchModerationLogs}
                    disabled={loadingLogs}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#201f1e] hover:bg-[#2a2927] text-xs text-[#c5c4be] border border-[#333230] transition-colors"
                  >
                    <RotateCw className={`w-3.5 h-3.5 ${loadingLogs ? "animate-spin" : ""}`} />
                    <span>Refresh</span>
                  </button>

                  <Link
                    href="/admin"
                    onClick={onClose}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#d97706] hover:bg-[#b45309] text-xs font-semibold text-white transition-colors"
                  >
                    <span>Full Admin Console</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>

              {actionMessage && (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400">
                  {actionMessage}
                </div>
              )}

              {loadingLogs ? (
                <div className="py-12 text-center text-xs text-[#888782]">
                  Loading moderation records...
                </div>
              ) : filteredLogs.length === 0 ? (
                <div className="py-12 text-center space-y-2">
                  <div className="inline-flex p-3 rounded-full bg-[#1e1d1b] border border-[#2e2d2b] text-[#888782]">
                    <ShieldAlert className="w-5 h-5 text-emerald-400" />
                  </div>
                  <p className="text-sm text-[#f4f4f0] font-medium">Queue is clean</p>
                  <p className="text-xs text-[#888782]">
                    No moderation incidents match the current filter.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredLogs.map((log) => {
                    const isTier1 = log.tier === 1;
                    const isExpanded = expandedLogId === log.id;
                    const isProcessing = actionProcessingId === log.id;

                    return (
                      <div
                        key={log.id}
                        className={`rounded-xl border p-4 transition-all ${
                          isTier1
                            ? "bg-[#1c1313]/50 border-red-500/30 hover:border-red-500/50"
                            : "bg-[#1c1813]/50 border-amber-500/30 hover:border-amber-500/50"
                        }`}
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
                          <div className="flex items-center gap-2">
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold tracking-wider ${
                                isTier1
                                  ? "bg-red-500/20 text-red-400 border border-red-500/40"
                                  : "bg-amber-500/20 text-amber-400 border border-amber-500/40"
                              }`}
                            >
                              {isTier1 ? "CRITICAL TIER 1" : "TIER 2"}
                            </span>
                            <span className="font-mono text-[11px] text-[#f4f4f0] font-medium">
                              {log.category}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-mono ${
                                log.status === "BANNED"
                                  ? "bg-red-950/60 text-red-300 border border-red-800/40"
                                  : log.status === "APPEALED"
                                  ? "bg-sky-950/60 text-sky-300 border border-sky-800/40"
                                  : log.status === "RESOLVED"
                                  ? "bg-emerald-950/60 text-emerald-300 border border-emerald-800/40"
                                  : "bg-amber-950/60 text-amber-300 border border-amber-800/40"
                              }`}
                            >
                              {log.status}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-[#888782] font-mono">
                            <Clock className="w-3.5 h-3.5" />
                            <span>
                              {log.createdAt ? new Date(log.createdAt).toLocaleString() : "Recent"}
                            </span>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-[#a1a09a] py-2 border-y border-white/5 font-mono">
                          <div className="flex items-center gap-1.5 truncate">
                            <Mail className="w-3.5 h-3.5 text-[#777672] shrink-0" />
                            <span className="truncate">{log.userEmail || "guest"}</span>
                          </div>
                          <div className="flex items-center gap-1.5 truncate">
                            <Globe className="w-3.5 h-3.5 text-[#777672] shrink-0" />
                            <span>{log.ipAddress || "127.0.0.1"}</span>
                          </div>
                          <div className="flex items-center gap-1.5 truncate text-[#777672]">
                            <span>ID: {log.id}</span>
                          </div>
                        </div>

                        <div className="mt-3">
                          <div className="flex items-center justify-between text-[11px] font-medium text-[#888782] mb-1">
                            <span>Flagged Prompt Evidence</span>
                            <button
                              type="button"
                              onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                              className="flex items-center gap-1 text-[#d97706] hover:underline"
                            >
                              <span>{isExpanded ? "Collapse" : "Expand"}</span>
                              {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                          <pre
                            className={`p-3 rounded-lg bg-black/50 text-xs font-mono text-[#e4e3de] overflow-x-auto border border-white/5 whitespace-pre-wrap leading-relaxed ${
                              isExpanded ? "max-h-96" : "max-h-16 overflow-hidden"
                            }`}
                          >
                            <code>{log.prompt}</code>
                          </pre>
                        </div>

                        {log.appealNote && (
                          <div className="mt-3 p-3 rounded-lg bg-sky-950/20 border border-sky-800/30 text-xs space-y-1">
                            <div className="font-semibold text-sky-400">User Appeal Statement:</div>
                            <p className="text-[#c5c4be] leading-relaxed italic">
                              "{log.appealNote}"
                            </p>
                          </div>
                        )}

                        <div className="flex flex-wrap items-center justify-end gap-2 mt-4 pt-3 border-t border-white/5">
                          <button
                            type="button"
                            onClick={() => handleExportDossier(log.id)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#242322] hover:bg-[#2d2c2a] text-xs font-medium text-[#f4f4f0] border border-[#3b3a37] transition-colors"
                          >
                            <Download className="w-3.5 h-3.5 text-[#d97706]" />
                            <span>Export Official Dossier</span>
                          </button>

                          <button
                            type="button"
                            disabled={isProcessing}
                            onClick={() => handleModerationAction(log.id, "UNBAN_DISMISS")}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-medium transition-colors disabled:opacity-50"
                          >
                            <UserCheck className="w-3.5 h-3.5" />
                            <span>Unban / Dismiss</span>
                          </button>

                          <button
                            type="button"
                            disabled={isProcessing}
                            onClick={() => handleModerationAction(log.id, "CONFIRM_BAN")}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-medium transition-colors disabled:opacity-50"
                          >
                            <Ban className="w-3.5 h-3.5" />
                            <span>Confirm Ban</span>
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
  );
};
