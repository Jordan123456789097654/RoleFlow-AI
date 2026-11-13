"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { AlertTriangle, Ban, CheckCircle, Clock, Gavel, Search, X } from "lucide-react";
import type { ModerationLogEntry, Punishment, PunishmentKind, UserProfile } from "@/types";

const focusRing = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40";
const cardClass = "rounded-2xl border border-line bg-card";
const inputClass = `w-full rounded-xl border border-line bg-app px-3.5 py-2.5 text-sm text-ink placeholder:text-muted/70 focus:outline-none focus:border-accent/60 transition-colors ${focusRing}`;
const primaryButtonClass = `inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-50 ${focusRing}`;
const secondaryButtonClass = `inline-flex items-center gap-1.5 rounded-xl border border-line bg-card px-3 py-1.5 text-xs font-medium text-ink transition-colors hover:bg-hover disabled:cursor-not-allowed disabled:opacity-50 ${focusRing}`;
const dangerButtonClass = `inline-flex items-center gap-1.5 rounded-xl border border-danger/30 bg-danger-soft px-4 py-2 text-sm font-medium text-danger transition-colors hover:bg-danger/20 disabled:cursor-not-allowed disabled:opacity-50 ${focusRing}`;

const SUSPEND_LENGTHS = [1, 7, 14, 30, 90, 365];
const ACTION_ENDPOINT: Record<PunishmentKind, string> = {
  WARN: "warnUser",
  SUSPEND: "suspendUser",
  BAN: "banUser",
  LIFT: "unbanUser",
};
const ACTION_TITLE: Record<PunishmentKind, string> = {
  WARN: "Warn account",
  SUSPEND: "Suspend account",
  BAN: "Ban account",
  LIFT: "Lift ban or suspension",
};

type AccountStatus = "active" | "suspended" | "banned";

function statusOf(u: UserProfile): { status: AccountStatus; until?: string } {
  if (!u.isBanned) return { status: "active" };
  if (u.suspendedUntil) {
    // An expired suspension still has the flag set, but the server no longer blocks the account.
    return Date.parse(u.suspendedUntil) > Date.now()
      ? { status: "suspended", until: u.suspendedUntil }
      : { status: "active" };
  }
  return { status: "banned" };
}

