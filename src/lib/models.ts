import type { EffortLevel, ModelId } from "@/types";

/**
 * Single source of truth for the RoleFlow model lineup.
 *
 * Four tiers, top to bottom:
 *   Apex 1.0 (highest-intelligence frontier) > Omni 1.0 (frontier reasoning)
 *   > Genesis 1.5 (balanced flagship) > Flash 2.0 (ultra-fast)
 *
 * Every route, component, and stored record resolves model IDs through resolveModelId(),
 * so retired IDs keep working and map to their successor. Genesis 1.5 keeps the
 * "roleflow-genesis-1" ID so saved chats and API keys continue to work.
 */

export const MODEL_IDS: readonly ModelId[] = [
  "roleflow-apex-1",
  "roleflow-omni-1",
  "roleflow-genesis-1",
  "roleflow-flash-2",
];

/** Default for new chats and for API requests that omit `model`. */
export const DEFAULT_MODEL: ModelId = "roleflow-flash-2";

/** The only model guests (signed-out users) can use. Enforced on the server, not just in the UI. */
export const GUEST_MODEL: ModelId = "roleflow-flash-2";

export function isGuestAllowedModel(id: ModelId): boolean {
  return id === GUEST_MODEL;
}

/** Retired IDs and the model that now serves them. Saved chats and API keys keep working. */
export const MODEL_ALIASES: Readonly<Record<string, ModelId>> = {
  "roleflow-flash-1": "roleflow-flash-2",
};

export interface ModelSpec {
  id: ModelId;
  /** Display name, e.g. "RoleFlow Flash 2.0". */
  name: string;
  badge: string;
  /** One line shown in the model selector. */
  description: string;
  /** Phrase completing "which RoleFlow describes as ..." in identity answers. */
  identity: string;
  /** Role sentence placed in the system prompt. */
  promptRole: string;
  /** Groq model that serves this tier. */
  backend: string;
  /** Sampling by effort level. */
  temperature: Record<EffortLevel, number>;
  topP?: number;
  /** Groq max_tokens by effort level. Reasoning models count reasoning tokens against this. */
  maxTokens: Record<EffortLevel, number>;
  /** gpt-oss reasoning depth. Omitted where the backend default is intended. */
  reasoningEffort?: "low" | "medium" | "high";
}

export const SPECS: Record<ModelId, ModelSpec> = {
  "roleflow-apex-1": {
    id: "roleflow-apex-1",
    name: "RoleFlow Apex 1.0",
    badge: "Apex",
    description: "Highest-intelligence frontier model for proofs, systems architecture, and exhaustive reviews.",
    identity:
      "which RoleFlow describes as its highest-intelligence frontier model, built for deep multi-step reasoning, advanced mathematical proofs, complex systems architecture, and exhaustive code reviews",
    promptRole:
      "You are the apex tier of the RoleFlow lineup, RoleFlow's highest-intelligence frontier model. You are built for deep multi-step reasoning, advanced mathematical proofs, complex systems architecture, and exhaustive code reviews.",
    backend: "openai/gpt-oss-120b",
    temperature: { low: 0.3, medium: 0.4, high: 0.4, extra: 0.5, max: 0.5 },
    topP: 0.9,
    maxTokens: { low: 1024, medium: 2048, high: 2560, extra: 3072, max: 3584 },
    reasoningEffort: "high",
  },
  "roleflow-omni-1": {
    id: "roleflow-omni-1",
    name: "RoleFlow Omni 1.0",
    badge: "Frontier",
    description: "Deepest reasoning for multi-step logic, advanced math, and enterprise engineering.",
    identity:
      "which RoleFlow describes as its frontier reasoning model, built for maximum-depth reasoning, multi-step logic, advanced mathematics, and enterprise-grade software engineering",
    promptRole:
      "You are the frontier reasoning tier of the RoleFlow lineup. You are built for maximum depth of thought, complex multi-step reasoning, advanced mathematical logic, and enterprise-grade software engineering.",
    backend: "openai/gpt-oss-120b",
    temperature: { low: 0.3, medium: 0.4, high: 0.5, extra: 0.5, max: 0.6 },
    topP: 0.9,
    maxTokens: { low: 1024, medium: 2048, high: 2560, extra: 3072, max: 3584 },
    reasoningEffort: "high",
  },
  "roleflow-genesis-1": {
    id: "roleflow-genesis-1",
    name: "RoleFlow Genesis 1.5",
    badge: "Balanced",
    description: "Balanced flagship for general intelligence, system architecture, and creative writing.",
    identity:
      "which RoleFlow describes as its balanced flagship, version 1.5, built for general intelligence, system architecture, and creative writing",
    promptRole:
      "You are the balanced flagship of the RoleFlow lineup, version 1.5, built for general intelligence, system architecture, and creative writing.",
    backend: "openai/gpt-oss-120b",
    temperature: { low: 0.3, medium: 0.6, high: 0.6, extra: 0.6, max: 0.85 },
    maxTokens: { low: 1024, medium: 1536, high: 2048, extra: 2560, max: 3072 },
    reasoningEffort: "medium",
  },
  "roleflow-flash-2": {
    id: "roleflow-flash-2",
    name: "RoleFlow Flash 2.0",
    badge: "Fast",
    description: "Ultra-fast answers with stronger reasoning and rapid coding.",
    identity:
      "which RoleFlow describes as its ultra-fast model, with boosted intelligence, higher reasoning throughput, and rapid coding capabilities",
    promptRole:
      "You are the ultra-fast tier of the RoleFlow lineup, built for boosted intelligence, high reasoning throughput, and rapid coding.",
    backend: "openai/gpt-oss-20b",
    temperature: { low: 0.2, medium: 0.5, high: 0.6, extra: 0.6, max: 0.7 },
    topP: 0.95,
    maxTokens: { low: 1024, medium: 1536, high: 2048, extra: 2560, max: 3072 },
    // Flash answers quickly: the least reasoning of any tier.
    reasoningEffort: "low",
  },
};

/** Returns the canonical ID for a current or retired model ID, or null if it is unknown. */
export function resolveModelId(value: unknown): ModelId | null {
  if (typeof value !== "string") return null;
  const id = Object.prototype.hasOwnProperty.call(MODEL_ALIASES, value) ? MODEL_ALIASES[value] : value;
  return (MODEL_IDS as readonly string[]).includes(id) ? (id as ModelId) : null;
}

/** Resolves a list of model IDs, dropping unknown entries and duplicates. */
export function resolveModelList(values: unknown[]): ModelId[] {
  const out: ModelId[] = [];
  for (const v of values) {
    const id = resolveModelId(v);
    if (id && !out.includes(id)) out.push(id);
  }
  return out;
}

export function getModelSpec(id: ModelId): ModelSpec {
  return SPECS[id];
}

export const MODELS = SPECS;

/** Lineup summary used in identity answers, so each model can describe its siblings accurately. */
export const LINEUP_SUMMARY = `RoleFlow's lineup, from highest to fastest:
- RoleFlow Apex 1.0: the highest-intelligence frontier model, for deep proofs, systems architecture, and exhaustive code reviews.
- RoleFlow Omni 1.0: the frontier reasoning model, for multi-step logic, advanced math, and enterprise engineering.
- RoleFlow Genesis 1.5: the balanced flagship, for general intelligence, architecture, and creative writing.
- RoleFlow Flash 2.0: the ultra-fast model, for quick answers and rapid coding.`;
