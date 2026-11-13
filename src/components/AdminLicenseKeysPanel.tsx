"use client";

import React, { useCallback, useEffect, useState } from "react";
import { Check, Copy, RefreshCw, Ticket } from "lucide-react";
import type { LicenseKeyRecord, LicenseKeyStatus } from "@/types";

const focusRing = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40";
const inputClass = `w-full rounded-xl border border-line bg-app px-3.5 py-2.5 text-sm text-ink placeholder:text-muted/70 focus:outline-none focus:border-accent/60 transition-colors ${focusRing}`;
const labelClass = "mb-1.5 block text-xs font-medium uppercase tracking-wide text-muted";
const primaryButtonClass = `inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-50 ${focusRing}`;
const secondaryButtonClass = `inline-flex items-center gap-1.5 rounded-xl border border-line bg-card px-3 py-1.5 text-xs font-medium text-ink transition-colors hover:bg-hover disabled:cursor-not-allowed disabled:opacity-50 ${focusRing}`;
const cardClass = "rounded-2xl border border-line bg-card";

const DURATIONS: { value: string; label: string }[] = [
  { value: "7", label: "7 days" },
  { value: "30", label: "30 days" },
  { value: "90", label: "90 days" },
  { value: "365", label: "1 year" },
  { value: "none", label: "No expiry" },
];

const STATUS_LABEL: Record<LicenseKeyStatus, string> = {
  unused: "Unused",
  active: "Active",
  used_up: "Used up",
  expired: "Expired",
};

const STATUS_CLASS: Record<LicenseKeyStatus, string> = {
  unused: "border-line bg-app text-muted",
  active: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  used_up: "border-line bg-app text-muted",
  expired: "border-danger/30 bg-danger-soft text-danger",
};

type ListedKey = LicenseKeyRecord & { status: LicenseKeyStatus };

/** Admin panel: generate single-use license keys, optionally email them, and review the list. */
export default function AdminLicenseKeysPanel() {
  const [keys, setKeys] = useState<ListedKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [amount, setAmount] = useState("100");
  const [duration, setDuration] = useState("30");
  const [note, setNote] = useState("");
  const [recipient, setRecipient] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [created, setCreated] = useState<{ key: string; emailed: boolean; wantedEmail: boolean } | null>(null);
  const [copied, setCopied] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/license-keys", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not load license keys.");
      setKeys(data.keys);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    setCreateError(null);
    setCreated(null);
    setCopied(false);
    try {
      const res = await fetch("/api/admin/license-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: Number(amount),
          durationDays: duration === "none" ? null : Number(duration),
          note,
          recipientEmail: recipient.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not create the key.");
      setCreated({ key: data.key, emailed: Boolean(data.emailed), wantedEmail: Boolean(recipient.trim()) });
      setNote("");
      setRecipient("");
      load();
    } catch (e: any) {
      setCreateError(e.message);
    } finally {
      setCreating(false);
    }
  }

  async function copyKey() {
    if (!created) return;
    try {
      await navigator.clipboard.writeText(created.key);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="space-y-8">
      <div className="space-y-1.5">
        <h3 className="flex items-center gap-2 font-display text-2xl text-ink">
          <Ticket className="h-5 w-5" />
          <span>License keys</span>
        </h3>
        <p className="text-sm leading-relaxed text-muted">
          Each key adds extra messages for chat and the API, used after a user&apos;s daily limit runs out. A key is
          single-use. Its duration starts when the user redeems it.
        </p>
      </div>

      <form onSubmit={create} className={`${cardClass} grid gap-5 p-5 sm:grid-cols-2`}>
        <div>
          <label htmlFor="lk-amount" className={labelClass}>
            Extra messages
          </label>
          <input
            id="lk-amount"
            type="number"
            min={1}
            max={10000}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className={`${inputClass} tabular-nums`}
            required
          />
        </div>
        <div>
          <label htmlFor="lk-duration" className={labelClass}>
            Valid for (after redemption)
          </label>
          <select
            id="lk-duration"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            className={inputClass}
          >
            {DURATIONS.map((d) => (
              <option key={d.value} value={d.value}>
                {d.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="lk-note" className={labelClass}>
            Note (optional)
          </label>
          <input
            id="lk-note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            maxLength={200}
            placeholder="e.g. Beta tester"
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="lk-recipient" className={labelClass}>
            Email to (optional)
          </label>
          <input
            id="lk-recipient"
            type="email"
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            placeholder="name@example.com"
            className={inputClass}
          />
        </div>
        <div className="flex items-center justify-between gap-3 sm:col-span-2">
          <p className="text-xs text-muted">
            The key is shown once. Keys are stored as hashes, so it cannot be shown again.
          </p>
          <button type="submit" disabled={creating} className={primaryButtonClass}>
            {creating ? "Generating…" : "Generate key"}
          </button>
        </div>
      </form>

      {createError && <p className="text-sm text-danger">{createError}</p>}

      {created && (
        <div className="space-y-3 rounded-2xl border border-accent/30 bg-accent-soft p-5">
          <div className="text-xs font-medium uppercase tracking-wide text-accent">New key (shown once)</div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <code className="flex-1 select-all rounded-xl border border-line bg-card px-4 py-3 font-mono text-lg tracking-widest text-ink">
              {created.key}
            </code>
            <button type="button" onClick={copyKey} className={secondaryButtonClass}>
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
          {created.wantedEmail && (
            <p className="text-xs text-muted">
              {created.emailed ? "Also emailed to the recipient." : "The email could not be sent. Copy the key and send it yourself."}
            </p>
          )}
        </div>
      )}

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium text-ink">All keys</h4>
          <button type="button" onClick={load} disabled={loading} className={secondaryButtonClass}>
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>

        {error && <p className="text-sm text-danger">{error}</p>}

        <div className={`${cardClass} overflow-x-auto`}>
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-line text-xs uppercase tracking-wide text-muted">
              <tr>
                <th className="px-4 py-3 font-medium">Key</th>
                <th className="px-4 py-3 font-medium">Messages</th>
                <th className="px-4 py-3 font-medium">Valid for</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Redeemed by</th>
                <th className="px-4 py-3 font-medium">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {keys.length === 0 && !loading && (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-muted">
                    No keys yet.
                  </td>
                </tr>
              )}
              {keys.map((k) => (
                <tr key={k.id}>
                  <td className="px-4 py-3 font-mono text-xs text-ink">
                    {k.keyPrefix}
                    {k.note && <div className="mt-0.5 font-sans text-[11px] text-muted">{k.note}</div>}
                    {k.recipientEmail && (
                      <div className="mt-0.5 font-sans text-[11px] text-muted">To {k.recipientEmail}</div>
                    )}
                  </td>
                  <td className="px-4 py-3 tabular-nums text-ink">
                    {k.status === "unused" ? k.amount : `${k.remaining} of ${k.amount} left`}
                  </td>
                  <td className="px-4 py-3 text-muted">
                    {k.durationDays === null ? "No expiry" : k.durationDays === 365 ? "1 year" : `${k.durationDays} days`}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${STATUS_CLASS[k.status]}`}>
                      {STATUS_LABEL[k.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted">{k.redeemedByEmail || "—"}</td>
                  <td className="px-4 py-3 tabular-nums text-muted">{new Date(k.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