function Badge({ tone, children }: { tone: "neutral" | "danger" | "success" | "warning" | "info"; children?: ReactNode }) {
  const tones = {
    neutral: "border-line bg-hover text-muted",
    danger: "border-danger/30 bg-danger-soft text-danger",
    success: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
    warning: "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300",
    info: "border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-300",
  };
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium ${tones[tone]}`}>
      {children}
    </span>
  );
}

function StatusBadge({ user }: { user: UserProfile }) {
  const s = statusOf(user);
  if (s.status === "banned") return <Badge tone="danger">Banned</Badge>;
  if (s.status === "suspended") return <Badge tone="warning">Suspended</Badge>;
  return <Badge tone="success">Active</Badge>;
}

const KIND_BADGE: Record<PunishmentKind, { tone: "neutral" | "danger" | "success" | "warning" | "info"; label: string }> = {
  WARN: { tone: "warning", label: "Warning" },
  SUSPEND: { tone: "warning", label: "Suspension" },
  BAN: { tone: "danger", label: "Ban" },
  LIFT: { tone: "success", label: "Lifted" },
};

interface PanelProps {
  users: UserProfile[];
  logs: ModerationLogEntry[];
  onChanged: () => Promise<void>;
  onOpenIncidents: (email: string) => void;
}

/** Punishment center: pick an account, review its history, and take action with a recorded reason. */
export default function AdminPunishmentsPanel({ users, logs, onChanged, onOpenIncidents }: PanelProps) {
  const [query, setQuery] = useState("");
  const [selectedEmail, setSelectedEmail] = useState<string>("");
  const [section, setSection] = useState<"history" | "incidents">("history");
  const [history, setHistory] = useState<Punishment[] | null>(null);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [dialogAction, setDialogAction] = useState<PunishmentKind | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const q = query.trim().toLowerCase();
  const visibleUsers = useMemo(
    () =>
      users
        .filter((u) => !q || u.email.toLowerCase().includes(q) || (u.name || "").toLowerCase().includes(q))
        .slice(0, 200),
    [users, q]
  );
  const selected = users.find((u) => u.email === selectedEmail) || null;
  const incidents = useMemo(
    () =>
      logs
        .filter((l) => l.userEmail === selectedEmail)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [logs, selectedEmail]
  );

  useEffect(() => {
    if (!selectedEmail) {
      setHistory(null);
      return;
    }
    let cancelled = false;
    setHistory(null);
    setHistoryError(null);
    fetch(`/api/admin/punishments?email=${encodeURIComponent(selectedEmail)}`, { cache: "no-store" })
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || "Could not load history.");
        return data.punishments as Punishment[];
      })
      .then((list) => {
        if (!cancelled) setHistory(list);
      })
      .catch((err) => {
        if (!cancelled) setHistoryError(err.message);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedEmail, refreshKey]);

  const afterAction = async (message: string) => {
    setNotice(message);
    setDialogAction(null);
    setRefreshKey((k) => k + 1);
    await onChanged();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl text-ink">Punishments</h1>
        <p className="mt-1.5 text-sm text-muted">
          Choose an account to warn, suspend, or ban it. Every action is kept with its reason and the administrator who took it.
        </p>
      </div>

      {notice && (
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-300">
          <span className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            {notice}
          </span>
          <button type="button" onClick={() => setNotice(null)} className={secondaryButtonClass} aria-label="Dismiss">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-[320px_minmax(0,1fr)]">
        {/* Account picker */}
        <aside className={`${cardClass} flex flex-col gap-3 p-3`}>
          <label className="relative block">
            <span className="sr-only">Search accounts</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by email or name"
              className={`${inputClass} pl-9`}
            />
          </label>
          <ul className="max-h-[65vh] space-y-1 overflow-y-auto pr-1" aria-label="Accounts">
            {visibleUsers.length === 0 && <li className="px-2 py-6 text-center text-sm text-muted">No accounts match.</li>}
            {visibleUsers.map((u) => (
              <li key={u.id}>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedEmail(u.email);
                    setSection("history");
                    setNotice(null);
                  }}
                  aria-current={u.email === selectedEmail ? "true" : undefined}
                  className={`flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2.5 text-left text-sm transition-colors ${focusRing} ${
                    u.email === selectedEmail ? "bg-hover text-ink" : "text-muted hover:bg-hover/60 hover:text-ink"
                  }`}
                >
                  <span className="min-w-0">
                    <span className="block truncate text-ink">{u.email}</span>
                    <span className="block text-xs text-muted">{u.strikes ?? 0} strikes</span>
                  </span>
                  <StatusBadge user={u} />
                </button>
              </li>
            ))}
          </ul>
        </aside>

        {/* Account detail */}
        <section className="min-w-0 space-y-4">
          {!selected ? (
            <div className={`${cardClass} flex flex-col items-center gap-2 px-6 py-16 text-center`}>
              <Gavel className="h-7 w-7 text-muted" />
              <p className="text-sm font-medium text-ink">Select an account</p>
              <p className="text-sm text-muted">Its status, punishment history, and incidents will appear here.</p>
            </div>
          ) : (
            <>
              <div className={`${cardClass} space-y-4 p-5`}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="truncate text-lg font-medium text-ink">{selected.name || selected.email}</h2>
                    <p className="truncate font-mono text-xs text-muted">{selected.email}</p>
                    <p className="mt-1 text-xs text-muted">
                      Joined {new Date(selected.createdAt).toLocaleDateString()} · Plan {selected.plan || "FREE"}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge user={selected} />
                    <Badge tone="neutral">{selected.strikes ?? 0} strikes</Badge>
                    {statusOf(selected).until && (
                      <Badge tone="warning">Until {new Date(statusOf(selected).until as string).toLocaleString()}</Badge>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 border-t border-line pt-4">
                  <button type="button" onClick={() => setDialogAction("WARN")} className={secondaryButtonClass}>
                    <AlertTriangle className="h-3.5 w-3.5" />
                    <span>Warn</span>
                  </button>
                  <button type="button" onClick={() => setDialogAction("SUSPEND")} className={secondaryButtonClass}>
                    <Clock className="h-3.5 w-3.5" />
                    <span>Suspend…</span>
                  </button>
                  <button type="button" onClick={() => setDialogAction("BAN")} className={dangerButtonClass}>
                    <Ban className="h-3.5 w-3.5" />
                    <span>Ban</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setDialogAction("LIFT")}
                    disabled={statusOf(selected).status === "active"}
                    className={secondaryButtonClass}
                  >
                    <CheckCircle className="h-3.5 w-3.5" />
                    <span>Lift ban or suspension</span>
                  </button>
                </div>
              </div>

              <div className="flex gap-2" role="tablist" aria-label="Account detail">
                {(
                  [
                    ["history", `Punishment history${history ? ` (${history.length})` : ""}`],
                    ["incidents", `Incidents (${incidents.length})`],
                  ] as const
                ).map(([key, label]) => (
                  <button
                    key={key}
                    type="button"
                    role="tab"
                    aria-selected={section === key}
                    onClick={() => setSection(key)}
                    className={`rounded-xl px-3.5 py-2 text-sm transition-colors ${focusRing} ${
                      section === key ? "bg-hover font-medium text-ink" : "text-muted hover:bg-hover/60 hover:text-ink"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {section === "history" && (
                <div className={`${cardClass} p-2`}>
                  {historyError ? (
                    <p className="p-4 text-sm text-danger">{historyError}</p>
                  ) : history === null ? (
                    <p className="p-4 text-sm text-muted">Loading history…</p>
                  ) : history.length === 0 ? (
                    <p className="p-6 text-center text-sm text-muted">No punishments on record for this account.</p>
                  ) : (
                    <ul className="divide-y divide-line">
                      {history.map((p) => (
                        <li key={p.id} className="space-y-1.5 px-3 py-3.5">
                          <div className="flex flex-wrap items-center gap-2 text-xs">
                            <Badge tone={KIND_BADGE[p.kind].tone}>{KIND_BADGE[p.kind].label}</Badge>
                            {p.kind === "SUSPEND" && p.durationDays && (
                              <span className="text-muted">
                                {p.durationDays} day{p.durationDays === 1 ? "" : "s"}
                                {p.until ? `, until ${new Date(p.until).toLocaleString()}` : ""}
                              </span>
                            )}
                            {p.incidentId && (
                              <span className="font-mono text-muted">Incident {p.incidentId}</span>
                            )}
                          </div>
                          <p className="text-sm text-ink">{p.reason}</p>
                          <p className="text-xs text-muted">
                            <span className="font-mono">{p.adminEmail}</span> · {new Date(p.createdAt).toLocaleString()}
                          </p>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              {section === "incidents" && (
                <div className={`${cardClass} p-2`}>
                  {incidents.length === 0 ? (
                    <p className="p-6 text-center text-sm text-muted">No incidents for this account.</p>
                  ) : (
                    <ul className="divide-y divide-line">
                      {incidents.map((l) => (
                        <li key={l.id} className="flex flex-wrap items-center justify-between gap-3 px-3 py-3 text-sm">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-mono text-ink">{l.category}</span>
                              <Badge tone={l.tier === 1 ? "danger" : "warning"}>Tier {l.tier}</Badge>
                              <Badge tone="neutral">{l.status}</Badge>
                            </div>
                            <p className="mt-1 text-xs text-muted">
                              {new Date(l.createdAt).toLocaleString()}
                              {(l.adminNotes?.length ?? 0) > 0 ? ` · ${l.adminNotes?.length} staff note${l.adminNotes?.length === 1 ? "" : "s"}` : ""}
                            </p>
                          </div>
                          <button type="button" onClick={() => onOpenIncidents(selected.email)} className={secondaryButtonClass}>
                            Open in Moderation
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </>
          )}
        </section>
      </div>

      {dialogAction && selected && (
        <PunishmentDialog
          action={dialogAction}
          user={selected}
          incidents={incidents}
          onClose={() => setDialogAction(null)}
          onDone={afterAction}
        />
      )}
    </div>
  );
}

interface DialogProps {
  action: PunishmentKind;
  user: UserProfile;
  incidents: ModerationLogEntry[];
  onClose: () => void;
  onDone: (message: string) => Promise<void>;
}

/** The punishment form. The reason is required and saved with the record. */
function PunishmentDialog({ action, user, incidents, onClose, onDone }: DialogProps) {
  const [days, setDays] = useState(7);
  const [incidentId, setIncidentId] = useState("");
  const [reason, setReason] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !submitting) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, submitting]);

  const needsConfirm = action === "SUSPEND" || action === "BAN";
  const reasonRequired = action !== "LIFT";
  const reasonOk = reason.trim().length >= 3 && reason.trim().length <= 1000;
  const canSubmit = (!reasonRequired || reasonOk) && (!needsConfirm || confirmed) && !submitting;
  const endsAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);

  const summary: Record<PunishmentKind, string> = {
    WARN: "Adds one strike and emails the user a warning. Their access is not changed.",
    SUSPEND: `Blocks chat and API keys until ${endsAt.toLocaleString()}, then access returns on its own. The user is emailed the end date. The reason is not included in the email.`,
    BAN: "Blocks chat and API keys with no end date until someone lifts the ban. This action does not send an email to the user.",
    LIFT: "Restores chat and API access straight away and records the lift.",
  };

  const submit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: ACTION_ENDPOINT[action],
          userId: user.id,
          email: user.email,
          reason: reason.trim(),
          incidentId: incidentId || undefined,
          days: action === "SUSPEND" ? days : undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "The action could not be completed.");
        setSubmitting(false);
        return;
      }
      await onDone(data.message || "Action recorded.");
    } catch (_) {
      setError("Network error. Nothing was recorded. Try again.");
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onMouseDown={(e) => e.target === e.currentTarget && !submitting && onClose()}>
      <div role="dialog" aria-modal="true" aria-labelledby="punish-title" className={`${cardClass} max-h-[90vh] w-full max-w-lg space-y-5 overflow-y-auto p-6 shadow-menu`}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 id="punish-title" className="font-display text-xl text-ink">{ACTION_TITLE[action]}</h2>
            <p className="mt-1 break-all font-mono text-xs text-muted">{user.email}</p>
          </div>
          <button type="button" onClick={onClose} disabled={submitting} className={secondaryButtonClass} aria-label="Close">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        {action === "SUSPEND" && (
          <div className="space-y-2">
            <span className="text-sm font-medium text-ink">Length</span>
            <div className="flex flex-wrap gap-2">
              {SUSPEND_LENGTHS.map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setDays(n)}
                  aria-pressed={days === n}
                  className={`rounded-xl border px-3 py-1.5 text-sm transition-colors ${focusRing} ${
                    days === n ? "border-accent bg-accent/10 text-ink" : "border-line bg-card text-muted hover:text-ink"
                  }`}
                >
                  {n} day{n === 1 ? "" : "s"}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-2">
          <label htmlFor="punish-incident" className="text-sm font-medium text-ink">Linked incident (optional)</label>
          <select id="punish-incident" value={incidentId} onChange={(e) => setIncidentId(e.target.value)} className={inputClass}>
            <option value="">No linked incident</option>
            {incidents.map((l) => (
              <option key={l.id} value={l.id}>
                {l.category} · {new Date(l.createdAt).toLocaleDateString()} · {l.status}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label htmlFor="punish-reason" className="text-sm font-medium text-ink">
            Reason {reasonRequired ? "(required)" : "(optional)"}
          </label>
          <textarea
            id="punish-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={4}
            maxLength={1000}
            placeholder="Describe what happened and which policy applies. This is kept in the punishment history."
            className={`${inputClass} resize-y`}
          />
          <p className="text-xs text-muted">{reason.trim().length}/1000 · Visible to administrators only.</p>
        </div>

        <div className="rounded-xl border border-line bg-app p-3.5 text-sm text-muted">{summary[action]}</div>

        {needsConfirm && (
          <label className="flex items-start gap-2.5 text-sm text-ink">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
              className="mt-0.5 h-4 w-4 accent-accent"
            />
            <span>I have reviewed this account&apos;s history and this action follows policy.</span>
          </label>
        )}

        {error && <p className="text-sm text-danger" role="alert">{error}</p>}

        <div className="flex justify-end gap-2 border-t border-line pt-4">
          <button type="button" onClick={onClose} disabled={submitting} className={secondaryButtonClass}>
            Cancel
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={!canSubmit}
            className={action === "BAN" || action === "SUSPEND" ? dangerButtonClass : primaryButtonClass}
          >
            {submitting ? "Recording…" : `Confirm ${ACTION_TITLE[action].split(" ")[0].toLowerCase()}`}
          </button>
        </div>
      </div>
    </div>
  );
}
