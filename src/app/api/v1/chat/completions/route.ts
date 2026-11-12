import { NextRequest, NextResponse } from "next/server";
import { generateRoleFlowResponse } from "@/lib/ai-engine";
import { db, ADMIN_EMAIL } from "@/lib/db";
import { ApiKey, EffortLevel, Message, ModelId, ModerationVerdict } from "@/types";
import { scanMessage } from "@/lib/moderation";
import { sendSecurityAlertEmail } from "@/lib/email";
import { checkRateLimit } from "@/lib/rate-limit";
import { authenticateApiKey, getKeyDailyCount } from "@/lib/api-keys";
import { buildIncidentContext } from "@/lib/attachments";

export const dynamic = "force-dynamic";

const ALLOWED_MODELS: ModelId[] = ["roleflow-genesis-1", "roleflow-flash-1"];
const ALLOWED_EFFORTS: EffortLevel[] = ["low", "medium", "high", "extra", "max"];
const MAX_MESSAGE_CHARS = 16000;
const MAX_HISTORY_MESSAGES = 30;

const REFUSAL_SUFFIX = "Continued infractions may result in permanent suspension.";

function apiError(
  status: number,
  message: string,
  code: string,
  type = "invalid_request_error",
  headers?: Record<string, string>
) {
  return NextResponse.json({ error: { message, type, code } }, { status, headers });
}

function clientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}

function secondsUntilUtcMidnight(): number {
  const now = new Date();
  const next = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1);
  return Math.max(1, Math.ceil((next - now.getTime()) / 1000));
}

/** Writes a moderation log entry for an API request and returns its id. */
async function recordIncident(opts: {
  record: ApiKey;
  prompt: string;
  context: string;
  tier: 1 | 2;
  category: string;
  status: "FLAGGED" | "BANNED";
  reason?: string;
  matchedKeywords?: string[];
  ipAddress: string;
}): Promise<string> {
  const logId = "mod-" + Date.now() + "-" + Math.random().toString(36).substring(2, 7);
  await db.saveModerationLog({
    id: logId,
    userId: opts.record.userId,
    userEmail: opts.record.userEmail,
    prompt: opts.prompt,
    context: opts.context,
    tier: opts.tier,
    category: opts.category,
    status: opts.status,
    ipAddress: opts.ipAddress,
    createdAt: new Date().toISOString(),
    reason: opts.reason,
    matchedKeywords: opts.matchedKeywords,
  });
  return logId;
}

function alertAdmins(opts: {
  record: ApiKey;
  prompt: string;
  category: string;
  tier: 1 | 2;
  ipAddress: string;
  logId: string;
}) {
  sendSecurityAlertEmail({
    userEmail: opts.record.userEmail,
    userId: opts.record.userId,
    timestamp: new Date().toUTCString(),
    flaggedPrompt: opts.prompt,
    category: opts.category,
    tier: opts.tier,
    ipAddress: opts.ipAddress,
    logId: opts.logId,
  }).catch((e) => console.error("Security alert dispatch error:", e));
}

