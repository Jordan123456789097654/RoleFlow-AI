"use client";

import React, { useCallback, useEffect, useState } from "react";
import { Key, Copy, Trash2, Check, Plus } from "lucide-react";
import type { ApiKeyRateLimit } from "@/types";

type ExpiryChoice = "never" | "7" | "30" | "90";

interface PublicKey {
  id: string;
  name: string;
  keyPrefix: string;
  createdAt: string;
  lastUsedAt?: string;
  status: "active" | "revoked";
  requestCount: number;
  rateLimit: ApiKeyRateLimit;
  expiresAt?: string;
  dailyCount?: number;
  dailyDate?: string;
}

interface KeysResponse {
  keys: PublicKey[];
  limits: { maxKeys: number; defaultRpm: number; defaultRpd: number };
  enabled: boolean;
}

type LoadState = "loading" | "ready" | "signed-out" | "error";

const inputClass =
  "w-full rounded-lg border border-line bg-card px-3 py-2 text-sm text-ink placeholder:text-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40";
const labelClass = "mb-1.5 block text-xs font-medium text-muted";
const primaryButton =
  "inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40";
const ghostButton =
  "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-muted transition-colors hover:bg-hover hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 disabled:opacity-50";

function utcToday(): string {
  return new Date().toISOString().slice(0, 10);
}

function requestsToday(k: PublicKey): number {
  return k.dailyDate === utcToday() ? k.dailyCount ?? 0 : 0;
}

function isExpired(k: PublicKey): boolean {
  return Boolean(k.expiresAt && Date.parse(k.expiresAt) <= Date.now());
}

