"use client";

import React, { useEffect, useState } from "react";
import { TOAST_EVENT, ToastDetail } from "@/lib/toast";

const VISIBLE_MS = 3200;
const MAX_VISIBLE = 3;

/** Renders toasts sent with toast(). Mount once, near the root of a page. */
export const Toaster: React.FC = () => {
  const [items, setItems] = useState<ToastDetail[]>([]);

  useEffect(() => {
    const onToast = (event: Event) => {
      const detail = (event as CustomEvent<ToastDetail>).detail;
      setItems((prev) => [...prev.slice(-(MAX_VISIBLE - 1)), detail]);
      window.setTimeout(() => {
        setItems((prev) => prev.filter((t) => t.id !== detail.id));
      }, VISIBLE_MS);
    };
    window.addEventListener(TOAST_EVENT, onToast);
    return () => window.removeEventListener(TOAST_EVENT, onToast);
  }, []);

  if (items.length === 0) return null;

  return (
    <div
      aria-live="polite"
      className="fixed bottom-28 left-1/2 -translate-x-1/2 z-[60] flex flex-col items-center gap-2 pointer-events-none px-4 w-full max-w-sm"
    >
      {items.map((t) => (
        <div
          key={t.id}
          role={t.tone === "error" ? "alert" : "status"}
          className={`pointer-events-auto rounded-lg border px-4 py-2.5 text-sm shadow-menu bg-card animate-message ${
            t.tone === "error" ? "border-red-500/40 text-red-600" : "border-line text-ink"
          }`}
        >
          {t.message}
        </div>
      ))}
    </div>
  );
};
