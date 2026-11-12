"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Save,
  User,
  FileCode,
  ShieldAlert,
  AlertTriangle,
  Download,
  UserCheck,
  Ban,
  RotateCw,
  Clock,
  Globe,
  Mail,
  ChevronDown,
  ChevronUp,
  Sliders,
  ExternalLink,
} from "lucide-react";
import { UserProfile, ModerationLogEntry, ModerationStatus, UsageStats } from "@/types";

const ADMIN_EMAIL = "jordanedanield13@gmail.com";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile;
  onUpdate: (updated: UserProfile) => void;
  defaultTab?: "general" | "admin";
  usage?: UsageStats;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  user,
  onUpdate,
  defaultTab = "general",
}) => {
  const isAdmin = Boolean(
    user.isAdmin || user.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase()
  );

  const [activeTab, setActiveTab] = useState<"general" | "admin">(
    isAdmin && defaultTab === "admin" ? "admin" : "general"
  );

  // Profile preferences state
  const [name, setName] = useState(user.name);
  const [instructions, setInstructions] = useState(user.customInstructions || "");
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Admin moderation queue state
  const [logs, setLogs] = useState<ModerationLogEntry[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [logFilter, setLogFilter] = useState<string>("ALL");
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
  const [actionProcessingId, setActionProcessingId] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && isAdmin && activeTab === "admin") {
      fetchModerationLogs();
    }
  }, [isOpen, isAdmin, activeTab]);

  if (!isOpen) return null;

  const handleSavePreferences = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveSuccess(false);
    try {
      const res = await fetch("/api/users/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: user.id,
          name: name.trim() || user.name,
          customInstructions: instructions.trim(),
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[90vh] flex flex-col bg-[#171615] border border-[#2e2d2b] rounded-2xl shadow-2xl overflow-hidden">
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#2a2927] bg-[#1a1918]">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-[#d97706]" />
            <h3 className="text-base font-semibold text-[#f4f4f0]">
              Settings &amp; Platform Controls
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#9b9a97] hover:text-[#f4f4f0] hover:bg-[#252422] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 px-6 pt-3 border-b border-[#252422] bg-[#141413]">
          <button
            type="button"
            onClick={() => setActiveTab("general")}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-medium border-b-2 transition-colors ${
              activeTab === "general"
                ? "border-[#d97706] text-[#f4f4f0]"
                : "border-transparent text-[#8a8984] hover:text-[#c4c3be]"
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Profile &amp; Instructions</span>
          </button>

          {isAdmin && (
            <button
              type="button"
              onClick={() => setActiveTab("admin")}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-medium border-b-2 transition-colors ${
                activeTab === "admin"
                  ? "border-red-500 text-red-400"
                  : "border-transparent text-[#8a8984] hover:text-red-300"
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
              <span>Safety &amp; Moderation Queue</span>
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

        {/* Tab Content Container */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* TAB 1: General Profile & Custom Instructions */}
          {activeTab === "general" && (
            <form onSubmit={handleSavePreferences} className="space-y-5 max-w-2xl">
              <div>
                <h4 className="text-sm font-medium text-[#f4f4f0] mb-1">
                  Custom Instructions &amp; Persona
                </h4>
                <p className="text-xs text-[#9b9a97]">
                  Tell RoleFlow who you are and tailor model generation preferences across all chats.
                </p>
              </div>

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
                  <FileCode className="w-3.5 h-3.5 text-[#d97706]" />
                  <span>What would you like RoleFlow to know about you?</span>
                </label>
                <textarea
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  rows={6}
                  placeholder="e.g. I work primarily with Next.js, TypeScript, and Python. Always write clean code with minimal fluff, comprehensive typing, and modern best practices."
                  className="w-full bg-[#1f1e1d] text-sm text-[#f4f4f0] placeholder-[#7d7c78] p-3.5 rounded-xl border border-[#302f2d] focus:outline-none focus:border-[#d97706] resize-none leading-relaxed"
                />
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-[#252422]">
                {saveSuccess ? (
                  <span className="text-xs text-emerald-400 font-medium">
                    ✓ Preferences saved successfully
                  </span>
                ) : (
                  <span />
                )}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 rounded-xl text-xs text-[#9b9a97] hover:text-[#f4f4f0] transition-colors"
                  >
                    Close
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#f4f4f0] hover:bg-white text-[#141413] text-xs font-semibold transition-colors shadow"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>{saving ? "Saving..." : "Save Preferences"}</span>
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* TAB 2: Admin Moderation & Trust & Safety Queue */}
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
                    Live Trust &amp; Safety audit records, incident dossiers for law enforcement (DHS/FBI), and appeal adjudications.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {/* Status Filter */}
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
                </div>
              </div>

              {actionMessage && (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400">
                  {actionMessage}
                </div>
              )}

              {/* Incidents List */}
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
                        {/* Incident Header */}
                        <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
                          <div className="flex items-center gap-2">
                            {/* Severity Badge */}
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold tracking-wider ${
                                isTier1
                                  ? "bg-red-500/20 text-red-400 border border-red-500/40"
                                  : "bg-amber-500/20 text-amber-400 border border-amber-500/40"
                              }`}
                            >
                              {isTier1 ? "CRITICAL TIER 1" : "TIER 2"}
                            </span>

                            {/* Category Badge */}
                            <span className="font-mono text-[11px] text-[#f4f4f0] font-medium">
                              {log.category}
                            </span>

                            {/* Status Badge */}
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

                        {/* Origin Details */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-[#a1a09a] py-2 border-y border-white/5 font-mono">
                          <div className="flex items-center gap-1.5 truncate">
                            <Mail className="w-3.5 h-3.5 text-[#777672] shrink-0" />
                            <span className="truncate" title={log.userEmail}>
                              {log.userEmail || "guest"}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 truncate">
                            <Globe className="w-3.5 h-3.5 text-[#777672] shrink-0" />
                            <span>{log.ipAddress || "127.0.0.1"}</span>
                          </div>
                          <div className="flex items-center gap-1.5 truncate text-[#777672]">
                            <span>ID: {log.id}</span>
                          </div>
                        </div>

                        {/* Flagged Prompt Preview */}
                        <div className="mt-3">
                          <div className="flex items-center justify-between text-[11px] font-medium text-[#888782] mb-1">
                            <span>Flagged Prompt Evidence</span>
                            <button
                              type="button"
                              onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                              className="flex items-center gap-1 text-[#d97706] hover:underline"
                            >
                              <span>{isExpanded ? "Collapse" : "Expand"}</span>
                              {isExpanded ? (
                                <ChevronUp className="w-3.5 h-3.5" />
                              ) : (
                                <ChevronDown className="w-3.5 h-3.5" />
                              )}
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

                        {/* User Appeal Section */}
                        {log.appealNote && (
                          <div className="mt-3 p-3 rounded-lg bg-sky-950/20 border border-sky-800/30 text-xs space-y-1">
                            <div className="font-semibold text-sky-400 flex items-center gap-1.5">
                              <span>User Appeal Statement:</span>
                            </div>
                            <p className="text-[#c5c4be] leading-relaxed italic">
                              "{log.appealNote}"
                            </p>
                          </div>
                        )}

                        {/* Action Buttons Row */}
                        <div className="flex flex-wrap items-center justify-end gap-2 mt-4 pt-3 border-t border-white/5">
                          {/* Export Official Dossier */}
                          <button
                            type="button"
                            onClick={() => handleExportDossier(log.id)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#242322] hover:bg-[#2d2c2a] text-xs font-medium text-[#f4f4f0] border border-[#3b3a37] transition-colors"
                          >
                            <Download className="w-3.5 h-3.5 text-[#d97706]" />
                            <span>Export Official Dossier</span>
                          </button>

                          {/* Unban / Dismiss */}
                          <button
                            type="button"
                            disabled={isProcessing}
                            onClick={() => handleModerationAction(log.id, "UNBAN_DISMISS")}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-medium transition-colors disabled:opacity-50"
                          >
                            <UserCheck className="w-3.5 h-3.5" />
                            <span>Unban / Dismiss</span>
                          </button>

                          {/* Confirm Ban */}
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
