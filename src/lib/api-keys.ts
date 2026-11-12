import crypto from "crypto";
import { db, getTodayDateString } from "@/lib/db";
import { ApiKey } from "@/types";

export const API_KEY_PREFIX = "rf_live_";

export function hashApiKey(key: string): string {
  return crypto.createHash("sha256").update(key).digest("hex");
}

/** Creates a new plaintext key. Only the hash and the short display prefix should be stored. */
export function generateApiKey(): { key: string; prefix: string; hash: string } {
  const key = API_KEY_PREFIX + crypto.randomBytes(32).toString("base64url");
  return { key, prefix: key.slice(0, 12), hash: hashApiKey(key) };
}

export function newApiKeyId(): string {
  return "key_" + crypto.randomBytes(8).toString("hex");
}

/** Requests made on the key's current UTC day. Stale counters count as zero. */
export function getKeyDailyCount(record: ApiKey): number {
  return record.dailyDate === getTodayDateString() ? record.dailyCount ?? 0 : 0;
}

export type KeyAuthResult =
  | { ok: true; record: ApiKey }
  | { ok: false; status: 401 | 403; code: string; message: string };

/**
 * Validates an Authorization header value ("Bearer rf_live_...") and returns the stored key.
 * Revoked and expired keys are rejected here. Owner-level checks (ban, maintenance, quota)
 * are the caller's job.
 */
export async function authenticateApiKey(authorization: string | null): Promise<KeyAuthResult> {
  const match = authorization?.match(/^Bearer\s+(\S+)\s*$/i);
  const presented = match?.[1];
  if (!presented || !presented.startsWith(API_KEY_PREFIX)) {
    return {
      ok: false,
      status: 401,
      code: "invalid_api_key",
      message: "Missing or malformed API key. Send it as 'Authorization: Bearer rf_live_...'.",
    };
  }

  const record = await db.getApiKeyByHash(hashApiKey(presented));
  if (!record) {
    return { ok: false, status: 401, code: "invalid_api_key", message: "Invalid API key." };
  }
  if (record.status !== "active") {
    return { ok: false, status: 403, code: "key_revoked", message: "This API key has been revoked." };
  }
  if (record.expiresAt && Date.parse(record.expiresAt) <= Date.now()) {
    return { ok: false, status: 403, code: "key_expired", message: "This API key has expired. Create a new one in Settings." };
  }
  return { ok: true, record };
}
