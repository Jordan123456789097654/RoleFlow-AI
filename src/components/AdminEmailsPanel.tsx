"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, Eye, History, Mail, Pencil, RefreshCw, Search, Send, Sparkles, Wand2, X } from "lucide-react";
import {
  EMAIL_TEMPLATES,
  EMAIL_TEMPLATE_CATEGORIES,
  EmailTemplate,
  EmailTemplateCategoryId,
  getCategoryLabel,
  searchEmailTemplates,
} from "@/lib/email-templates";
import {
  DEFAULT_APP_URL,
  SAMPLE_PLACEHOLDER_VALUES,
  renderPlaceholders,
  wrapEmailInBrandedTemplate,
} from "@/lib/email-template-html";
import type { EmailBroadcastLog, EmailTargetType } from "@/types";

/** Keep in sync with BROADCAST_CONFIRM_PHRASE in src/lib/email-broadcast.ts. */
const CONFIRM_PHRASE = "CONFIRM BROADCAST";
const TONES = ["Urgent & Serious", "Official & Legal", "Warm & Friendly", "Excited & Bold", "Direct & Concise"];

const focusRing = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40";
const inputClass = `w-full rounded-xl border border-line bg-app px-3.5 py-2.5 text-sm text-ink placeholder:text-muted/70 focus:outline-none focus:border-accent/60 transition-colors ${focusRing}`;
const labelClass = "mb-1.5 block text-xs font-medium uppercase tracking-wide text-muted";
const primaryButtonClass = `inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2 text-sm font-medium text-on-accent transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-50 ${focusRing}`;
const secondaryButtonClass = `inline-flex items-center gap-1.5 rounded-xl border border-line bg-card px-3 py-1.5 text-xs font-medium text-ink transition-colors hover:bg-hover disabled:cursor-not-allowed disabled:opacity-50 ${focusRing}`;
const cardClass = "rounded-2xl border border-line bg-card";

type Audience = "broadcast" | "single" | "test";

interface ComposerState {
  subject: string;
  body: string;
  emoji: string;
  templateId: string | null;
  ctaText: string;
  ctaUrl: string;
  date: string;
  incidentId: string;
  actionUrl: string;
  recipientName: string;
}

const EMPTY_FORM: ComposerState = {
  subject: "",
  body: "",
  emoji: "",
  templateId: null,
  ctaText: "",
  ctaUrl: "",
  date: "",
  incidentId: "",
  actionUrl: "",
  recipientName: "",
};

function fromTemplate(t: EmailTemplate): ComposerState {
  return {
    ...EMPTY_FORM,
    subject: t.subject,
    body: t.body,
    emoji: t.emoji,
    templateId: t.id,
    ctaText: t.ctaText || "",
    ctaUrl: t.ctaUrl || "",
  };
}

function StatusPill({ status }: { status: EmailBroadcastLog["status"] }) {
  const tone =
    status === "completed"
      ? "border-emerald-500/30 text-emerald-600"
      : status === "partial"
      ? "border-amber-500/30 text-amber-600"
      : "border-danger/30 text-danger";
  return (
    <span className={`rounded-full border px-2 py-0.5 text-[11px] font-medium capitalize ${tone}`}>{status}</span>
  );
}

