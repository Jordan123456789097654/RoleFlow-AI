"use client";

import React, { useState } from "react";
import {
  Copy,
  Check,
  ThumbsUp,
  ThumbsDown,
  RotateCw,
  Edit2,
  Code2,
  FileText,
  ChevronRight,
  Brain,
  Terminal,
  ShieldAlert,
} from "lucide-react";
import { Message, Artifact } from "@/types";

interface MessageItemProps {
  message: Message;
  onEdit?: (messageId: string, newContent: string) => void;
  onRegenerate?: () => void;
  onOpenArtifact?: (artifact: Artifact) => void;
}

export const MessageItem: React.FC<MessageItemProps> = ({
  message,
  onEdit,
  onRegenerate,
  onOpenArtifact,
}) => {
  const isUser = message.role === "user";
  const isBlocked = Boolean(message.moderationBlocked);

  const [copied, setCopied] = useState(false);
  const [copiedCodeIdx, setCopiedCodeIdx] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<"up" | "down" | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content);
  const [isThinkingOpen, setIsThinkingOpen] = useState(false);

  // Moderation Appeal State
  const [isAppealing, setIsAppealing] = useState(false);
  const [appealText, setAppealText] = useState("");
  const [appealSubmitted, setAppealSubmitted] = useState(message.appealStatus === "APPEALED");
  const [isSubmittingAppeal, setIsSubmittingAppeal] = useState(false);
  const [appealError, setAppealError] = useState<string | null>(null);

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyCode = (code: string, idx: number) => {
    navigator.clipboard.writeText(code);
    setCopiedCodeIdx(idx);
    setTimeout(() => setCopiedCodeIdx(null), 2000);
  };

  const handleSaveEdit = () => {
    if (onEdit && editContent.trim() && editContent !== message.content) {
      onEdit(message.id, editContent.trim());
    }
    setIsEditing(false);
  };

  const handleSubmitAppeal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!appealText.trim() || !message.moderationLogId) return;
    setIsSubmittingAppeal(true);
    setAppealError(null);
    try {
      const res = await fetch("/api/moderation/appeal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          logId: message.moderationLogId,
          appealNote: appealText.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to submit appeal");
      setAppealSubmitted(true);
      setIsAppealing(false);
    } catch (err: any) {
      setAppealError(err.message || "Failed to submit appeal");
    } finally {
      setIsSubmittingAppeal(false);
    }
  };

  // Sleek Safety & Moderation Refusal Card
  if (isBlocked) {
    const isTier1 = message.moderationTier === 1;
    return (
      <div className="w-full max-w-3xl mx-auto py-5 px-4 animate-message">
        <div
          className={`rounded-2xl border p-5 sm:p-6 shadow-xl transition-all ${
            isTier1
              ? "border-red-500/50 bg-gradient-to-b from-[#201212]/90 via-[#181111]/90 to-[#141413] shadow-red-950/20"
              : "border-amber-500/50 bg-gradient-to-b from-[#201912]/90 via-[#181511]/90 to-[#141413] shadow-amber-950/20"
          }`}
        >
          {/* Header Row */}
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex items-center gap-2.5">
              <div
                className={`p-2 rounded-xl ${
                  isTier1
                    ? "bg-red-500/10 text-red-400 border border-red-500/20"
                    : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                }`}
              >
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-[#f4f4f0] flex items-center gap-2">
                  {isTier1 ? "Trust & Safety Enforcement" : "Content Policy Warning"}
                </h4>
                <p className="text-xs text-[#9b9a97]">
                  {isTier1
                    ? "Request blocked under zero-tolerance safety policies"
                    : "Request refused in accordance with acceptable use guidelines"}
                </p>
              </div>
            </div>

            <div className="shrink-0">
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono font-semibold tracking-wider ${
                  isTier1
                    ? "bg-red-500/20 text-red-400 border border-red-500/30"
                    : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    isTier1 ? "bg-red-400 animate-pulse" : "bg-amber-400"
                  }`}
                />
                {isTier1 ? "CRITICAL TIER 1" : "TIER 2"}
              </span>
            </div>
          </div>

          {/* Refusal Text */}
          <div className="text-sm text-[#e4e3de] leading-relaxed my-3 pl-1 font-sans">
            {message.content}
          </div>

          {/* Incident Details Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-3 mt-3 border-t border-white/5 text-xs text-[#888782]">
            <div className="flex items-center gap-2">
              {message.moderationCategory && (
                <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-black/40 border border-white/10 text-[#c5c4be]">
                  {message.moderationCategory}
                </span>
              )}
              {message.moderationLogId && (
                <span className="font-mono text-[11px] text-[#71717a]">
                  ID: {message.moderationLogId}
                </span>
              )}
            </div>

            <div className="flex items-center gap-3">
              <a
                href="/acceptable-use"
                target="_blank"
                rel="noreferrer"
                className="hover:text-[#f4f4f0] underline transition-colors"
              >
                Acceptable Use Policy
              </a>

              {/* Appeal action button / status */}
              {message.canAppeal && (
                <div>
                  {appealSubmitted ? (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium text-xs">
                      <Check className="w-3.5 h-3.5" />
                      Review Requested
                    </span>
                  ) : !isAppealing ? (
                    <button
                      type="button"
                      onClick={() => setIsAppealing(true)}
                      className="px-3 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-[#f4f4f0] font-medium transition-colors border border-white/10 hover:border-white/20 shadow-sm"
                    >
                      Request Review
                    </button>
                  ) : null}
                </div>
              )}
            </div>
          </div>

          {/* Expanded Inline Appeal Form */}
          {isAppealing && !appealSubmitted && (
            <form onSubmit={handleSubmitAppeal} className="mt-4 pt-3 border-t border-white/10 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-[#c5c4be]">
                  Submit Request for Administrative Review
                </span>
                <span className="text-[11px] text-[#888782]">
                  Reviewed by RoleFlow Trust & Safety
                </span>
              </div>
              <textarea
                value={appealText}
                onChange={(e) => setAppealText(e.target.value)}
                rows={3}
                placeholder="Explain the technical or benign research context of your request..."
                required
                className="w-full bg-[#141413] text-xs text-[#f4f4f0] placeholder-[#71717a] p-3 rounded-xl border border-white/10 focus:outline-none focus:border-amber-500/60 resize-none leading-relaxed"
              />
              {appealError && (
                <div className="text-xs text-red-400">{appealError}</div>
              )}
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAppealing(false)}
                  className="px-3 py-1.5 rounded-lg text-xs text-[#9b9a97] hover:text-[#f4f4f0] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingAppeal || !appealText.trim()}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-[#f4f4f0] hover:bg-white text-[#141413] transition-colors shadow disabled:opacity-50"
                >
                  {isSubmittingAppeal ? "Submitting..." : "Submit Appeal"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    );
  }

  // User Message
  if (isUser) {
    return (
      <div className="group w-full max-w-3xl mx-auto py-3 px-4 flex justify-end animate-message">
        <div className="max-w-[85%] flex flex-col items-end">
          {message.attachments && message.attachments.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-2 justify-end">
              {message.attachments.map((att, i) => (
                <div
                  key={i}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#222120] border border-[#33312e] text-xs text-[#e4e4e7] shadow-sm"
                >
                  <FileText className="w-3.5 h-3.5 text-[#d97706]" />
                  <span className="truncate max-w-[150px] font-mono">{att.name}</span>
                </div>
              ))}
            </div>
          )}

          {isEditing ? (
            <div className="w-full min-w-[340px] bg-[#1f1e1d] p-3.5 rounded-2xl border border-[#3b3a37] shadow-xl">
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="w-full bg-transparent text-[#f4f4f0] text-sm focus:outline-none resize-none min-h-[80px] leading-relaxed"
                rows={3}
              />
              <div className="flex items-center justify-end gap-2 mt-2 pt-2 border-t border-[#2e2d2b]">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-3 py-1.5 text-xs text-[#999894] hover:text-[#f4f4f0] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveEdit}
                  className="px-3.5 py-1.5 text-xs font-semibold bg-[#f4f4f0] text-[#141413] rounded-xl hover:bg-white transition-all shadow"
                >
                  Save & Submit
                </button>
              </div>
            </div>
          ) : (
            <div className="relative group/bubble flex items-center gap-2">
              {onEdit && (
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="opacity-0 group-hover/bubble:opacity-100 p-1.5 text-[#888783] hover:text-[#f4f4f0] hover:bg-[#222120] rounded-lg transition-all"
                  title="Edit message"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
              )}
              <div className="bg-[#242322] text-[#f4f4f0] px-4 py-2.5 rounded-2xl text-[14.5px] leading-relaxed border border-[#353330] shadow-sm select-text">
                {message.content}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Parse code blocks in assistant response
  const renderFormattedContent = (content: string) => {
    const parts = content.split(/(```[\s\S]*?```)/g);

    return parts.map((part, idx) => {
      if (part.startsWith("```") && part.endsWith("```")) {
        const lines = part.slice(3, -3).trim().split("\n");
        const language = lines[0].trim().toLowerCase() || "code";
        const code = lines.slice(1).join("\n");

        return (
          <div key={idx} className="my-4 rounded-xl border border-[#2e2d2b] bg-[#11100f] overflow-hidden shadow-md">
            <div className="h-9 px-3.5 bg-[#1a1918] border-b border-[#2a2927] flex items-center justify-between text-xs text-[#999894]">
              <div className="flex items-center gap-2">
                <Terminal className="w-3.5 h-3.5 text-[#d97706]" />
                <span className="font-mono text-[11px] font-medium text-[#c5c4be]">{language}</span>
              </div>
              <button
                type="button"
                onClick={() => handleCopyCode(code, idx)}
                className="flex items-center gap-1.5 px-2 py-1 rounded hover:bg-[#242322] text-[#999894] hover:text-[#f4f4f0] transition-colors"
              >
                {copiedCodeIdx === idx ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
                <span className="text-[11px]">{copiedCodeIdx === idx ? "Copied" : "Copy code"}</span>
              </button>
            </div>
            <pre className="p-4 text-xs font-mono text-[#e4e4e7] overflow-x-auto leading-relaxed select-text">
              <code>{code}</code>
            </pre>
          </div>
        );
      }

      return (
        <span key={idx} className="whitespace-pre-wrap">
          {part}
        </span>
      );
    });
  };

  // Assistant Message
  return (
    <div className="w-full max-w-3xl mx-auto py-5 px-4 animate-message">
      <div className="space-y-4">
        {/* Thinking Accordion (Claude/Reasoning luxury style) */}
        {message.thinking && (
          <div className="rounded-xl border border-[#2c2b29] bg-[#1a1918]/60 overflow-hidden">
            <button
              type="button"
              onClick={() => setIsThinkingOpen(!isThinkingOpen)}
              className="w-full flex items-center justify-between px-3.5 py-2 text-xs font-medium text-[#8f8e8a] hover:text-[#f4f4f0] transition-colors select-none"
            >
              <div className="flex items-center gap-2">
                <Brain className="w-3.5 h-3.5 text-[#d97706]" />
                <span>Reasoning Process</span>
              </div>
              <ChevronRight
                className={`w-3.5 h-3.5 transition-transform duration-200 ${
                  isThinkingOpen ? "rotate-90 text-[#f4f4f0]" : "text-[#777672]"
                }`}
              />
            </button>

            {isThinkingOpen && (
              <div className="px-4 pb-3.5 pt-1 text-[12.5px] font-sans text-[#8f8e8a] leading-relaxed border-t border-[#262523] bg-[#141413]/50">
                <div className="border-l-2 border-[#d97706]/40 pl-3 py-1 whitespace-pre-wrap font-mono text-xs">
                  {message.thinking}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Editorial Claude Typography */}
        <div className="font-claude-serif text-[15.5px] leading-[1.75] text-[#ebebe5] select-text">
          {renderFormattedContent(message.content)}
        </div>

        {/* Artifact Slideout Card */}
        {message.artifact && (
          <div
            onClick={() => onOpenArtifact && onOpenArtifact(message.artifact!)}
            className="cursor-pointer group/art flex items-center justify-between p-3.5 rounded-2xl bg-[#1d1c1b] border border-[#2f2e2c] hover:border-[#d97706]/70 transition-all duration-200 shadow-md hover:shadow-lg"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#262523] border border-[#383734] flex items-center justify-center text-[#d97706] group-hover/art:scale-105 transition-transform">
                <Code2 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-medium text-[#f4f4f0] group-hover/art:text-[#f59e0b] transition-colors">
                  {message.artifact.title}
                </h4>
                <span className="text-xs text-[#8f8e8a]">
                  Click to open code & live preview
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-[#d97706] font-medium pr-2">
              <span>View</span>
              <ChevronRight className="w-4 h-4 group-hover/art:translate-x-0.5 transition-transform" />
            </div>
          </div>
        )}

        {/* Claude Action Row: Copy, Thumbs Up, Thumbs Down, Regenerate */}
        <div className="flex items-center gap-1.5 pt-1 text-[#807f7b]">
          <button
            type="button"
            onClick={handleCopy}
            className="p-1.5 rounded-lg hover:text-[#f4f4f0] hover:bg-[#222120] transition-colors"
            title="Copy response"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
          </button>

          <button
            type="button"
            onClick={() => setFeedback(feedback === "up" ? null : "up")}
            className={`p-1.5 rounded-lg hover:bg-[#222120] transition-colors ${
              feedback === "up" ? "text-emerald-400" : "hover:text-[#f4f4f0]"
            }`}
            title="Good response"
          >
            <ThumbsUp className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => setFeedback(feedback === "down" ? null : "down")}
            className={`p-1.5 rounded-lg hover:bg-[#222120] transition-colors ${
              feedback === "down" ? "text-rose-400" : "hover:text-[#f4f4f0]"
            }`}
            title="Bad response"
          >
            <ThumbsDown className="w-4 h-4" />
          </button>

          {onRegenerate && (
            <button
              type="button"
              onClick={onRegenerate}
              className="p-1.5 rounded-lg hover:text-[#f4f4f0] hover:bg-[#222120] transition-colors"
              title="Regenerate"
            >
              <RotateCw className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
