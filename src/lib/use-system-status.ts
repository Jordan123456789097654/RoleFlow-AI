"use client";

import { useCallback, useEffect, useState } from "react";
import type { PublicStatus } from "@/lib/status";

/**
 * Loads /api/status and refreshes it on a 15-second interval for real-time live telemetry.
 * Provides a manual `refresh()` trigger, an `isRefreshing` indicator, and a live second ticker.
 */
export function useSystemStatus(intervalMs = 15_000) {
  const [data, setData] = useState<PublicStatus | null>(null);
  const [error, setError] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [, setTick] = useState(0);

  const fetchStatus = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch("/api/status", { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = (await res.json()) as PublicStatus;
      setData(json);
      setError(false);
    } catch {
      setError(true);
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
    const pollTimer = setInterval(fetchStatus, intervalMs);
    const tickTimer = setInterval(() => setTick((t) => (t + 1) % 1000), 1000);
    return () => {
      clearInterval(pollTimer);
      clearInterval(tickTimer);
    };
  }, [fetchStatus, intervalMs]);

  return {
    data,
    error,
    loading: !data && !error,
    isRefreshing,
    refresh: fetchStatus,
  };
}