function formatDate(iso?: string): string {
  if (!iso) return "Never";
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function formatDateTime(iso?: string): string {
  if (!iso) return "Never";
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function StatusBadge({ k }: { k: PublicKey }) {
  if (k.status === "revoked") {
    return <span className="rounded-full bg-hover px-2 py-0.5 text-xs font-medium text-muted">Revoked</span>;
  }
  if (isExpired(k)) {
    return <span className="rounded-full bg-danger-soft px-2 py-0.5 text-xs font-medium text-danger">Expired</span>;
  }
  return <span className="rounded-full bg-accent-soft px-2 py-0.5 text-xs font-medium text-accent">Active</span>;
}

export function ApiKeysPanel() {
  const [data, setData] = useState<KeysResponse | null>(null);
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [name, setName] = useState("");
  const [rpm, setRpm] = useState("");
  const [rpd, setRpd] = useState("");
  const [expiry, setExpiry] = useState<ExpiryChoice>("never");
  const [creating, setCreating] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [revealed, setRevealed] = useState<string | null>(null);
  const [copied, setCopied] = useState<"key" | "curl" | null>(null);
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [origin, setOrigin] = useState("https://your-roleflow-site");

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/keys", { cache: "no-store" });
      if (res.status === 401) {
        setLoadState("signed-out");
        return;
      }
      if (!res.ok) throw new Error("load failed");
      const json = (await res.json()) as KeysResponse;
      setData(json);
      setLoadState("ready");
    } catch {
      setLoadState("error");
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function copyText(text: string, which: "key" | "curl") {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(which);
      setTimeout(() => setCopied(null), 1500);
    } catch {
      // Clipboard can be blocked. The text stays selectable on screen.
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!data || creating) return;
    setFormError(null);
    setCreating(true);
    try {
      const body: Record<string, unknown> = {
        name: name.trim(),
        expiresInDays: expiry === "never" ? null : Number(expiry),
      };
      if (rpm.trim()) body.rpm = Number(rpm);
      if (rpd.trim()) body.rpd = Number(rpd);

      const res = await fetch("/api/keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setFormError(json.error || "Could not create the key. Please try again.");
        return;
      }
      setRevealed(json.key);
      setCopied(null);
      setName("");
      setRpm("");
      setRpd("");
      setExpiry("never");
      await load();
    } catch {
      setFormError("Network error. Please try again.");
    } finally {
      setCreating(false);
    }
  }

  async function handleRevoke(k: PublicKey) {
    if (!window.confirm(`Revoke "${k.name}"? Anything using this key will stop working immediately.`)) return;
    setRevokingId(k.id);
    try {
      const res = await fetch(`/api/keys/${encodeURIComponent(k.id)}`, { method: "DELETE" });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        window.alert(json.error || "Could not revoke the key.");
      }
      await load();
    } finally {
      setRevokingId(null);
    }
  }

  const activeCount = data ? data.keys.filter((k) => k.status === "active" && !isExpired(k)).length : 0;
  const atLimit = Boolean(data && activeCount >= data.limits.maxKeys);
  const canCreate = Boolean(data && data.enabled && !atLimit);

  const curlExample = `curl ${origin}/api/v1/chat/completions \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"model":"roleflow-flash-2","messages":[{"role":"user","content":"Hello"}]}'`;

  if (loadState === "loading") {
    return <p className="text-sm text-muted">Loading your API keys…</p>;
  }

  if (loadState === "signed-out") {
    return (
      <div className="rounded-xl border border-line bg-panel p-5 text-sm text-muted">
        Sign in to create and manage API keys.
      </div>
    );
  }

  if (loadState === "error" || !data) {
    return (
      <div className="rounded-xl border border-danger/30 bg-danger-soft p-5 text-sm text-danger">
        Could not load your API keys. Refresh the page to try again.
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {!data.enabled && (
        <div className="rounded-xl border border-line bg-hover p-4 text-sm text-muted">
          API keys are turned off for RoleFlow right now. Your existing keys are paused until they are turned back on.
        </div>
      )}

      {revealed && (
        <div className="rounded-xl border border-accent/30 bg-accent-soft p-4">
          <p className="text-sm font-medium text-ink">Copy your new key now</p>
          <p className="mt-1 text-xs text-muted">
            For your security it will not be shown again. Store it somewhere safe.
          </p>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
            <code className="min-w-0 flex-1 break-all rounded-lg border border-line bg-card px-3 py-2 font-mono text-xs text-ink">
              {revealed}
            </code>
            <div className="flex gap-2">
              <button type="button" onClick={() => copyText(revealed, "key")} className={primaryButton}>
                {copied === "key" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copied === "key" ? "Copied" : "Copy key"}
              </button>
              <button type="button" onClick={() => setRevealed(null)} className={ghostButton}>
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create */}
      <section>
        <h3 className="font-display text-lg text-ink">Create a key</h3>
        <p className="mt-1 text-xs text-muted">
          Up to {data.limits.maxKeys} active keys. Defaults: {data.limits.defaultRpm} requests per minute and{" "}
          {data.limits.defaultRpd} per day. Requests count against your daily message quota.
        </p>

        {atLimit && (
          <p className="mt-4 rounded-lg border border-line bg-hover px-3 py-2 text-sm text-muted">
            You have reached the limit of {data.limits.maxKeys} active keys. Revoke one to create another.
          </p>
        )}

        {canCreate && (
          <form onSubmit={handleCreate} className="mt-4 grid gap-4 rounded-xl border border-line bg-card p-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label htmlFor="api-key-name" className={labelClass}>
                Name
              </label>
              <input
                id="api-key-name"
                className={inputClass}
                value={name}
                maxLength={60}
                placeholder="For example: laptop script"
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div>
              <label htmlFor="api-key-rpm" className={labelClass}>
                Requests per minute
              </label>
              <input
                id="api-key-rpm"
                type="number"
                min={1}
                max={120}
                className={inputClass}
                value={rpm}
                placeholder={String(data.limits.defaultRpm)}
                onChange={(e) => setRpm(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="api-key-rpd" className={labelClass}>
                Requests per day
              </label>
              <input
                id="api-key-rpd"
                type="number"
                min={1}
                max={10000}
                className={inputClass}
                value={rpd}
                placeholder={String(data.limits.defaultRpd)}
                onChange={(e) => setRpd(e.target.value)}
              />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="api-key-expiry" className={labelClass}>
                Expires
              </label>
              <select
                id="api-key-expiry"
                className={inputClass}
                value={expiry}
                onChange={(e) => setExpiry(e.target.value as ExpiryChoice)}
              >
                <option value="never">Never</option>
                <option value="7">In 7 days</option>
                <option value="30">In 30 days</option>
                <option value="90">In 90 days</option>
              </select>
            </div>
            {formError && (
              <p className="text-sm text-danger sm:col-span-2" role="alert">
                {formError}
              </p>
            )}
            <div className="sm:col-span-2">
              <button type="submit" disabled={creating || !name.trim()} className={primaryButton}>
                <Plus className="h-4 w-4" />
                {creating ? "Creating…" : "Create key"}
              </button>
            </div>
          </form>
        )}
      </section>

      {/* List */}
      <section>
        <h3 className="font-display text-lg text-ink">Your keys</h3>
        {data.keys.length === 0 ? (
          <p className="mt-3 text-sm text-muted">No API keys yet.</p>
        ) : (
          <ul className="mt-3 divide-y divide-line overflow-hidden rounded-xl border border-line bg-card">
            {data.keys.map((k) => {
              const used = requestsToday(k);
              return (
                <li key={k.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Key className="h-4 w-4 shrink-0 text-muted" />
                      <span className="truncate text-sm font-medium text-ink">{k.name}</span>
                      <StatusBadge k={k} />
                    </div>
                    <p className="font-mono text-xs text-muted">{k.keyPrefix}…</p>
                    <p className="text-xs text-muted">
                      Created {formatDate(k.createdAt)} · Last used {formatDateTime(k.lastUsedAt)} · Expires{" "}
                      {formatDate(k.expiresAt)}
                    </p>
                    <p className="text-xs text-muted">
                      {k.status === "active" && !isExpired(k)
                        ? `${used} of ${k.rateLimit.rpd} requests today · ${k.rateLimit.rpm} per minute`
                        : `${k.requestCount} requests in total`}
                    </p>
                  </div>
                  {k.status === "active" && (
                    <button
                      type="button"
                      onClick={() => handleRevoke(k)}
                      disabled={revokingId === k.id}
                      className={`${ghostButton} hover:text-danger`}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      {revokingId === k.id ? "Revoking…" : "Revoke"}
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* Example */}
      <section>
        <div className="flex items-center justify-between">
          <h3 className="font-display text-lg text-ink">Example request</h3>
          <button type="button" onClick={() => copyText(curlExample, "curl")} className={ghostButton}>
            {copied === "curl" ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            {copied === "curl" ? "Copied" : "Copy"}
          </button>
        </div>
        <pre className="mt-3 overflow-x-auto rounded-xl border border-line bg-panel p-4 font-mono text-xs leading-relaxed text-ink">
          {curlExample}
        </pre>
        <p className="mt-2 text-xs text-muted">
          Responses follow the OpenAI chat completions shape. Keep keys out of client-side code and public repositories.
        </p>
      </section>
    </div>
  );
}
