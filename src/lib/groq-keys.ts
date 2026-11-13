/**
 * Groq API key pool with per-key cooldowns.
 *
 * Keys come from GROQ_API_KEYS (comma-separated). A key that fails is put on cooldown so the
 * next requests go straight to a working key instead of retrying the dead one first. A key that
 * is out of credits or rejected gets a long cooldown; a rate-limited key gets a short one. When
 * every key is cooling down, the one that becomes usable soonest is tried anyway, so a request
 * never fails just because cooldowns are still running.
 *
 * This module has no imports from the rest of the app, so it can be used from anywhere
 * (chat, titles, compaction, admin stats) without circular dependencies.
 */

export type KeyFailureKind = "auth" | "quota" | "rate_limit" | "server";

export interface KeyState {
  key: string;
  label: string;
  cooldownUntil: number;
  reason?: KeyFailureKind;
}

/** How long a key sits out after each kind of failure. */
const COOLDOWN_MS: Record<KeyFailureKind, number> = {
  auth: 30 * 60_000,
  quota: 30 * 60_000,
  rate_limit: 60_000,
  server: 15_000,
};

/** Upper bound on any Retry-After value we honor. */
const MAX_RETRY_AFTER_MS = 10 * 60_000;

let pool: KeyState[] = [];
let poolSource: string | null = null;
let cursor = 0;

export function keyLabel(key: string): string {
  return `${key.slice(0, 7)}...${key.slice(-3)}`;
}

/** Re-reads GROQ_API_KEYS when it changes, keeping the cooldown state of keys that remain. */
function syncPool(): KeyState[] {
  const raw: string = process.env.GROQ_API_KEYS || "";
  if (raw === poolSource) return pool;

  const entries: string[] = raw.split(",").map((k: string) => k.trim()).filter(Boolean);
  const ignored: string[] = entries.filter((k: string) => !k.startsWith("gsk_"));
  if (ignored.length > 0) {
    console.warn(`Ignored ${ignored.length} GROQ_API_KEYS entr${ignored.length === 1 ? "y" : "ies"} that do not start with "gsk_".`);
  }

  const previous = new Map<string, KeyState>(pool.map((s): [string, KeyState] => [s.key, s]));
  const unique: string[] = Array.from(new Set<string>(entries.filter((k: string) => k.startsWith("gsk_"))));
  pool = unique.map((k): KeyState => previous.get(k) ?? { key: k, label: keyLabel(k), cooldownUntil: 0 });
  poolSource = raw;
  cursor = 0;
  return pool;
}

/**
 * Keys in the order to try right now. Usable keys come first, starting after the last key that
 * succeeded so load spreads across the pool. Cooling-down keys follow, soonest-ready first.
 */
export function getKeyOrder(now: number = Date.now()): KeyState[] {
  const states = syncPool();
  const n = states.length;
  const ready: KeyState[] = [];
  const cooling: KeyState[] = [];
  for (let i = 0; i < n; i++) {
    const state = states[(cursor + i) % n];
    (state.cooldownUntil <= now ? ready : cooling).push(state);
  }
  cooling.sort((a, b) => a.cooldownUntil - b.cooldownUntil);
  return [...ready, ...cooling];
}

export function reportKeySuccess(state: KeyState): void {
  state.cooldownUntil = 0;
  state.reason = undefined;
  const index = pool.indexOf(state);
  if (index !== -1) cursor = (index + 1) % pool.length;
}

export function reportKeyFailure(state: KeyState, kind: KeyFailureKind, retryAfterMs?: number): void {
  const ms = Math.min(retryAfterMs ?? COOLDOWN_MS[kind], MAX_RETRY_AFTER_MS);
  state.cooldownUntil = Date.now() + ms;
  state.reason = kind;
}

/**
 * Maps a non-2xx Groq response to a key failure. Returns null for request-level errors (400, 404,
 * 422): those come from the request itself, so another key would fail the same way.
 */
export function classifyGroqError(
  status: number,
  body: string,
  retryAfterHeader?: string | null
): { kind: KeyFailureKind; retryAfterMs?: number } | null {
  const billing = /quota|credit|billing|spend|insufficient|per day|\btpd\b|daily/i;
  // Out-of-credit responses are not always 402/429. Check the body before treating a 400 as a request error.
  if ((status === 400 || status === 404 || status === 422) && billing.test(body)) return { kind: "quota" };
  if (status === 400 || status === 404 || status === 422) return null;
  if (status === 401 || status === 402 || status === 403) return { kind: "auth" };
  if (status === 429) {
    // Daily or billing exhaustion will not clear in a minute, so it gets the long cooldown.
    if (billing.test(body)) return { kind: "quota" };
    const seconds = Number(retryAfterHeader);
    return {
      kind: "rate_limit",
      retryAfterMs: Number.isFinite(seconds) && seconds > 0 ? seconds * 1000 : undefined,
    };
  }
  return { kind: "server" };
}

/** Pool summary for the admin panel. Contains masked labels only, never full keys. */
export function getKeyPoolStatus(now: number = Date.now()) {
  const states = syncPool();
  const cooling = states.filter((s) => s.cooldownUntil > now);
  return {
    total: states.length,
    labels: states.map((s) => s.label),
    available: states.length - cooling.length,
    cooling: cooling.map((s) => ({
      label: s.label,
      reason: s.reason ?? "unknown",
      retryAt: new Date(s.cooldownUntil).toISOString(),
    })),
  };
}
