"use client";

import { useEffect, useState } from "react";
import type { PublicStatus } from "@/lib/status";

/**
 * Loads /api/status and refreshes it on an interval. `error` is set only when no fresh data can be
 * loaded, so a single failed poll does not blank a status that was already showing.
 */
export function useSystemStatus(intervalMs = 60_000) {
  const [data, setData] = useState<PublicStatus | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let alive = true;

    const load = async () => {
      try {
        const res = await fetch("/api/status", { cache: "no-store" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = (await res.json()) as PublicStatus;
        if (alive) {
          setData(json);
          setError(false);
        }
      } catch {
        if (alive) setError(true);
      }
    };

    load();
    const timer = setInterval(load, intervalMs);
    return () => {
      alive = false;
      clearInterval(timer);
    };
  }, [intervalMs]);

  return { data, error, loading: !data && !error };
}
