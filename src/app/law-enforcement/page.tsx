"use client";

import React, { useState } from "react";
import Link from "next/link";
import { LAW_REQUEST_TYPES } from "@/lib/law-request-types";

const focusRing = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40";
const inputClass = `w-full rounded-xl border border-line bg-card px-3.5 py-2.5 text-sm text-ink placeholder:text-muted/70 focus:outline-none focus:border-accent/60 ${focusRing}`;
const labelClass = "mb-1.5 block text-sm font-medium text-ink";

export default function LawEnforcementRequestPage() {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ reference: string; emergency: boolean } | null>(null);
  const [requestType, setRequestType] = useState("subpoena");
  const [certified, setCertified] = useState(false);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const form = new FormData(e.currentTarget);
    const payload = Object.fromEntries(form.entries());
    try {
      const res = await fetch("/api/law-enforcement/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...payload, requestType, certified }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Your request could not be submitted.");
      setResult({ reference: data.reference, emergency: Boolean(data.emergency) });
      e.currentTarget.reset();
      setCertified(false);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="mx-auto max-w-2xl space-y-8 px-5 py-12">
      <header className="space-y-3">
        <h1 className="font-display text-3xl text-ink">Law enforcement requests</h1>
        <p className="text-sm leading-relaxed text-muted">
          Use this form to submit a subpoena, court order, search warrant, emergency disclosure request, or preservation
          request. Every request is reviewed by hand before any action is taken. Before you submit, read the{" "}
          <Link href="/law" className="text-accent underline underline-offset-2">law enforcement guide</Link>.
        </p>
        <p className="text-sm text-muted">
          Submit the form here, then email the signed legal document to support@roleflow.site with your reference number.
          Business hours are 9:00 AM to 5:00 PM EST, Monday to Friday.
        </p>
      </header>

      {result ? (
        <div className="space-y-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-5">
          <p className="text-sm font-medium text-ink">Your request was received.</p>
          <p className="text-sm text-ink">
            Reference: <span className="font-mono">{result.reference}</span>
          </p>
          <p className="text-sm text-muted">
            A confirmation has been sent to your agency contact email. Quote this reference in all correspondence.
            {result.emergency && " This emergency request has been flagged for priority review."}
          </p>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-5">
          <div>
            <label htmlFor="requestType" className={labelClass}>Type of request</label>
            <select id="requestType" name="requestType" value={requestType} onChange={(e) => setRequestType(e.target.value)} className={inputClass}>
              {LAW_REQUEST_TYPES.map((t) => (
                <option key={t.id} value={t.id}>{t.label}</option>
              ))}
            </select>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="agencyName" className={labelClass}>Agency name</label>
              <input id="agencyName" name="agencyName" required className={inputClass} />
            </div>
            <div>
              <label htmlFor="officerName" className={labelClass}>Officer name</label>
              <input id="officerName" name="officerName" required className={inputClass} />
            </div>
            <div>
              <label htmlFor="badgeId" className={labelClass}>Badge or ID number</label>
              <input id="badgeId" name="badgeId" required className={inputClass} />
            </div>
            <div>
              <label htmlFor="caseNumber" className={labelClass}>Case number</label>
              <input id="caseNumber" name="caseNumber" required className={inputClass} />
            </div>
            <div>
              <label htmlFor="accountIdentifier" className={labelClass}>Account identifier</label>
              <input id="accountIdentifier" name="accountIdentifier" required placeholder="RoleFlow account email or user ID" className={inputClass} />
            </div>
            <div>
              <label htmlFor="contactEmail" className={labelClass}>Agency contact email</label>
              <input id="contactEmail" name="contactEmail" type="email" required className={inputClass} />
            </div>
          </div>

          <div>
            <label htmlFor="statement" className={labelClass}>
              Statement{requestType === "emergency_disclosure" ? " (describe the emergency and the risk of death or serious injury)" : " (describe the request and its legal basis)"}
            </label>
            <textarea id="statement" name="statement" required minLength={20} rows={6} maxLength={4000} className={inputClass} />
            <p className="mt-1.5 text-xs text-muted">
              Include the legal basis, the records requested, and the time period. For emergency requests, state the
              emergency in writing and sign the statement with your name and badge number.
            </p>
          </div>

          <label className="flex items-start gap-3 rounded-xl border border-line bg-card p-4 text-sm leading-relaxed text-ink">
            <input
              type="checkbox"
              checked={certified}
              onChange={(e) => setCertified(e.target.checked)}
              className="mt-1 h-4 w-4 shrink-0"
            />
            <span>
              I certify that I am an authorized representative of the agency named above, that this request is made under
              valid legal process or emergency authority, and that the information I provide is accurate. I understand that
              knowingly giving false information to obtain records may be a crime.
            </span>
          </label>

          {error && <p className="text-sm text-danger" role="alert">{error}</p>}

          <button
            type="submit"
            disabled={submitting || !certified}
            className={`inline-flex items-center rounded-xl bg-accent px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-50 ${focusRing}`}
          >
            {submitting ? "Submitting…" : "Submit request"}
          </button>
        </form>
      )}
    </main>
  );
}
