"use client";

import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { AlertTriangle, Download } from "lucide-react";

/** Renders the internal handbook for admins. Content comes from an admin-only API route. */
export default function AdminHandbookPanel() {
  const [markdown, setMarkdown] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/admin/handbook", { cache: "no-store" })
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || "The handbook could not be loaded.");
        return data as { markdown: string };
      })
      .then((data) => {
        if (!cancelled) setMarkdown(data.markdown);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-3xl text-ink">Handbook</h1>
          <p className="mt-1.5 text-sm text-muted">Confidential. Visible to administrators only.</p>
        </div>
        <a
          href="/api/admin/handbook?format=docx"
          className="inline-flex items-center gap-2 self-start rounded-xl border border-line bg-card px-4 py-2 text-sm font-medium text-ink transition-colors hover:bg-hover sm:self-auto"
        >
          <Download className="h-4 w-4" />
          <span>Download .docx</span>
        </a>
      </div>

      {error ? (
        <div className="flex items-center gap-3 rounded-2xl border border-danger/30 bg-danger-soft p-5 text-sm text-danger">
          <AlertTriangle className="h-5 w-5 shrink-0" />
          <span>{error}</span>
        </div>
      ) : markdown === null ? (
        <p className="text-sm text-muted">Loading handbook…</p>
      ) : (
        <article className="rounded-2xl border border-line bg-card p-6 text-sm leading-relaxed text-ink sm:p-8 [&_h1]:font-display [&_h1]:text-2xl [&_h2]:mt-8 [&_h2]:font-display [&_h2]:text-xl [&_h3]:mt-6 [&_h3]:font-medium [&_p]:my-3 [&_ul]:my-3 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:my-3 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:my-1 [&_a]:text-accent [&_a]:underline [&_strong]:font-semibold [&_code]:font-mono [&_table]:my-4 [&_table]:block [&_table]:overflow-x-auto [&_th]:border [&_th]:border-line [&_th]:bg-app [&_th]:px-3 [&_th]:py-2 [&_th]:text-left [&_th]:font-medium [&_td]:border [&_td]:border-line [&_td]:px-3 [&_td]:py-2 [&_td]:align-top">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{markdown}</ReactMarkdown>
        </article>
      )}
    </div>
  );
}
