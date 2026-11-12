/**
 * Sliding-window rate limiter.
 *
 * State lives in process memory, so limits are enforced per server instance.
 * On serverless platforms with many instances, the effective limit is higher
 * than the nominal one. For strict enforcement, back this with Postgres or Redis.
 */

export interface RateLimitRule {
  windowMs: number;
  max: number;
}

export interface RateLimitResult {
  limited: boolean;
  retryAfterSeconds: number;
}

const buckets = new Map<string, number[]>();
const PRUNE_THRESHOLD = 10_000;
const IDLE_MS = 60 * 60 * 1000;

function prune(now: number): void {
  buckets.forEach((hits, key) => {
    const last = hits[hits.length - 1];
    if (last === undefined || now - last > IDLE_MS) buckets.delete(key);
  });
}

export function checkRateLimit(key: string, rule: RateLimitRule): RateLimitResult {
  const now = Date.now();
  if (buckets.size > PRUNE_THRESHOLD) prune(now);

  const hits = (buckets.get(key) || []).filter((t) => now - t < rule.windowMs);

  if (hits.length >= rule.max) {
    buckets.set(key, hits);
    const retryAfterSeconds = Math.ceil((hits[0] + rule.windowMs - now) / 1000);
    return { limited: true, retryAfterSeconds: Math.max(1, retryAfterSeconds) };
  }

  hits.push(now);
  buckets.set(key, hits);
  return { limited: false, retryAfterSeconds: 0 };
}

export const RATE_LIMITS = {
  /** Every caller, per client IP. */
  ipPerMinute: { windowMs: 60_000, max: 60 },
  /** Guests get a tighter per-IP cap because their IDs come from the client. */
  guestIpPerMinute: { windowMs: 60_000, max: 10 },
  /** Signed-in accounts, keyed on the verified user ID. */
  userPerMinute: { windowMs: 60_000, max: 20 },
} as const;
