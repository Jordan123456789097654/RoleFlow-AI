"use client";

import React, { useState } from "react";
import { X } from "lucide-react";
import type { ModerationLogEntry } from "@/types";

const focusRing = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40";
const inputClass = `w-full rounded-xl border border-line bg-app px-3.5 py-2.5 text-sm text-ink placeholder:text-muted/70 focus:outline-none focus:border-accent/60 transition-colors ${focusRing}`;
const labelClass = "mb-1.5 block text-xs font-medium uppercase tracking-wide text-muted";
const primaryButtonClass = `inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-50 ${focusRing}`;
const secondaryButtonClass = `inline-flex items-center gap-1.5 rounded-xl border border-line bg-card px-3 py-2 text-sm font-medium text-ink transition-colors hover:bg-hover disabled:cursor-not-allowed disabled:opacity-50 ${focusRing}`;

interface Preview {
  reference: string;
  subject: string;
  body: string;
  attachmentName: string;
}

interface Props {
  log: ModerationLogEntry;
  onClose: () => void;
  onSent: (incidentId: string) => void;
}

/** Drafts and sends a Tier 1 referral. Nothing is sent until the admin clicks Send referral. */
export default function ReferralModal({ log, onClose, onSent }: Props) {
  const [agencyName, setAgencyName] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [adminName, setAdminName] = useState("");
  const [adminTitle, setAdminTitle] = useState("");
  const [includeExcerpt, setIncludeExcerpt] = useState(false);
  const [holdUserNotice, setHoldUserNotice] = useState(false);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);

  // Any change invalidates the preview, so the reference and text always match what is sent.
  const edit = <T,>(setter: (v: T) => void) => (v: T) => {
    setter(v);
    setPreview(null);
    setError(null);
  };

  const payload = () => ({
    incidentId: log.id,
    agencyName,
    recipientEmail,
    adminName,
    adminTitle,
    includeExcerpt,
    holdUserNotice,
  });

  async function call(mode: "preview" | "send", extra: Record<string, unknown> = {}) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/referrals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...payload(), mode, ...extra }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "The referral could not be processed.");
      return data;
    } catch (e: any) {
      setError(e.message);
      return null;
    } finally {
      setBusy(false);
    }
  }

  async function runPreview() {
    const data = await call("preview");
    if (data) setPreview(data);
  }

  async function send() {
    if (!preview) return;
    const data = await call("send", { reference: preview.reference });
    if (data) {
      setDone(preview.reference);
      onSent(log.id);
    }
  }

  const formReady = agencyName && recipientEmail && adminName && adminTitle;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true" aria-label="Refer to authorities">
      <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-line bg-card p-6 shadow-xl">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h3 className="font-display text-xl text-ink">Refer to authorities</h3>
            <p className="mt-1 text-xs text-muted">
              Incident <span className="font-mono">{log.id}</span> · Tier {log.tier} · {log.category}
            </p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-muted hover:bg-hover" aria-label="Close">
            <X className="h-4 w-4" />
          </button>
        </div>

        {done ? (
          <div className="space-y-4">
            <p className="text-sm text-emerald-700 dark:text-emerald-400">
              Referral {done} was sent and logged.
            </p>
            <button type="button" onClick={onClose} className={primaryButtonClass}>Done</button>
          </div>
        ) : (
          <div className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="ref-agency" className={labelClass}>Agency</label>
                <input id="ref-agency" className={inputClass} placeholder="Atlanta Police Department, Cyber Crimes Unit" value={agencyName} onChange={(e) => edit(setAgencyName)(e.target.value)} />
              </div>
              <div>
                <label htmlFor="ref-recipient" className={labelClass}>Recipient email</label>
                <input id="ref-recipient" type="email" className={inputClass} placeholder="officer@agency.gov" value={recipientEmail} onChange={(e) => edit(setRecipientEmail)(e.target.value)} />
              </div>
              <div>
                <label htmlFor="ref-name" className={labelClass}>Your name (signature)</label>
                <input id="ref-name" className={inputClass} value={adminName} onChange={(e) => edit(setAdminName)(e.target.value)} />
              </div>
              <div>
                <label htmlFor="ref-title" className={labelClass}>Your title (signature)</label>
                <input id="ref-title" className={inputClass} value={adminTitle} onChange={(e) => edit(setAdminTitle)(e.target.value)} />
              </div>
            </div>

            <div className="space-y-2 rounded-xl border border-line bg-app p-4 text-sm text-ink">
              <label className="flex items-start gap-3">
                <input type="checkbox" className="mt-1" checked={includeExcerpt} onChange={(e) => edit(setIncludeExcerpt)(e.target.checked)} />
                <span>Include a 200-character excerpt of the flagged message in the letter</span>
              </label>
              <label className="flex items-start gap-3">
                <input type="checkbox" className="mt-1" checked={holdUserNotice} onChange={(e) => edit(setHoldUserNotice)(e.target.checked)} />
                <span>Hold the user notification for this referral (use only where a legal order prohibits notice)</span>
              </label>
            </div>

            {!preview && (
              <button type="button" onClick={runPreview} disabled={!formReady || busy} className={secondaryButtonClass}>
                {busy ? "Preparing…" : "Preview referral"}
              </button>
            )}

            {preview && (
              <div className="space-y-3">
                <div className="rounded-xl border border-line bg-app p-4">
                  <div className="text-xs text-muted">Subject</div>
                  <div className="text-sm font-medium text-ink">{preview.subject}</div>
                  <div className="mt-2 text-xs text-muted">Attachment: {preview.attachmentName}</div>
                </div>
                <pre className="max-h-[50vh] overflow-y-auto whitespace-pre-wrap rounded-xl border border-line bg-app p-4 font-sans text-sm leading-relaxed text-ink">
                  {preview.body}
                </pre>
                <div className="flex flex-wrap items-center gap-3">
                  <button type="button" onClick={send} disabled={busy} className={primaryButtonClass}>
                    {busy ? "Sending…" : "Send referral"}
                  </button>
                  <button type="button" onClick={() => setPreview(null)} disabled={busy} className={secondaryButtonClass}>
                    Edit
                  </button>
                </div>
              </div>
            )}

            {error && <p className="text-sm text-danger" role="alert">{error}</p>}
          </div>
        )}
      </div>
    </div>
  );
}