export async function POST(req: NextRequest) {
  try {
    // 1. Key must be present, well formed, active, and unexpired.
    const auth = await authenticateApiKey(req.headers.get("authorization"));
    if (!auth.ok) {
      return apiError(auth.status, auth.message, auth.code, "authentication_error");
    }
    const record = auth.record;
    const identifier = record.userEmail;
    const ipAddress = clientIp(req);

    // 2. Global switch, maintenance mode, and the owner's account state.
    const config = await db.getSystemConfig();
    if (!config.apiKeysEnabled) {
      return apiError(403, "API access is turned off for RoleFlow right now.", "api_disabled", "permission_error");
    }

    const owner = await db.getUserByEmail(identifier);
    const isAdmin = Boolean(
      (ADMIN_EMAIL && identifier.toLowerCase() === ADMIN_EMAIL) || owner?.isAdmin
    );
    if (config.maintenanceMode && !isAdmin) {
      return apiError(
        503,
        "RoleFlow is currently in scheduled maintenance. Please check back shortly.",
        "maintenance",
        "server_error"
      );
    }

    const ban = await db.getUserBanStatus(identifier);
    if (ban.isBanned) {
      return apiError(403, "Account suspended. API access has been revoked.", "account_suspended", "permission_error");
    }

    // 3. Body validation. System messages are dropped, as in chat. Attachments are not accepted.
    let body: any;
    try {
      body = await req.json();
    } catch {
      return apiError(400, "Request body must be valid JSON.", "invalid_json");
    }

    if (!Array.isArray(body?.messages) || body.messages.length === 0) {
      return apiError(400, "'messages' must be a non-empty array.", "invalid_messages");
    }

    const messages: Message[] = [];
    for (const m of body.messages) {
      if (!m || typeof m !== "object") {
        return apiError(400, "Each message must be an object.", "invalid_messages");
      }
      if (m.role === "system") continue;
      if (m.role !== "user" && m.role !== "assistant") {
        return apiError(400, "Message role must be 'user' or 'assistant'.", "invalid_messages");
      }
      if (typeof m.content !== "string" || !m.content.trim()) {
        return apiError(400, "Each message needs non-empty string content.", "invalid_messages");
      }
      if (Array.isArray(m.attachments) && m.attachments.length > 0) {
        return apiError(
          400,
          "Attachments are not supported through the API. Send text only.",
          "unsupported_attachment"
        );
      }
      messages.push({
        id: "api-" + messages.length,
        role: m.role,
        content: m.content,
        createdAt: new Date().toISOString(),
      });
    }

    const cappedMessages = messages.slice(-MAX_HISTORY_MESSAGES);
    const latestUserMsg = [...cappedMessages].reverse().find((m) => m.role === "user");
    if (!latestUserMsg || cappedMessages[cappedMessages.length - 1] !== latestUserMsg) {
      return apiError(400, "The last message must have role 'user'.", "invalid_messages");
    }
    for (const m of cappedMessages) {
      if (m.content.length > MAX_MESSAGE_CHARS) {
        return apiError(
          400,
          `Each message must be ${MAX_MESSAGE_CHARS} characters or fewer.`,
          "message_too_long"
        );
      }
    }

    const model: ModelId = body.model === undefined ? "roleflow-genesis-1" : body.model;
    if (!ALLOWED_MODELS.includes(model)) {
      return apiError(400, "'model' must be 'roleflow-genesis-1' or 'roleflow-flash-1'.", "invalid_model");
    }
    const allowedModels = record.allowedModels ?? ALLOWED_MODELS;
    if (!allowedModels.includes(model)) {
      return apiError(403, `This API key is not allowed to use ${model}.`, "model_not_allowed", "permission_error");
    }

    let effort: EffortLevel = body.effort === undefined ? "medium" : body.effort;
    if (!ALLOWED_EFFORTS.includes(effort)) {
      return apiError(400, "'effort' must be one of low, medium, high, extra, max.", "invalid_effort");
    }
    if (!config.allowHighEffort && (effort === "extra" || effort === "max")) {
      effort = "high";
    }

    // 4. Per-key limits: requests per minute (sliding window), then requests per UTC day.
    const minute = checkRateLimit(`key:${record.id}`, { windowMs: 60_000, max: record.rateLimit.rpm });
    if (minute.limited) {
      return apiError(
        429,
        `Rate limit reached: ${record.rateLimit.rpm} requests per minute for this key. Retry shortly.`,
        "rate_limit_exceeded",
        "rate_limit_error",
        { "Retry-After": String(minute.retryAfterSeconds) }
      );
    }

    const dailyUsed = getKeyDailyCount(record);
    if (dailyUsed >= record.rateLimit.rpd) {
      return apiError(
        429,
        `Daily limit reached for this key: ${record.rateLimit.rpd} requests per day. It resets at midnight UTC.`,
        "key_daily_limit_exceeded",
        "rate_limit_error",
        { "Retry-After": String(secondsUntilUtcMidnight()) }
      );
    }

    // 5. The owner's account quota is shared with the web app.
    const usageCheck = await db.getUsage(identifier, false);
    if (!usageCheck.allowed) {
      return apiError(
        429,
        `Daily message limit reached for your account (${usageCheck.limit} per day). It resets at midnight.`,
        "account_daily_limit_exceeded",
        "rate_limit_error"
      );
    }

    // 6. Trust & safety. Tier 1 bans the owner and revokes every key. Tier 2 refuses with a strike.
    let flagged: ModerationVerdict | undefined;
    let flaggedText = "";
    for (const m of cappedMessages) {
      if (m.role !== "user") continue;
      const verdict = scanMessage(m.content);
      if (verdict.flagged) {
        flagged = verdict;
        flaggedText = m.content;
        break;
      }
    }

    const incidentContext = buildIncidentContext(cappedMessages, latestUserMsg);

    if (flagged && flagged.tier === 1) {
      await db.banUser(identifier);
      await db.revokeAllApiKeysForUser(record.userId);
      const category = flagged.category || "VIOLENT_EXTREMISM";
      const logId = await recordIncident({
        record,
        prompt: flaggedText,
        context: incidentContext,
        tier: 1,
        category,
        status: "BANNED",
        reason: flagged.reason || undefined,
        matchedKeywords: flagged.matchedKeywords,
        ipAddress,
      });
      alertAdmins({ record, prompt: flaggedText, category, tier: 1, ipAddress, logId });

      return apiError(
        403,
        `This request has been blocked under RoleFlow's Acceptable Use Policy regarding ${category.toLowerCase().replace(/_/g, " ")}. The account has been suspended and its API keys revoked. This incident has been logged for administrative review.`,
        "policy_violation",
        "permission_error"
      );
    }

    if (flagged && flagged.tier === 2) {
      const strikes = await db.incrementStrikes(identifier);
      const category = flagged.category || "CYBERATTACK";
      await recordIncident({
        record,
        prompt: flaggedText,
        context: incidentContext,
        tier: 2,
        category,
        status: "FLAGGED",
        reason: flagged.reason || undefined,
        matchedKeywords: flagged.matchedKeywords,
        ipAddress,
      });
      const readable = category.toLowerCase().replace(/_/g, " ");
      return apiError(
        400,
        `This request has been flagged and refused under RoleFlow's Acceptable Use Policy regarding ${readable}. Your account has received strike ${strikes}. ${REFUSAL_SUFFIX}`,
        "policy_violation"
      );
    }

    // 7. Generate. Nothing is saved to chat history and user memories are neither read nor written.
    const result = await generateRoleFlowResponse({
      messages: cappedMessages,
      model,
      effort,
      customInstructions: "",
      memories: [],
    });

    // Upstream safety block that our scanner did not catch: audit as Tier 2 with an alert. No ban.
    if (result.isSafetyRefusal) {
      const strikes = await db.incrementStrikes(identifier);
      const category = "UPSTREAM_SAFETY_BLOCK";
      const logId = await recordIncident({
        record,
        prompt: latestUserMsg.content,
        context: incidentContext,
        tier: 2,
        category,
        status: "FLAGGED",
        reason: `Upstream model provider blocked this request on safety grounds (${result.safetyReason || "unspecified"}).`,
        ipAddress,
      });
      alertAdmins({ record, prompt: latestUserMsg.content, category, tier: 2, ipAddress, logId });
      return apiError(
        400,
        `This request has been flagged and refused under RoleFlow's Acceptable Use Policy. Your account has received strike ${strikes}. ${REFUSAL_SUFFIX}`,
        "policy_violation"
      );
    }

    // Model unavailable: return an error and do not charge the owner or the key.
    if (result.isFallback) {
      return apiError(
        503,
        "The model is unavailable right now. You were not charged for this request. Please retry shortly.",
        "model_unavailable",
        "server_error"
      );
    }

    // 8. Success: charge the owner's quota and the key's counters only now.
    const updatedUsage = await db.incrementUsage(identifier, false);
    await db.touchApiKeyUsage(record.id);

    return NextResponse.json(
      {
        id: "chatcmpl-" + Date.now(),
        object: "chat.completion",
        created: Math.floor(Date.now() / 1000),
        model,
        choices: [
          {
            index: 0,
            message: { role: "assistant", content: result.content },
            finish_reason: "stop",
          },
        ],
        usage: {
          used: updatedUsage.used,
          limit: updatedUsage.limit,
          remaining: updatedUsage.remaining,
        },
      },
      {
        headers: {
          "X-RateLimit-Limit-Minute": String(record.rateLimit.rpm),
          "X-RateLimit-Remaining-Day": String(Math.max(0, record.rateLimit.rpd - (dailyUsed + 1))),
        },
      }
    );
  } catch (error: any) {
    console.error("v1 chat completions error:", error);
    return apiError(500, "Internal server error.", "internal_error", "server_error");
  }
}