export default function AdminEmailsPanel() {
  const [category, setCategory] = useState<EmailTemplateCategoryId | "all">("all");
  const [query, setQuery] = useState("");

  const [form, setForm] = useState<ComposerState>(EMPTY_FORM);
  const [audience, setAudience] = useState<Audience>("test");
  const [singleTo, setSingleTo] = useState("");
  const [view, setView] = useState<"compose" | "preview">("compose");

  const [userCount, setUserCount] = useState<number | null>(null);
  const [history, setHistory] = useState<EmailBroadcastLog[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const [sending, setSending] = useState(false);
  const [notice, setNotice] = useState<{ tone: "ok" | "error"; text: string } | null>(null);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");

  const [aiOpen, setAiOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiTone, setAiTone] = useState(TONES[4]);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  const composerRef = useRef<HTMLDivElement | null>(null);

  const filteredTemplates = useMemo(() => searchEmailTemplates(query, category), [query, category]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: EMAIL_TEMPLATES.length };
    for (const t of EMAIL_TEMPLATES) counts[t.category] = (counts[t.category] || 0) + 1;
    return counts;
  }, []);

  // Live preview: placeholders resolve to sample values, or to what the admin typed in the fields.
  const previewHtml = useMemo(() => {
    const values = {
      ...SAMPLE_PLACEHOLDER_VALUES,
      name: form.recipientName.trim() || SAMPLE_PLACEHOLDER_VALUES.name,
      date: form.date.trim() || SAMPLE_PLACEHOLDER_VALUES.date,
      incident_id: form.incidentId.trim() || SAMPLE_PLACEHOLDER_VALUES.incident_id,
      app_url: DEFAULT_APP_URL,
      action_url: form.actionUrl.trim() || DEFAULT_APP_URL,
    };
    const subject = renderPlaceholders(form.subject, values) || "(no subject)";
    const body = renderPlaceholders(form.body, values) || "(empty body)";
    const ctaText = form.ctaText.trim();
    const ctaUrl = renderPlaceholders(form.ctaUrl.trim(), values);
    return wrapEmailInBrandedTemplate({
      title: subject,
      emoji: form.emoji.trim() || undefined,
      body,
      ctaText: ctaText && ctaUrl ? ctaText : undefined,
      ctaUrl: ctaText && ctaUrl ? ctaUrl : undefined,
    });
  }, [form]);

  const loadHistory = async () => {
    setHistoryLoading(true);
    try {
      const res = await fetch("/api/admin/emails/history");
      const data = await res.json();
      if (res.ok) setHistory(data.history || []);
    } catch {
      // Keep the previous history on a network error.
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
    fetch("/api/admin/users")
      .then((r) => r.json())
      .then((d) => setUserCount(typeof d.count === "number" ? d.count : null))
      .catch(() => setUserCount(null));
  }, []);

  const update = (patch: Partial<ComposerState>) => setForm((f) => ({ ...f, ...patch }));

  const loadTemplate = (t: EmailTemplate) => {
    setForm(fromTemplate(t));
    setNotice(null);
    setView("compose");
    composerRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const canSend = form.subject.trim().length >= 3 && form.body.trim().length >= 10;
  const singleValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(singleTo.trim());

  const performSend = async (mode: EmailTargetType, to?: string, confirmPhrase?: string) => {
    setSending(true);
    setNotice(null);
    try {
      const res = await fetch("/api/admin/emails/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode,
          to,
          subject: form.subject,
          body: form.body,
          emoji: form.emoji.trim() || undefined,
          templateId: form.templateId,
          ctaText: form.ctaText.trim() || undefined,
          ctaUrl: form.ctaUrl.trim() || undefined,
          date: form.date.trim() || undefined,
          incidentId: form.incidentId.trim() || undefined,
          actionUrl: form.actionUrl.trim() || undefined,
          recipientName: form.recipientName.trim() || undefined,
          confirmPhrase,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setNotice({ tone: "error", text: data.error || "The email could not be sent." });
      } else if (mode === "broadcast") {
        setNotice({
          tone: data.failedCount ? "error" : "ok",
          text: `Broadcast finished: ${data.deliveredCount} of ${data.totalRecipients} delivered, ${data.failedCount} failed.${
            data.firstError ? ` First error: ${data.firstError}` : ""
          }`,
        });
      } else {
        setNotice({
          tone: data.failedCount ? "error" : "ok",
          text: data.failedCount
            ? `Send failed: ${data.firstError || "unknown error"}`
            : `Sent to ${to}.`,
        });
      }
      loadHistory();
    } catch {
      setNotice({ tone: "error", text: "Network error. The email may not have been sent. Check the history before retrying." });
    } finally {
      setSending(false);
    }
  };

  const handlePrimarySend = () => {
    if (audience === "broadcast") {
      setConfirmText("");
      setConfirmOpen(true);
      return;
    }
    if (audience === "single") {
      if (!singleValid) return;
      performSend("single", singleTo.trim());
      return;
    }
    performSend("test", undefined);
  };

  const runGenerate = async () => {
    setAiLoading(true);
    setAiError(null);
    try {
      const res = await fetch("/api/admin/emails/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: aiPrompt, tone: aiTone }),
      });
      const data = await res.json();
      if (!res.ok) {
        setAiError(data.error || "Generation failed.");
        return;
      }
      update({ subject: data.subject, body: data.body, emoji: data.emoji || form.emoji, templateId: null });
      setAiOpen(false);
      setAiPrompt("");
      setView("compose");
    } catch {
      setAiError("Network error while generating. Try again.");
    } finally {
      setAiLoading(false);
    }
  };

  const sendLabel =
    audience === "broadcast" ? "Review and send to all users" : audience === "single" ? "Send to recipient" : "Send test to admin";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl text-ink">Emails</h1>
        <p className="mt-1.5 text-sm text-muted">
          Compose announcements, notices and policy updates from the library of {EMAIL_TEMPLATES.length} templates, or draft one with AI.
          Every message uses the same layout as the sign-in email.
        </p>
      </div>

      {/* TEMPLATE LIBRARY */}
      <section className={`${cardClass} p-4 sm:p-5`} aria-label="Template library">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search templates by title, subject or tag"
              className={`${inputClass} pl-9`}
              aria-label="Search templates"
            />
          </div>
          <span className="text-xs tabular-nums text-muted">
            {filteredTemplates.length} of {EMAIL_TEMPLATES.length} templates
          </span>
        </div>

        <div className="mt-4 flex gap-1.5 overflow-x-auto pb-1" role="tablist" aria-label="Template categories">
          {[{ id: "all" as const, label: "All" }, ...EMAIL_TEMPLATE_CATEGORIES.map((c) => ({ id: c.id, label: c.label }))].map((c) => {
            const isActive = category === c.id;
            return (
              <button
                key={c.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => setCategory(c.id)}
                className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${focusRing} ${
                  isActive ? "border-accent/40 bg-accent-soft text-ink" : "border-line text-muted hover:bg-hover hover:text-ink"
                }`}
              >
                {c.label} <span className="ml-1 tabular-nums text-muted">{categoryCounts[c.id] ?? 0}</span>
              </button>
            );
          })}
        </div>

        <div className="mt-4 grid max-h-[380px] grid-cols-1 gap-3 overflow-y-auto pr-1 md:grid-cols-2 xl:grid-cols-3">
          {filteredTemplates.length === 0 && (
            <p className="col-span-full py-10 text-center text-sm text-muted">No templates match that search.</p>
          )}
          {filteredTemplates.map((t) => (
            <article key={t.id} className="flex flex-col rounded-xl border border-line bg-app p-3.5">
              <div className="flex items-start gap-2.5">
                <span className="text-xl leading-none" aria-hidden="true">{t.emoji}</span>
                <div className="min-w-0">
                  <h3 className="truncate text-sm font-medium text-ink">{t.title}</h3>
                  <p className="text-[11px] uppercase tracking-wide text-muted">{getCategoryLabel(t.category)}</p>
                </div>
              </div>
              <p className="mt-2 line-clamp-2 text-xs text-muted">{t.subject}</p>
              <div className="mt-auto pt-3">
                <button type="button" onClick={() => loadTemplate(t)} className={secondaryButtonClass}>
                  <Pencil className="h-3.5 w-3.5" />
                  <span>Load into editor</span>
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* COMPOSER */}
      <section ref={composerRef} className={`${cardClass} p-4 sm:p-6`} aria-label="Composer">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="inline-flex rounded-xl border border-line bg-app p-1" role="tablist" aria-label="Composer view">
            {(["compose", "preview"] as const).map((v) => (
              <button
                key={v}
                type="button"
                role="tab"
                aria-selected={view === v}
                onClick={() => setView(v)}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${focusRing} ${
                  view === v ? "bg-card text-ink shadow-sm" : "text-muted hover:text-ink"
                }`}
              >
                {v === "compose" ? <Pencil className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                {v === "compose" ? "Compose" : "Live preview"}
              </button>
            ))}
          </div>
          <button type="button" onClick={() => setAiOpen(true)} className={primaryButtonClass}>
            <Wand2 className="h-4 w-4" />
            <span>🪄 Generate with AI</span>
          </button>
        </div>

        {view === "compose" && (
          <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_280px]">
            <div className="space-y-4">
              <div>
                <label className={labelClass} htmlFor="em-subject">Subject</label>
                <input
                  id="em-subject"
                  className={inputClass}
                  value={form.subject}
                  onChange={(e) => update({ subject: e.target.value })}
                  placeholder="Subject line"
                  maxLength={200}
                />
              </div>
              <div>
                <label className={labelClass} htmlFor="em-body">Body (plain text, blank line between paragraphs)</label>
                <textarea
                  id="em-body"
                  className={`${inputClass} min-h-[300px] font-mono text-[13px] leading-relaxed`}
                  value={form.body}
                  onChange={(e) => update({ body: e.target.value })}
                  placeholder="Write your message. Use {{name}}, {{email}}, {{date}}, {{incident_id}}, {{app_url}}, {{action_url}}."
                  maxLength={20000}
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className={labelClass} htmlFor="em-emoji">Header emoji</label>
                  <input id="em-emoji" className={inputClass} value={form.emoji} onChange={(e) => update({ emoji: e.target.value })} placeholder="🚨" maxLength={8} />
                </div>
                <div>
                  <label className={labelClass} htmlFor="em-date">{"{{date}}"} value</label>
                  <input id="em-date" className={inputClass} value={form.date} onChange={(e) => update({ date: e.target.value })} placeholder="Leave blank for today" maxLength={80} />
                </div>
                <div>
                  <label className={labelClass} htmlFor="em-incident">{"{{incident_id}}"} value</label>
                  <input id="em-incident" className={inputClass} value={form.incidentId} onChange={(e) => update({ incidentId: e.target.value })} placeholder="RF-INC-0001" maxLength={120} />
                </div>
                <div>
                  <label className={labelClass} htmlFor="em-action">{"{{action_url}}"} (https)</label>
                  <input id="em-action" className={inputClass} value={form.actionUrl} onChange={(e) => update({ actionUrl: e.target.value })} placeholder="https://roleflow.site/..." maxLength={2000} />
                </div>
                <div>
                  <label className={labelClass} htmlFor="em-cta-text">Button text</label>
                  <input id="em-cta-text" className={inputClass} value={form.ctaText} onChange={(e) => update({ ctaText: e.target.value })} placeholder="Leave blank for no button" maxLength={80} />
                </div>
                <div>
                  <label className={labelClass} htmlFor="em-cta-url">Button URL</label>
                  <input id="em-cta-url" className={inputClass} value={form.ctaUrl} onChange={(e) => update({ ctaUrl: e.target.value })} placeholder="{{action_url}} or https://..." maxLength={2000} />
                </div>
              </div>
            </div>

            <aside className="space-y-4">
              <div>
                <span className={labelClass}>Audience</span>
                <div className="grid gap-1.5" role="radiogroup" aria-label="Audience">
                  {(
                    [
                      { id: "test", label: "Test to admin", hint: "One copy to ADMIN_EMAIL" },
                      { id: "single", label: "Single recipient", hint: "Any email address, registered or not" },
                      { id: "broadcast", label: "All registered users", hint: userCount === null ? "Counting users…" : `${userCount} accounts` },
                    ] as { id: Audience; label: string; hint: string }[]
                  ).map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      role="radio"
                      aria-checked={audience === opt.id}
                      onClick={() => setAudience(opt.id)}
                      className={`rounded-xl border px-3.5 py-2.5 text-left transition-colors ${focusRing} ${
                        audience === opt.id ? "border-accent/50 bg-accent-soft" : "border-line bg-app hover:bg-hover"
                      }`}
                    >
                      <span className="block text-sm font-medium text-ink">{opt.label}</span>
                      <span className="block text-xs text-muted">{opt.hint}</span>
                    </button>
                  ))}
                </div>
              </div>

              {audience === "single" && (
                <div>
                  <label className={labelClass} htmlFor="em-to">Recipient email</label>
                  <input
                    id="em-to"
                    type="email"
                    className={inputClass}
                    value={singleTo}
                    onChange={(e) => setSingleTo(e.target.value)}
                    placeholder="partner@company.com"
                    autoComplete="off"
                    maxLength={254}
                  />
                  <p className="mt-1 text-xs text-muted">Any address works, including people who do not have a RoleFlow account.</p>
                </div>
              )}

              <div>
                <label className={labelClass} htmlFor="em-name">Greeting name (single / test)</label>
                <input id="em-name" className={inputClass} value={form.recipientName} onChange={(e) => update({ recipientName: e.target.value })} placeholder="Optional, e.g. Priya" maxLength={80} />
              </div>

              <div className="space-y-2 pt-1">
                <button
                  type="button"
                  onClick={handlePrimarySend}
                  disabled={!canSend || sending || (audience === "single" && !singleValid)}
                  className={`${primaryButtonClass} w-full justify-center`}
                >
                  <Send className="h-4 w-4" />
                  <span>{sending ? "Sending…" : sendLabel}</span>
                </button>
                <button
                  type="button"
                  onClick={() => performSend("test")}
                  disabled={!canSend || sending}
                  className={`${secondaryButtonClass} w-full justify-center py-2`}
                >
                  <Mail className="h-3.5 w-3.5" />
                  <span>Send a test copy to admin</span>
                </button>
                <button
                  type="button"
                  onClick={() => { setForm(EMPTY_FORM); setNotice(null); }}
                  className={`${secondaryButtonClass} w-full justify-center py-2`}
                >
                  <X className="h-3.5 w-3.5" />
                  <span>Clear composer</span>
                </button>
              </div>

              {form.templateId && (
                <p className="text-xs text-muted">
                  Loaded from template <code className="rounded bg-app px-1 py-0.5">{form.templateId}</code>. Edits here do not change the library.
                </p>
              )}
            </aside>
          </div>
        )}

        {view === "preview" && (
          <div className="mt-5">
            <p className="mb-3 text-xs text-muted">
              Sample values fill the placeholders here. The real send uses each recipient&apos;s own name.
            </p>
            <iframe
              title="Email preview"
              srcDoc={previewHtml}
              sandbox=""
              className="h-[680px] w-full rounded-xl border border-line bg-white"
            />
          </div>
        )}

        {notice && (
          <div
            role="status"
            className={`mt-5 rounded-xl border px-4 py-3 text-sm ${
              notice.tone === "ok" ? "border-emerald-500/30 bg-emerald-500/5 text-ink" : "border-danger/30 bg-danger-soft text-danger"
            }`}
          >
            {notice.text}
          </div>
        )}
      </section>

      {/* HISTORY */}
      <section className={`${cardClass} p-4 sm:p-6`} aria-label="Broadcast history">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-base font-medium text-ink">
            <History className="h-4 w-4 text-muted" />
            Send history
          </h2>
          <button type="button" onClick={loadHistory} disabled={historyLoading} className={secondaryButtonClass}>
            <RefreshCw className={`h-3.5 w-3.5 ${historyLoading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>
        </div>
        {history.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted">No emails sent from the admin panel yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="text-xs uppercase tracking-wide text-muted">
                <tr className="border-b border-line">
                  <th className="py-2 pr-3 font-medium">When</th>
                  <th className="py-2 pr-3 font-medium">Audience</th>
                  <th className="py-2 pr-3 font-medium">Subject</th>
                  <th className="py-2 pr-3 font-medium tabular-nums">Delivered</th>
                  <th className="py-2 pr-3 font-medium tabular-nums">Failed</th>
                  <th className="py-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {history.map((h) => (
                  <tr key={h.id} className="border-b border-line/60 align-top">
                    <td className="py-2.5 pr-3 whitespace-nowrap text-muted">{new Date(h.createdAt).toLocaleString()}</td>
                    <td className="py-2.5 pr-3">
                      <span className="capitalize text-ink">{h.targetType}</span>
                      {h.targetEmail && <span className="block text-xs text-muted">{h.targetEmail}</span>}
                      {h.targetType === "broadcast" && <span className="block text-xs text-muted">{h.totalRecipients} recipients</span>}
                    </td>
                    <td className="py-2.5 pr-3 text-ink">
                      {h.subject}
                      {h.templateId && <span className="block text-xs text-muted">{h.templateId}</span>}
                    </td>
                    <td className="py-2.5 pr-3 tabular-nums text-ink">{h.deliveredCount}</td>
                    <td className="py-2.5 pr-3 tabular-nums text-ink">{h.failedCount}</td>
                    <td className="py-2.5"><StatusPill status={h.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* AI DRAFTER MODAL */}
      {aiOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true" aria-labelledby="ai-title">
          <div className={`${cardClass} w-full max-w-lg p-5 shadow-xl`}>
            <div className="mb-4 flex items-start justify-between">
              <div>
                <h2 id="ai-title" className="flex items-center gap-2 text-base font-medium text-ink">
                  <Sparkles className="h-4 w-4 text-accent" /> Prompt for AI to make
                </h2>
                <p className="mt-1 text-xs text-muted">Describe the email. The draft replaces the current subject and body.</p>
              </div>
              <button type="button" onClick={() => setAiOpen(false)} className={`rounded-lg p-1 text-muted hover:bg-hover ${focusRing}`} aria-label="Close">
                <X className="h-4 w-4" />
              </button>
            </div>
            <label className={labelClass} htmlFor="ai-prompt">Brief</label>
            <textarea
              id="ai-prompt"
              className={`${inputClass} min-h-[120px]`}
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              placeholder="e.g. Tell users the Flash 2.0 model is now faster, and invite them to try it this week."
              maxLength={2000}
            />
            <div className="mt-3">
              <label className={labelClass} htmlFor="ai-tone">Tone</label>
              <select id="ai-tone" className={inputClass} value={aiTone} onChange={(e) => setAiTone(e.target.value)}>
                {TONES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            {aiError && (
              <p className="mt-3 flex items-start gap-2 text-sm text-danger">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /> {aiError}
              </p>
            )}
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={() => setAiOpen(false)} className={secondaryButtonClass}>Cancel</button>
              <button type="button" onClick={runGenerate} disabled={aiLoading || aiPrompt.trim().length < 5} className={primaryButtonClass}>
                <Wand2 className="h-4 w-4" />
                <span>{aiLoading ? "Writing…" : "Generate draft"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BROADCAST SAFETY MODAL */}
      {confirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true" aria-labelledby="confirm-title">
          <div className={`${cardClass} w-full max-w-md p-5 shadow-xl`}>
            <h2 id="confirm-title" className="flex items-center gap-2 text-base font-medium text-danger">
              <AlertTriangle className="h-4 w-4" /> Send to all registered users?
            </h2>
            <p className="mt-3 text-sm text-ink">
              This sends <strong>{form.subject || "(no subject)"}</strong> to <strong>{userCount ?? "every"}</strong> registered accounts.
              Each person gets their own copy. Sent email cannot be recalled.
            </p>
            <label className={`${labelClass} mt-4`} htmlFor="confirm-phrase">
              Type <span className="font-mono normal-case text-ink">{CONFIRM_PHRASE}</span> to continue
            </label>
            <input id="confirm-phrase" className={inputClass} value={confirmText} onChange={(e) => setConfirmText(e.target.value)} autoComplete="off" />
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={() => setConfirmOpen(false)} className={secondaryButtonClass}>Cancel</button>
              <button
                type="button"
                disabled={confirmText !== CONFIRM_PHRASE || sending}
                onClick={() => {
                  setConfirmOpen(false);
                  performSend("broadcast", undefined, confirmText);
                }}
                className={`${primaryButtonClass} bg-danger hover:bg-danger/90`}
              >
                <Send className="h-4 w-4" />
                <span>Send to everyone</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
