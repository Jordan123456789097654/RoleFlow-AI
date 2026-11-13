"use client";

import React, { useEffect, useState } from "react";
import { KeyRound } from "lucide-react";

const focusRing = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40";
const inputClass = `w-full rounded-xl border border-line bg-app px-3.5 py-2.5 font-mono text-sm uppercase tracking-wide text-ink placeholder:normal-case placeholder:tracking-normal placeholder:text-muted/70 focus:outline-none focus:border-accent/60 transition-colors ${focusRing}`;
const buttonClass = `inline-flex shrink-0 items-center rounded-xl bg-accent px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-50 ${focusRing}`;

interface Balance {
  remaining: number;
  expiresAt: string | null;
}

function formatExpiry(iso: string | null): string {
  if (!iso) return "No expiry";
  return `Expires ${new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })}`;
}

/** Settings card: shows extra-usage balance and redeems a single-use license key. */
export function LicenseKeyRedeem() {
  const [balance, setBalance] = useState<Balance | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [key, setKey] = useState("");
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/license/redeem", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : { balance: null }))
      .then((data) => {
        if (!cancelled) setBalance(data.balance ?? null);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function redeem(e: React.FormEvent) {
    e.preventDefault();
    if (!key.trim() || busy) return;
    setBusy(true);
    setFeedback(null);
    try {
      const res = await fetch("/api/license/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFeedback({ ok: false, text: data.error || "Could not redeem this key." });
        return;
      }
      setBalance(data.balance);
      setKey("");
      setFeedback({ ok: true, text: `Redeemed. You now have ${data.balance.remaining} extra messages.` });
    } catch {
      setFeedback({ ok: false, text: "Network error. Please try again." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-5 rounded-2xl border border-line bg-card p-5">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-accent">
          <KeyRound className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <div className="text-sm font-medium text-ink">Extra messages</div>
          <div className="text-xs text-muted">
            {!loaded
              ? "Loading…"
              : balance
              ? `${balance.remaining} left · ${formatExpiry(balance.expiresAt)}`
              : "No extra messages. They are used after your daily limit runs out."}
          </div>
        </div>
      </div>

      <form onSubmit={redeem} className="flex flex-col gap-2 sm:flex-row">
        <label htmlFor="license-key-input" className="sr-only">
          License key
        </label>
        <input
          id="license-key-input"
          value={key}
          onChange={(e) => setKey(e.target.value)}
          placeholder="RF-XXXX-XXXX-XXXX"
          autoComplete="off"
          spellCheck={false}
          className={inputClass}
          disabled={busy}
        />
        <button type="submit" disabled={busy || !key.trim()} className={buttonClass}>
          {busy ? "Redeeming…" : "Redeem"}
        </button>
      </form>

      {feedback && (
        <p
          role="status"
          className={`text-sm ${feedback.ok ? "text-emerald-700 dark:text-emerald-400" : "text-danger"}`}
        >
          {feedback.text}
        </p>
      )}
    </div>
  );
}
