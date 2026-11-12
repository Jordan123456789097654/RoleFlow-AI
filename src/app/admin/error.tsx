"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RefreshCw, ArrowLeft } from "lucide-react";

/**
 * Shown when the admin console throws while rendering. Surfaces the error message and digest
 * instead of a blank page, so the failure can be reported and retried.
 */
export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Admin console error:", error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-app p-6 text-ink">
      <div className="w-full max-w-md rounded-2xl border border-line bg-card p-8 shadow-menu">
        <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-danger-soft text-danger">
          <AlertTriangle className="h-6 w-6" />
        </div>
        <h1 className="mb-2 font-display text-2xl">The admin console hit an error</h1>
        <p className="mb-4 text-sm leading-relaxed text-muted">
          Nothing was changed. You can retry, or go back to chat and try again.
        </p>
        <pre className="mb-6 max-h-40 overflow-auto rounded-xl border border-line bg-panel p-3 text-xs text-muted whitespace-pre-wrap break-words">
          {error.message || "Unknown error"}
          {error.digest ? `\nDigest: ${error.digest}` : ""}
        </pre>
        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={reset}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
          >
            <RefreshCw className="h-4 w-4" />
            Retry
          </button>
          <Link
            href="/chat"
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-line bg-card px-4 py-2.5 text-sm font-medium text-ink transition-colors hover:bg-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to chat
          </Link>
        </div>
      </div>
    </div>
  );
}
