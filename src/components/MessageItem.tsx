"use client";

import React, { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  Copy,
  Check,
  ThumbsUp,
  ThumbsDown,
  RotateCw,
  Pencil,
  Code2,
  FileText,
  ChevronRight,
  ShieldAlert,
  Download,
  GitBranch,
  Volume2,
  Square,
} from "lucide-react";
import { Message, Artifact } from "@/types";
import { toast } from "@/lib/toast";

interface MessageItemProps {
  message: Message;
  onEdit?: (messageId: string, newContent: string) => void;
  onRegenerate?: () => void;
  onOpenArtifact?: (artifact: Artifact) => void;
  /** Starts a new chat with the conversation up to and including this message. */
  onBranch?: (messageId: string) => void;
  isStreaming?: boolean;
}

/** Plain text for speech: drops code blocks, link targets and Markdown symbols. */
function speakableText(markdown: string): string {
  return markdown
    .replace(/```[\s\S]*?```/g, " Code block omitted. ")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/[`*_#>|~]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

const iconButton =
  "p-2 rounded-lg text-muted hover:text-ink hover:bg-hover transition-colors duration-150 outline-none focus-visible:ring-2 focus-visible:ring-accent/40";

/** Fenced code block with its own copy state, so each block shows its own "Copied" feedback. */
const CodeBlock: React.FC<{ code: string; language: string }> = ({ code, language }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="my-4 rounded-xl border border-line bg-panel overflow-hidden">
      <div className="h-9 px-3.5 flex items-center justify-between border-b border-line">
        <span className="font-mono text-xs text-muted">{language}</span>
        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-2 py-1 rounded-md text-xs text-muted hover:text-ink hover:bg-hover transition-colors duration-150 outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
        >
          {copied ? <Check className="w-3.5 h-3.5" strokeWidth={2} /> : <Copy className="w-3.5 h-3.5" strokeWidth={1.75} />}
          <span>{copied ? "Copied" : "Copy code"}</span>
        </button>
      </div>
      <pre className="p-4 text-[13px] font-mono text-ink overflow-x-auto leading-relaxed select-text">
        <code>{code}</code>
      </pre>
    </div>
  );
};

export const MessageItem: React.FC<MessageItemProps> = ({
  message,
  onEdit,
  onRegenerate,
  onOpenArtifact,
  onBranch,
  isStreaming = false,
}) => {
  const isUser = message.role === "user";
  const isBlocked = Boolean(message.moderationBlocked);

  const [copied, setCopied] = useState(false);
  const [canSpeak, setCanSpeak] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const speakingRef = useRef(false);
  const [feedback, setFeedback] = useState<"up" | "down" | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content);

  // Moderation appeal state
  const [isAppealing, setIsAppealing] = useState(false);
  const [appealText, setAppealText] = useState("");
  const [appealSubmitted, setAppealSubmitted] = useState(message.appealStatus === "APPEALED");
  const [isSubmittingAppeal, setIsSubmittingAppeal] = useState(false);
  const [appealError, setAppealError] = useState<string | null>(null);

  useEffect(() => {
    setCanSpeak(typeof window !== "undefined" && "speechSynthesis" in window);
    // Stop reading if this reply leaves the screen while it is being read.
    return () => {
      if (speakingRef.current && typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content).then(
      () => toast("Copied to clipboard", "success"),
      () => toast("Copy failed. Select the text and copy it instead.", "error")
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSpeak = () => {
    if (!canSpeak) return;
    const synth = window.speechSynthesis;
    if (speaking) {
      synth.cancel();
      speakingRef.current = false;
      setSpeaking(false);
      return;
    }
    const utterance = new SpeechSynthesisUtterance(speakableText(message.content));
    const finish = () => {
      speakingRef.current = false;
      setSpeaking(false);
    };
    utterance.onend = finish;
    utterance.onerror = finish;
    synth.cancel();
    synth.speak(utterance);
    speakingRef.current = true;
    setSpeaking(true);
  };

  /** Generation stats for power users. Token counts and speed are shown; the backend model is not. */
  const statsLine = (() => {
    const meta = message.meta;
    if (!meta) return null;
    const parts: string[] = [`${(meta.latencyMs / 1000).toFixed(1)}s`];
    if (typeof meta.totalTokens === "number") {
      parts.push(`${meta.promptTokens ?? "?"} in · ${meta.completionTokens ?? "?"} out tokens`);
    }
    if (typeof meta.tokensPerSecond === "number") parts.push(`${meta.tokensPerSecond} tok/s`);
    return parts.join(" · ");
  })();

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

  // Safety and moderation notice. Tier 1 is a hard block, tier 2 is a refusal with a warning.
  if (isBlocked) {
    const isTier1 = message.moderationTier === 1;
    return (
      <div className="w-full max-w-3xl mx-auto px-4 sm:px-6 py-4 animate-message">
        <div className={`rounded-xl border p-5 sm:p-6 bg-card ${isTier1 ? "border-danger/40" : "border-accent/40"}`}>
          <div className="flex items-start gap-3">
            <div className={`p-2 rounded-lg shrink-0 ${isTier1 ? "bg-danger-soft text-danger" : "bg-accent-soft text-accent"}`}>
              <ShieldAlert className="w-[18px] h-[18px]" strokeWidth={1.75} />
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="text-sm font-medium text-ink">
                {isTier1 ? "Blocked under our safety policy" : "Request declined"}
              </h4>
              <p className="text-xs text-muted mt-0.5">
                {isTier1
                  ? "This request violates our zero-tolerance policies."
                  : "This request was refused under our acceptable use guidelines."}
              </p>
            </div>
          </div>

          <div className="text-sm text-ink leading-relaxed mt-4">{message.content}</div>

          <div className="flex flex-wrap items-center justify-between gap-2 mt-4 pt-3 border-t border-line text-xs text-muted">
            <div className="flex items-center gap-2 min-w-0">
              {message.moderationCategory && (
                <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-hover text-ink/80">
                  {message.moderationCategory}
                </span>
              )}
              {message.moderationLogId && (
                <span className="font-mono text-[11px] truncate">Reference: {message.moderationLogId}</span>
              )}
            </div>

            <div className="flex items-center gap-3">
              <a
                href="/acceptable-use"
                target="_blank"
                rel="noreferrer"
                className="underline underline-offset-2 hover:text-ink transition-colors duration-150"
              >
                Acceptable use policy
              </a>

              {message.canAppeal && (
                <div>
                  {appealSubmitted ? (
                    <span className="inline-flex items-center gap-1 min-h-[32px] px-2.5 rounded-lg bg-hover text-ink font-medium">
                      <Check className="w-3.5 h-3.5" strokeWidth={2} />
                      Review requested
                    </span>
                  ) : !isAppealing ? (
                    <button
                      type="button"
                      onClick={() => setIsAppealing(true)}
                      className="min-h-[32px] px-3 rounded-lg bg-hover text-ink font-medium hover:opacity-80 transition-opacity duration-150"
                    >
                      Request review
                    </button>
                  ) : null}
                </div>
              )}
            </div>
          </div>

          {isAppealing && !appealSubmitted && (
            <form onSubmit={handleSubmitAppeal} className="mt-4 pt-4 border-t border-line space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-sm font-medium text-ink">Request an administrative review</span>
                <span className="text-xs text-muted">Reviewed by RoleFlow trust and safety</span>
              </div>
              <textarea
                value={appealText}
                onChange={(e) => setAppealText(e.target.value)}
                rows={3}
                placeholder="Explain the context of your request, such as research or a technical use."
                required
                className="w-full bg-app text-sm text-ink placeholder:text-muted p-3 rounded-lg border border-line outline-none focus:border-accent/50 focus-visible:ring-2 focus-visible:ring-accent/30 resize-none leading-relaxed transition-colors duration-150"
              />
              {appealError && <div className="text-xs text-danger">{appealError}</div>}
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAppealing(false)}
                  className="min-h-[36px] px-3 rounded-lg text-sm text-muted hover:text-ink hover:bg-hover transition-colors duration-150"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingAppeal || !appealText.trim()}
                  className="min-h-[36px] px-4 rounded-lg text-sm font-medium bg-ink text-app hover:opacity-90 transition-opacity duration-150 disabled:opacity-50"
                >
                  {isSubmittingAppeal ? "Submitting..." : "Submit appeal"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    );
  }

  // User message
  if (isUser) {
    return (
      <div className="group w-full max-w-3xl mx-auto px-4 sm:px-6 py-3 animate-message">
        <div className="flex flex-col items-end">
          {message.attachments && message.attachments.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-2 justify-end max-w-[85%]">
              {message.attachments.map((att, i) => {
                // Text attachments (including extracted PDF, Word and Excel text) get a preview.
                // Image and original binary data do not.
                const previewable = !att.content.startsWith("data:");
                return (
                  <details
                    key={i}
                    className="max-w-full rounded-lg bg-card border border-line text-xs text-ink"
                  >
                    <summary className="flex items-center gap-1.5 px-2.5 py-1.5 cursor-pointer list-none select-none">
                      <FileText className="w-3.5 h-3.5 text-accent shrink-0" strokeWidth={1.75} />
                      <span className="truncate max-w-[150px] font-mono">{att.name}</span>
                      {previewable && <span className="text-muted">Preview</span>}
                    </summary>
                    {previewable && (
                      <pre className="px-3 pb-3 pt-2 mx-0 max-h-48 max-w-[min(28rem,80vw)] overflow-auto whitespace-pre-wrap break-words font-mono text-[11px] leading-relaxed text-muted border-t border-line">
                        {att.content.slice(0, 1500)}
                        {att.content.length > 1500 ? "\n…" : ""}
                      </pre>
                    )}
                  </details>
                );
              })}
            </div>
          )}

          {isEditing ? (
            <div className="w-full sm:w-[min(32rem,85%)] bg-card p-3.5 rounded-2xl border border-line shadow-composer">
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="w-full bg-transparent text-[16px] text-ink outline-none resize-none min-h-[72px] leading-relaxed"
                rows={3}
                aria-label="Edit message"
              />
              <div className="flex items-center justify-end gap-2 mt-2 pt-2 border-t border-line">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="min-h-[36px] px-3 rounded-lg text-sm text-muted hover:text-ink hover:bg-hover transition-colors duration-150"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveEdit}
                  className="min-h-[36px] px-4 rounded-lg text-sm font-medium bg-ink text-app hover:opacity-90 transition-opacity duration-150"
                >
                  Save and submit
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 max-w-[85%]">
              {onEdit && (
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="opacity-100 md:opacity-0 md:group-hover:opacity-100 focus-visible:opacity-100 p-2 rounded-lg text-muted hover:text-ink hover:bg-hover transition-all duration-150 outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
                  title="Edit message"
                  aria-label="Edit message"
                >
                  <Pencil className="w-4 h-4" strokeWidth={1.75} />
                </button>
              )}
              <div className="bg-panel text-ink border border-line border-l-2 border-l-accent px-4 py-3 rounded-md text-[16px] leading-relaxed whitespace-pre-wrap break-words select-text">
                {message.content}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Assistant message: Markdown rendered on the canvas, no bubble
  const renderFormattedContent = (content: string) => (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        table: ({ node, ...props }) => (
          <div className="my-4 overflow-x-auto rounded-lg border border-line">
            <table className="w-full text-left text-sm border-collapse" {...props} />
          </div>
        ),
        thead: ({ node, ...props }) => <thead className="bg-panel" {...props} />,
        th: ({ node, ...props }) => (
          <th className="px-3.5 py-2 font-medium text-ink border-b border-line" {...props} />
        ),
        td: ({ node, ...props }) => (
          <td className="px-3.5 py-2 text-ink/90 border-b border-line last:border-b-0 align-top" {...props} />
        ),
        h1: ({ node, ...props }) => <h1 className="font-display text-2xl text-ink mt-6 mb-3" {...props} />,
        h2: ({ node, ...props }) => <h2 className="font-display text-xl text-ink mt-6 mb-2.5" {...props} />,
        h3: ({ node, ...props }) => <h3 className="font-display text-lg text-ink mt-5 mb-2" {...props} />,
        h4: ({ node, ...props }) => <h4 className="text-base font-medium text-ink mt-4 mb-2" {...props} />,
        p: ({ node, ...props }) => <p className="mb-4 last:mb-0" {...props} />,
        ul: ({ node, ...props }) => <ul className="list-disc pl-6 my-3 space-y-1.5 marker:text-muted" {...props} />,
        ol: ({ node, ...props }) => <ol className="list-decimal pl-6 my-3 space-y-1.5 marker:text-muted" {...props} />,
        li: ({ node, ...props }) => <li className="pl-1 leading-relaxed" {...props} />,
        blockquote: ({ node, ...props }) => (
          <blockquote className="border-l-2 border-accent pl-4 my-4 text-muted" {...props} />
        ),
        hr: ({ node, ...props }) => <hr className="my-6 border-line" {...props} />,
        strong: ({ node, ...props }) => <strong className="font-semibold text-ink" {...props} />,
        em: ({ node, ...props }) => <em className="italic" {...props} />,
        a: ({ node, ...props }) => (
          <a
            className="text-accent underline underline-offset-[3px] hover:text-accent-hover transition-colors duration-150"
            target="_blank"
            rel="noopener noreferrer"
            {...props}
          />
        ),
        code: ({ node, inline, className, children, ...props }: any) => {
          const match = /language-(\w+)/.exec(className || "");
          const isInline = inline || (!match && !String(children).includes("\n"));

          if (isInline) {
            return (
              <code className="px-1.5 py-0.5 rounded-md bg-hover font-mono text-[0.875em]" {...props}>
                {children}
              </code>
            );
          }

          const language = match ? match[1] : "code";
          const codeString = String(children).replace(/\n$/, "");
          return <CodeBlock code={codeString} language={language} />;
        },
      }}
    >
      {content}
    </ReactMarkdown>
  );

  return (
    <div className="w-full max-w-3xl mx-auto px-4 sm:px-6 py-4 animate-message">
      {typeof message.thinkingTime === "number" && (
        <div className="mb-2 text-xs text-muted select-none">
          Thought for {Number(message.thinkingTime).toFixed(1)}s
        </div>
      )}

      <div className="prose-rf text-ink text-[16px] select-text">
        {renderFormattedContent(message.content)}
        {isStreaming && (
          <span className="inline-block w-[2px] h-[1.05em] ml-0.5 align-[-0.15em] bg-accent animate-pulse rounded-full" />
        )}
      </div>

      {message.stopped && (
        <div className="mt-2 text-xs text-muted select-none">Stopped before it finished.</div>
      )}

      {message.sources && message.sources.length > 0 && (
        <div className="mt-4 max-w-xl">
          <div className="text-xs font-medium text-muted mb-1.5">Sources</div>
          <ol className="space-y-1.5">
            {message.sources.map((source, i) => (
              <li key={source.url} className="flex gap-2 text-sm min-w-0">
                <span className="text-xs text-muted w-4 shrink-0 pt-0.5">{i + 1}.</span>
                <a
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                  className="text-accent hover:underline truncate min-w-0"
                  title={source.url}
                >
                  {source.title}
                </a>
              </li>
            ))}
          </ol>
        </div>
      )}

      {statsLine && !isStreaming && (
        <div className="mt-2 text-[11px] text-muted font-mono select-none" title="Generation stats">
          {statsLine}
        </div>
      )}

      {message.generatedFiles && message.generatedFiles.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-4">
          {message.generatedFiles.map((f, i) => (
            <a
              key={i}
              href={f.dataUrl}
              download={f.name}
              className="flex items-center gap-2 min-h-[40px] px-3 rounded-lg bg-card border border-line hover:bg-hover transition-colors duration-150 text-sm text-ink"
            >
              <FileText className="w-4 h-4 text-accent shrink-0" strokeWidth={1.75} />
              <span className="font-mono text-xs">{f.name}</span>
              <span className="text-xs text-muted">{Math.max(1, Math.round(f.size / 1024))} KB</span>
              <Download className="w-3.5 h-3.5 text-muted" strokeWidth={1.75} />
            </a>
          ))}
        </div>
      )}

      {message.artifact && (
        <button
          type="button"
          onClick={() => onOpenArtifact && onOpenArtifact(message.artifact!)}
          className="group mt-4 w-full max-w-md flex items-center justify-between gap-3 p-3 rounded-xl bg-card border border-line hover:bg-hover transition-colors duration-150 text-left outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-lg bg-accent-soft flex items-center justify-center shrink-0">
              <Code2 className="w-5 h-5 text-accent" strokeWidth={1.75} />
            </div>
            <div className="min-w-0">
              <div className="text-sm font-medium text-ink truncate">{message.artifact.title}</div>
              <div className="text-xs text-muted">Open code and live preview</div>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-muted shrink-0 group-hover:translate-x-0.5 transition-transform duration-150" strokeWidth={1.75} />
        </button>
      )}

      {/* Action row */}
      <div className="flex items-center gap-0.5 mt-2 -ml-2 text-muted">
        <button type="button" onClick={handleCopy} className={iconButton} title="Copy" aria-label="Copy">
          {copied ? <Check className="w-4 h-4 text-accent" strokeWidth={2} /> : <Copy className="w-4 h-4" strokeWidth={1.75} />}
        </button>

        {canSpeak && (
          <button
            type="button"
            onClick={handleSpeak}
            className={`${iconButton} ${speaking ? "text-accent" : ""}`}
            title={speaking ? "Stop reading" : "Read aloud"}
            aria-label={speaking ? "Stop reading" : "Read aloud"}
            aria-pressed={speaking}
          >
            {speaking ? <Square className="w-3.5 h-3.5 fill-current" strokeWidth={2} /> : <Volume2 className="w-4 h-4" strokeWidth={1.75} />}
          </button>
        )}

        {onBranch && (
          <button
            type="button"
            onClick={() => onBranch(message.id)}
            className={iconButton}
            title="Branch into a new chat"
            aria-label="Branch into a new chat"
          >
            <GitBranch className="w-4 h-4" strokeWidth={1.75} />
          </button>
        )}

        <button
          type="button"
          onClick={() => setFeedback(feedback === "up" ? null : "up")}
          className={`${iconButton} ${feedback === "up" ? "text-accent" : ""}`}
          title="Helpful"
          aria-label="Helpful"
          aria-pressed={feedback === "up"}
        >
          <ThumbsUp className="w-4 h-4" strokeWidth={1.75} />
        </button>

        <button
          type="button"
          onClick={() => setFeedback(feedback === "down" ? null : "down")}
          className={`${iconButton} ${feedback === "down" ? "text-danger" : ""}`}
          title="Not helpful"
          aria-label="Not helpful"
          aria-pressed={feedback === "down"}
        >
          <ThumbsDown className="w-4 h-4" strokeWidth={1.75} />
        </button>

        {onRegenerate && (
          <button type="button" onClick={onRegenerate} className={iconButton} title="Try again" aria-label="Try again">
            <RotateCw className="w-4 h-4" strokeWidth={1.75} />
          </button>
        )}
      </div>
    </div>
  );
};
