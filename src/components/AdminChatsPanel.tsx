"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Search,
  RefreshCw,
  MessageSquare,
  User,
  Copy,
  Check,
  ExternalLink,
  Eye,
  Clock,
  Sparkles,
  Code,
  X,
  AlertTriangle,
  Bot,
  Layers,
  ChevronRight,
  Filter,
} from "lucide-react";
import { Chat, Message } from "@/types";

interface AdminChatSummary extends Chat {
  userEmail?: string;
  userName?: string;
  messageCount: number;
  snippet?: string;
}

interface AdminChatsPanelProps {
  initialUserFilter?: string;
}

const focusRing = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40";
const inputClass = `w-full rounded-xl border border-line bg-app px-3.5 py-2.5 text-sm text-ink placeholder:text-muted/70 focus:outline-none focus:border-accent/60 transition-colors ${focusRing}`;
const primaryButtonClass = `inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-50 ${focusRing}`;
const secondaryButtonClass = `inline-flex items-center gap-1.5 rounded-xl border border-line bg-card px-3 py-1.5 text-xs font-medium text-ink transition-colors hover:bg-hover disabled:cursor-not-allowed disabled:opacity-50 ${focusRing}`;
const cardClass = "rounded-2xl border border-line bg-card";

export const AdminChatsPanel: React.FC<AdminChatsPanelProps> = ({ initialUserFilter = "" }) => {
  const [chats, setChats] = useState<AdminChatSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState(initialUserFilter);
  const [userTypeFilter, setUserTypeFilter] = useState<"all" | "registered" | "guest">("all");

  const [inspectChat, setInspectChat] = useState<AdminChatSummary | null>(null);
  const [inspectLoading, setInspectLoading] = useState(false);
  const [fullChat, setFullChat] = useState<AdminChatSummary | null>(null);

  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedType, setCopiedType] = useState<"id" | "json" | "markdown" | null>(null);

  const fetchChats = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (searchTerm.trim()) {
        params.set("search", searchTerm.trim());
      }
      params.set("limit", "100");

      const res = await fetch(`/api/admin/chats?${params.toString()}`);
      if (!res.ok) {
        throw new Error(`Failed to load chats (${res.status})`);
      }
      const data = await res.json();
      setChats(data.chats || []);
      setTotal(data.total || 0);
    } catch (err: any) {
      console.error("Admin load chats error:", err);
      setError(err.message || "Failed to load chats");
    } finally {
      setLoading(false);
    }
  }, [searchTerm]);

  useEffect(() => {
    fetchChats();
  }, [fetchChats]);

  // Load detailed chat messages when inspection opens
  useEffect(() => {
    if (!inspectChat) {
      setFullChat(null);
      return;
    }

    let active = true;
    setInspectLoading(true);

    fetch(`/api/admin/chats/${inspectChat.id}`)
      .then((res) => res.json())
      .then((data) => {
        if (active && data.chat) {
          setFullChat(data.chat);
        }
      })
      .catch((err) => {
        console.error("Failed to load chat details:", err);
      })
      .finally(() => {
        if (active) setInspectLoading(false);
      });

    return () => {
      active = false;
    };
  }, [inspectChat]);

  const filteredChats = useMemo(() => {
    return chats.filter((c) => {
      if (userTypeFilter === "registered") {
        return c.userId && !c.userId.startsWith("guest_");
      }
      if (userTypeFilter === "guest") {
        return !c.userId || c.userId.startsWith("guest_");
      }
      return true;
    });
  }, [chats, userTypeFilter]);

  const handleCopy = (text: string, type: "id" | "json" | "markdown") => {
    navigator.clipboard.writeText(text);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 2000);
  };

  const generateMarkdownTranscript = (chat: AdminChatSummary): string => {
    const lines = [
      `# Chat Transcript: ${chat.title}`,
      `**Chat ID:** \`${chat.id}\``,
      `**User:** ${chat.userEmail || chat.userName || chat.userId || "Guest"}`,
      `**Model:** ${chat.model} | **Effort:** ${chat.effort}`,
      `**Date:** ${new Date(chat.createdAt).toLocaleString()}`,
      `---`,
      "",
    ];

    const msgs = (fullChat?.messages || chat.messages || []) as Message[];
    msgs.forEach((m, idx) => {
      const sender = m.role === "user" ? "👤 User" : "✨ RoleFlow AI";
      lines.push(`### Turn ${idx + 1} · ${sender}`);
      if (m.createdAt) {
        lines.push(`*Time: ${new Date(m.createdAt).toLocaleString()}*`);
      }
      lines.push("");
      lines.push(m.content);
      if (m.artifact) {
        lines.push("");
        lines.push(`> **Artifact Generated:** ${m.artifact.title} (${m.artifact.primaryLanguage})`);
      }
      lines.push("");
      lines.push("---");
      lines.push("");
    });

    return lines.join("\n");
  };

  return (
    <div className="space-y-6">
      {/* Search and Filters Header */}
      <div className={cardClass}>
        <div className="p-5 sm:p-6 border-b border-line">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold text-ink">User Conversations & Bug Inspector</h2>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-accent-soft text-accent font-medium">
                  Support Mode
                </span>
              </div>
              <p className="mt-1 text-xs text-muted leading-relaxed">
                Inspect customer conversations in real-time to debug unexpected model outputs, investigate reported issues, and troubleshoot errors.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={fetchChats}
                disabled={loading}
                className={secondaryButtonClass}
                title="Refresh conversation list"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
                <span>Refresh</span>
              </button>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="mt-4 flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
              <input
                type="text"
                placeholder="Search by user email, user name, chat title, or chat ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`${inputClass} pl-10`}
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-ink text-xs p-1"
                >
                  Clear
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <div className="inline-flex rounded-xl border border-line bg-app p-1 text-xs font-medium">
                <button
                  type="button"
                  onClick={() => setUserTypeFilter("all")}
                  className={`px-3 py-1.5 rounded-lg transition-colors ${
                    userTypeFilter === "all" ? "bg-card text-ink shadow-sm" : "text-muted hover:text-ink"
                  }`}
                >
                  All ({total})
                </button>
                <button
                  type="button"
                  onClick={() => setUserTypeFilter("registered")}
                  className={`px-3 py-1.5 rounded-lg transition-colors ${
                    userTypeFilter === "registered" ? "bg-card text-ink shadow-sm" : "text-muted hover:text-ink"
                  }`}
                >
                  Registered
                </button>
                <button
                  type="button"
                  onClick={() => setUserTypeFilter("guest")}
                  className={`px-3 py-1.5 rounded-lg transition-colors ${
                    userTypeFilter === "guest" ? "bg-card text-ink shadow-sm" : "text-muted hover:text-ink"
                  }`}
                >
                  Guests
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Error Notice */}
        {error && (
          <div className="m-5 p-4 rounded-xl bg-danger-soft border border-danger/30 text-xs text-danger flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold block">Failed to load chats</span>
              {error}
            </div>
          </div>
        )}

        {/* Chats Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-app/50 border-b border-line text-muted uppercase tracking-wider font-medium">
              <tr>
                <th className="px-5 py-3">User</th>
                <th className="px-5 py-3">Conversation</th>
                <th className="px-5 py-3">Model / Effort</th>
                <th className="px-5 py-3">Turns</th>
                <th className="px-5 py-3">Last Active</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {loading && chats.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-muted">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-accent" />
                    Loading conversations across system...
                  </td>
                </tr>
              ) : filteredChats.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-muted">
                    <MessageSquare className="w-6 h-6 mx-auto mb-2 text-muted/60" />
                    No user conversations found matching your criteria.
                  </td>
                </tr>
              ) : (
                filteredChats.map((chat) => {
                  const isGuest = !chat.userId || chat.userId.startsWith("guest_");
                  return (
                    <tr
                      key={chat.id}
                      className="hover:bg-hover/60 transition-colors cursor-pointer group"
                      onClick={() => setInspectChat(chat)}
                    >
                      {/* User Column */}
                      <td className="px-5 py-3.5 align-top">
                        {isGuest ? (
                          <div className="flex items-center gap-1.5">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-line/50 text-muted font-mono text-[11px]">
                              <User className="w-3 h-3" />
                              Guest ({chat.userId ? chat.userId.slice(0, 10) : "anon"})
                            </span>
                          </div>
                        ) : (
                          <div>
                            <div className="font-medium text-ink flex items-center gap-1.5">
                              <span>{chat.userName || "User"}</span>
                            </div>
                            <div className="text-muted text-[11px] truncate max-w-[180px]">
                              {chat.userEmail || chat.userId}
                            </div>
                          </div>
                        )}
                      </td>

                      {/* Conversation Title & Snippet Column */}
                      <td className="px-5 py-3.5 align-top max-w-[320px]">
                        <div className="font-medium text-ink truncate group-hover:text-accent transition-colors">
                          {chat.title || "Untitled Chat"}
                        </div>
                        {chat.snippet && (
                          <div className="text-muted text-[11px] truncate mt-0.5 italic">
                            "{chat.snippet}"
                          </div>
                        )}
                        <div className="text-[10px] text-muted/60 font-mono mt-0.5">
                          ID: {chat.id.slice(0, 12)}...
                        </div>
                      </td>

                      {/* Model & Effort Column */}
                      <td className="px-5 py-3.5 align-top whitespace-nowrap">
                        <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-app border border-line text-ink font-medium text-[11px]">
                          <Sparkles className="w-3 h-3 text-accent" />
                          <span>{chat.model}</span>
                        </div>
                        <div className="text-[10px] text-muted mt-1 uppercase font-mono">
                          Effort: <span className="font-semibold text-ink">{chat.effort}</span>
                        </div>
                      </td>

                      {/* Message Count */}
                      <td className="px-5 py-3.5 align-top whitespace-nowrap text-muted">
                        <span className="px-2 py-0.5 rounded-full border border-line bg-app text-ink font-medium text-[11px]">
                          {chat.messageCount} turns
                        </span>
                      </td>

                      {/* Last Active */}
                      <td className="px-5 py-3.5 align-top whitespace-nowrap text-muted text-[11px]">
                        {new Date(chat.updatedAt || chat.createdAt).toLocaleString(undefined, {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-3.5 align-top text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => setInspectChat(chat)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-accent text-white hover:bg-accent-hover text-xs font-medium transition-colors"
                            title="Inspect full conversation"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Inspect</span>
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

      {/* Full Transcript Inspection Modal */}
      {inspectChat && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div
            className="w-full max-w-4xl max-h-[92vh] flex flex-col rounded-2xl border border-line bg-card shadow-2xl overflow-hidden"
            role="dialog"
            aria-modal="true"
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-4 p-5 sm:p-6 border-b border-line bg-app/50">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-accent-soft text-accent font-medium">
                    Transcript Inspector
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded-md border border-line bg-card text-muted font-mono">
                    ID: {inspectChat.id}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopy(inspectChat.id, "id")}
                    className="text-muted hover:text-ink text-xs inline-flex items-center gap-1"
                    title="Copy Chat ID"
                  >
                    {copiedType === "id" ? <Check className="w-3.5 h-3.5 text-success" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>

                <h3 className="mt-2 text-lg font-semibold text-ink truncate">
                  {inspectChat.title || "Untitled Conversation"}
                </h3>

                <div className="mt-1 flex items-center gap-3 text-xs text-muted flex-wrap">
                  <span>
                    User:{" "}
                    <strong className="text-ink">
                      {inspectChat.userEmail || inspectChat.userName || inspectChat.userId || "Guest"}
                    </strong>
                  </span>
                  <span>•</span>
                  <span>
                    Model: <strong className="text-ink">{inspectChat.model}</strong>
                  </span>
                  <span>•</span>
                  <span>
                    Effort: <strong className="text-ink uppercase">{inspectChat.effort}</strong>
                  </span>
                  <span>•</span>
                  <span>
                    Created:{" "}
                    {new Date(inspectChat.createdAt).toLocaleString(undefined, {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setInspectChat(null)}
                className="rounded-lg p-1.5 text-muted hover:text-ink hover:bg-hover transition-colors"
                title="Close inspector"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body / Conversation Transcript */}
            <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
              {inspectLoading ? (
                <div className="py-16 text-center text-muted">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-accent" />
                  Loading complete conversation transcript...
                </div>
              ) : (() => {
                const msgs = (fullChat?.messages || inspectChat.messages || []) as Message[];
                if (msgs.length === 0) {
                  return (
                    <div className="py-12 text-center text-muted">
                      No turns recorded in this conversation yet.
                    </div>
                  );
                }

                return msgs.map((m, idx) => {
                  const isUser = m.role === "user";
                  return (
                    <div
                      key={m.id || idx}
                      className={`p-4 rounded-xl border ${
                        isUser
                          ? "bg-app/70 border-line text-ink"
                          : "bg-card border-line/80 shadow-sm"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-2 pb-2 border-b border-line/40">
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold ${
                              isUser
                                ? "bg-muted/20 text-ink"
                                : "bg-accent-soft text-accent"
                            }`}
                          >
                            {isUser ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
                          </span>
                          <span className="font-semibold text-xs text-ink">
                            {isUser ? "User Message" : "RoleFlow Assistant"}
                          </span>
                          <span className="text-[10px] text-muted">Turn #{idx + 1}</span>
                        </div>

                        {m.createdAt && (
                          <span className="text-[10px] text-muted font-mono">
                            {new Date(m.createdAt).toLocaleTimeString()}
                          </span>
                        )}
                      </div>

                      {/* Message Content */}
                      <div className="text-sm leading-relaxed whitespace-pre-wrap font-sans text-ink">
                        {m.content}
                      </div>

                      {/* Artifact Banner if present */}
                      {m.artifact && (
                        <div className="mt-3 p-3 rounded-lg bg-accent-soft/40 border border-accent/20">
                          <div className="flex items-center gap-2 text-xs font-semibold text-accent">
                            <Code className="w-4 h-4" />
                            <span>Generated Artifact: {m.artifact.title}</span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-accent/20 font-mono">
                              {m.artifact.primaryLanguage}
                            </span>
                          </div>
                          {m.artifact.files && m.artifact.files[0]?.content && (
                            <pre className="mt-2 p-2.5 rounded bg-app font-mono text-[11px] text-ink overflow-x-auto max-h-40">
                              {m.artifact.files[0].content.slice(0, 500)}
                              {m.artifact.files[0].content.length > 500 ? "\n... (truncated in preview)" : ""}
                            </pre>
                          )}
                        </div>
                      )}

                      {/* Reasoning / Metadata if present */}
                      {m.meta && (
                        <div className="mt-2 text-[10px] text-muted flex items-center gap-3 font-mono">
                          {m.meta.latencyMs !== undefined && (
                            <span>Latency: {m.meta.latencyMs}ms</span>
                          )}
                          {m.meta.promptTokens !== undefined && (
                            <span>Prompt Tokens: {m.meta.promptTokens}</span>
                          )}
                          {m.meta.completionTokens !== undefined && (
                            <span>Completion Tokens: {m.meta.completionTokens}</span>
                          )}
                          {m.meta.totalTokens !== undefined && (
                            <span>Total Tokens: {m.meta.totalTokens}</span>
                          )}
                        </div>
                      )}
                    </div>
                  );
                });
              })()}
            </div>

            {/* Modal Footer / Action Toolbar */}
            <div className="flex items-center justify-between gap-3 p-4 border-t border-line bg-app/50">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    handleCopy(
                      JSON.stringify(fullChat || inspectChat, null, 2),
                      "json"
                    )
                  }
                  className={secondaryButtonClass}
                  title="Copy complete raw chat JSON for bug reproduction"
                >
                  {copiedType === "json" ? (
                    <Check className="w-3.5 h-3.5 text-success" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                  <span>{copiedType === "json" ? "Copied JSON" : "Copy Raw JSON"}</span>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    handleCopy(
                      generateMarkdownTranscript(fullChat || inspectChat),
                      "markdown"
                    )
                  }
                  className={secondaryButtonClass}
                  title="Copy formatted Markdown transcript for support tickets"
                >
                  {copiedType === "markdown" ? (
                    <Check className="w-3.5 h-3.5 text-success" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                  <span>{copiedType === "markdown" ? "Copied Markdown" : "Copy Markdown"}</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => setInspectChat(null)}
                className={secondaryButtonClass}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminChatsPanel;
