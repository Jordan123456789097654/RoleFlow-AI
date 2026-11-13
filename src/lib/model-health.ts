import { MODEL_IDS, SPECS } from "@/lib/models";
import { classifyGroqError, getKeyOrder, reportKeyFailure, reportKeySuccess } from "@/lib/groq-keys";
import type { ModelId } from "@/types";

/**
 * Per-model health for status monitoring. Each model gets a tiny one-token request through the same
 * key pool the chat uses. Results are cached, so monitors polling the endpoint cannot use up the
 * model quota that real users need. The cache lives in each server instance.
 */

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const CACHE_MS = 5 * 60_000;
const PROBE_TIMEOUT_MS = 15_000;
/** Answers slower than this count as degraded even though they succeeded. */
const SLOW_MS = 5_000;
/** At most this many keys are tried per model, so a probe stays well within a monitor's timeout. */
const MAX_KEYS_PER_PROBE = 2;

export type ModelHealthStatus = "operational" | "degraded" | "down";

export interface ModelHealth {
  id: ModelId;
  name: string;
  status: ModelHealthStatus;
  latencyMs: number | null;
  checkedAt: string;
  detail: string;
}

const cache = new Map<ModelId, ModelHealth>();
const inFlight = new Map<ModelId, Promise<ModelHealth>>();

async function probe(id: ModelId): Promise<ModelHealth> {
  const spec = SPECS[id];
  const base = { id, name: spec.name, checkedAt: new Date().toISOString() };
  const keys = getKeyOrder().slice(0, MAX_KEYS_PER_PROBE);

  if (keys.length === 0) {
    return { ...base, status: "down", latencyMs: null, detail: "Inference API keys are not configured." };
  }

  const failures = new Set<string>();
  let rateLimited = false;

  for (const state of keys) {
    const started = Date.now();
    try {
      const res = await fetch(GROQ_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${state.key}` },
        body: JSON.stringify({
          model: spec.backend,
          messages: [{ role: "user", content: "ping" }],
          max_tokens: 1,
          temperature: 0,
        }),
        signal: AbortSignal.timeout(PROBE_TIMEOUT_MS),
      });
      const latencyMs = Date.now() - started;

      if (res.ok) {
        reportKeySuccess(state);
        const slow = latencyMs >= SLOW_MS;
        return {
          ...base,
          status: slow ? "degraded" : "operational",
          latencyMs,
          detail: slow ? "Responding slowly." : "Responding normally.",
        };
      }

      const body = await res.text().catch(() => "");
      const failure = classifyGroqError(res.status, body, res.headers.get("retry-after"));
      if (!failure) {
        // A request-level rejection of the probe itself points at the model, so it counts as down.
        return { ...base, status: "down", latencyMs, detail: `The model rejected the health check (HTTP ${res.status}).` };
      }
      reportKeyFailure(state, failure.kind, failure.retryAfterMs);
      failures.add(failure.kind);
      if (failure.kind === "rate_limit") rateLimited = true;
    } catch {
      reportKeyFailure(state, "server");
      failures.add("network");
    }
  }

  // Rate limits mean the model is up but busy, so they are degraded. Anything else is down.
  if (rateLimited && failures.size === 1) {
    return { ...base, status: "degraded", latencyMs: null, detail: "Rate limited. Requests may be slow or fail." };
  }
  return { ...base, status: "down", latencyMs: null, detail: "Every API key failed the health check." };
}

function cachedProbe(id: ModelId): Promise<ModelHealth> {
  const hit = cache.get(id);
  if (hit && Date.now() - Date.parse(hit.checkedAt) < CACHE_MS) return Promise.resolve(hit);

  const pending = inFlight.get(id);
  if (pending) return pending;

  const next = probe(id)
    .catch((): ModelHealth => ({
      id,
      name: SPECS[id].name,
      status: "down",
      latencyMs: null,
      checkedAt: new Date().toISOString(),
      detail: "The health check itself failed.",
    }))
    .then((result) => {
      cache.set(id, result);
      return result;
    })
    .finally(() => inFlight.delete(id));
  inFlight.set(id, next);
  return next;
}

/** Health of one model, for its own monitor. Uses the same cache as the full list. */
export function getOneModelHealth(id: ModelId): Promise<ModelHealth> {
  return cachedProbe(id);
}

/** Health of every model, using cached results where they are still fresh. */
export function getModelHealth(): Promise<ModelHealth[]> {
  return Promise.all(MODEL_IDS.map((id) => cachedProbe(id)));
}

/** Generic, visitor-safe wording. Raw provider and configuration details stay server-side. */
const PUBLIC_DETAIL: Record<ModelHealthStatus, string> = {
  operational: "Responding normally.",
  degraded: "Responding slowly or rate limited. Replies may take longer.",
  down: "Not responding. The team is looking into it.",
};

/** Strips internal detail (key state, provider errors) before a model's health leaves the server. */
export function toPublicModelStatus(m: ModelHealth) {
  return {
    id: m.id,
    name: m.name,
    status: m.status,
    latencyMs: m.latencyMs,
    checkedAt: m.checkedAt,
    detail: PUBLIC_DETAIL[m.status],
  };
}

export function overallStatus(models: ModelHealth[]): ModelHealthStatus {
  if (models.some((m) => m.status === "down")) return "down";
  if (models.some((m) => m.status === "degraded")) return "degraded";
  return "operational";
}
