"use client";

import React, { useCallback, useEffect, useState } from "react";
import { RefreshCw, Scale } from "lucide-react";
import type { LawRequestRecord, LawRequestStatus } from "@/types";
import { LAW_REQUEST_TYPES } from "@/lib/law-request-types";

const focusRing = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40";
const secondaryButtonClass = `inline-flex items-center gap-1.5 rounded-xl border border-line bg-card px-3 py-1.5 text-xs font-medium text-ink transition-colors hover:bg-hover disabled:cursor-not-allowed disabled:opacity-50 ${focusRing}`;
const primaryButtonClass = `inline-flex items-center gap-2 rounded-xl bg-accent px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-50 ${focusRing}`;
const cardClass = "rounded-2xl border border-line bg-card";
const textareaClass = `w-full rounded-xl border border-line bg-app px-3.5 py-2.5 text-sm text-ink focus:outline-none focus:border-accent/60 ${focusRing}`;

/** Days left in a preservation hold, or "expired". Shown so reviewers see holds that are about to lapse. */
function holdStatus(iso: string): { text: string; urgent: boolean } {
  const days = Math.ceil((Date.parse(iso) - Date.now()) / 86400000);
  if (days <= 0) return { text: "expired", urgent: true };
  return { text: `${days} day${days === 1 ? "" : "s"} left`, urgent: days <= 14 };
}

const STATUS_LABEL: Record<LawRequestStatus, string> = {
  received: "Received",
  in_review: "In review",
  closed: "Closed",
  rejected: "Rejected",
};

/** Admin queue for requests submitted at /law-enforcement. Every request is reviewed by hand. */
export default function AdminLawRequestsPanel() {
  const [requests, setRequests] = useState<LawRequestRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [savingId, setSavingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/law-requests", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not load requests.");
      setRequests(data.requests);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function update(id: string, status: Exclude<LawRequestStatus, "received">) {
    setSavingId(id);
    setError(null);
    try {
      const res = await fetch("/api/admin/law-requests", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status, reviewNote: notes[id] || "" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not update the request.");
      setRequests((list) => list.map((r) => (r.id === id ? data.request : r)));
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSavingId(null);
    }
  }

  // Emergency requests and the oldest open requests come first.
  const sorted = [...requests].sort((a, b) => {
    const aOpen = a.status === "received" || a.status === "in_review" ? 0 : 1;
    const bOpen = b.status === "received" || b.status === "in_review" ? 0 : 1;
    if (aOpen !== bOpen) return aOpen - bOpen;
    if (a.emergency !== b.emergency) return a.emergency ? -1 : 1;
    return a.createdAt.localeCompare(b.createdAt);
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-1.5">
          <h3 className="flex items-center gap-2 font-display text-2xl text-ink">
            <Scale className="h-5 w-5" />
            <span>Law enforcement requests</span>
          </h3>
          <p className="text-sm text-muted">
            Requests from /law-enforcement. Verify the agency and legal document by hand before any records are released.
          </p>
        </div>
        <button type="button" onClick={load} disabled={loading} className={secondaryButtonClass}>
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {error && <p className="text-sm text-danger" role="alert">{error}</p>}
      {!loading && sorted.length === 0 && <p className="text-sm text-muted">No requests yet.</p>}

      {sorted.map((r) => {
        const typeLabel = LAW_REQUEST_TYPES.find((t) => t.id === r.requestType)?.label ?? r.requestType;
        const open = r.status === "received" || r.status === "in_review";
        return (
          <article key={r.id} className={`${cardClass} space-y-4 p-5 ${r.emergency && open ? "border-danger/50" : ""}`}>
            <div className="flex flex-wrap items-center gap-2 border-b border-line pb-3">
              <span className="font-mono text-sm text-ink">{r.reference}</span>
              <span className="rounded-full border border-line px-2 py-0.5 text-[11px] text-muted">{typeLabel}</span>
              {r.emergency && (
                <span className="rounded-full border border-danger/30 bg-danger-soft px-2 py-0.5 text-[11px] font-medium text-danger">EMERGENCY</span>
              )}
              <span className="rounded-full border border-line bg-app px-2 py-0.5 text-[11px] text-muted">{STATUS_LABEL[r.status]}</span>
              <span className="ml-auto text-xs tabular-nums text-muted">{new Date(r.createdAt).toLocaleString("en-US", { timeZone: "America/New_York", timeZoneName: "short" })}</span>
            </div>

            <dl className="grid gap-3 text-sm sm:grid-cols-2">
              <div><dt className="text-xs text-muted">Agency</dt><dd className="text-ink">{r.agencyName}</dd></div>
              <div><dt className="text-xs text-muted">Officer</dt><dd className="text-ink">{r.officerName} · badge {r.badgeId}</dd></div>
              <div><dt className="text-xs text-muted">Case number</dt><dd className="font-mono text-ink">{r.caseNumber}</dd></div>
              <div><dt className="text-xs text-muted">Account identifier</dt><dd className="font-mono text-ink">{r.accountIdentifier}</dd></div>
              <div><dt className="text-xs text-muted">Agency contact</dt><dd className="text-ink">{r.contactEmail}</dd></div>
              {r.preservationExpiresAt && (() => {
                const hold = holdStatus(r.preservationExpiresAt);
                return (
                  <div>
                    <dt className="text-xs text-muted">Preserve until</dt>
                    <dd className={hold.urgent ? "text-danger" : "text-ink"}>
                      {new Date(r.preservationExpiresAt).toLocaleDateString()} · {hold.text}
                    </dd>
                  </div>
                );
              })()}
            </dl>

            <div>
              <div className="mb-1 text-xs text-muted">Statement</div>
              <pre className="whitespace-pre-wrap rounded-xl border border-line bg-app p-3 font-sans text-sm text-ink">{r.statement}</pre>
            </div>

            {r.reviewNote && <p className="text-xs text-muted">Review note: {r.reviewNote}{r.reviewedBy ? ` (${r.reviewedBy})` : ""}</p>}

            <div className="space-y-3">
              <textarea
                className={textareaClass}
                rows={2}
                maxLength={2000}
                placeholder="Review note (kept on the request)"
                value={notes[r.id] ?? ""}
                onChange={(e) => setNotes((n) => ({ ...n, [r.id]: e.target.value }))}
              />
              <div className="flex flex-wrap gap-2">
                <button type="button" className={secondaryButtonClass} disabled={savingId === r.id} onClick={() => update(r.id, "in_review")}>Mark in review</button>
                <button type="button" className={primaryButtonClass} disabled={savingId === r.id} onClick={() => update(r.id, "closed")}>Close</button>
                <button type="button" className={secondaryButtonClass} disabled={savingId === r.id} onClick={() => update(r.id, "rejected")}>Reject</button>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}
