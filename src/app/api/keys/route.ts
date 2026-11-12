import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionFromRequest } from "@/lib/auth";
import { generateApiKey, newApiKeyId } from "@/lib/api-keys";
import { ApiKey, ApiKeyRateLimit, ModelId } from "@/types";
import { apiKeyCreatedNotice, notifyUser } from "@/lib/notify";

export const dynamic = "force-dynamic";

const ALL_MODELS: ModelId[] = ["roleflow-genesis-1", "roleflow-flash-1"];
const ALLOWED_EXPIRY_DAYS = [7, 30, 90] as const;

/** Strips the hash so a key record can be sent to the client safely. */
function toPublicRecord(k: ApiKey) {
  const { keyHash: _hash, ...rest } = k;
  return rest;
}

export async function GET(req: NextRequest) {
  try {
    const session = getSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ error: "Sign in to manage API keys." }, { status: 401 });
    }

    const config = await db.getSystemConfig();
    const keys = await db.listApiKeysByUser(session.userId);

    return NextResponse.json({
      keys: keys.map(toPublicRecord),
      limits: {
        maxKeys: config.apiKeyMaxPerUser,
        defaultRpm: config.apiKeyDefaultRpm,
        defaultRpd: config.apiKeyDefaultRpd,
      },
      enabled: config.apiKeysEnabled,
    });
  } catch (error: any) {
    console.error("API keys GET error:", error);
    return NextResponse.json({ error: "Could not load API keys." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = getSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ error: "Sign in to create an API key." }, { status: 401 });
    }

    const config = await db.getSystemConfig();
    if (!config.apiKeysEnabled) {
      return NextResponse.json(
        { error: "API keys are turned off for RoleFlow right now." },
        { status: 403 }
      );
    }

    const ban = await db.getUserBanStatus(session.email);
    if (ban.isBanned) {
      return NextResponse.json(
        { error: "Your account is suspended, so you cannot create API keys." },
        { status: 403 }
      );
    }

    let body: any;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Request body must be JSON." }, { status: 400 });
    }

    const name = typeof body?.name === "string" ? body.name.trim() : "";
    if (name.length < 1 || name.length > 60) {
      return NextResponse.json({ error: "Name must be between 1 and 60 characters." }, { status: 400 });
    }

    const rpm = body?.rpm === undefined ? config.apiKeyDefaultRpm : Number(body.rpm);
    if (!Number.isInteger(rpm) || rpm < 1 || rpm > 120) {
      return NextResponse.json({ error: "Requests per minute must be a whole number from 1 to 120." }, { status: 400 });
    }

    const rpd = body?.rpd === undefined ? config.apiKeyDefaultRpd : Number(body.rpd);
    if (!Number.isInteger(rpd) || rpd < 1 || rpd > 10000) {
      return NextResponse.json({ error: "Requests per day must be a whole number from 1 to 10000." }, { status: 400 });
    }

    let expiresInDays: number | null = null;
    if (body?.expiresInDays !== undefined && body.expiresInDays !== null) {
      if (!ALLOWED_EXPIRY_DAYS.includes(Number(body.expiresInDays) as (typeof ALLOWED_EXPIRY_DAYS)[number])) {
        return NextResponse.json({ error: "Expiry must be 7, 30, 90 days, or never." }, { status: 400 });
      }
      expiresInDays = Number(body.expiresInDays);
    }

    const existing = await db.listApiKeysByUser(session.userId);
    const activeCount = existing.filter(
      (k) => k.status === "active" && !(k.expiresAt && Date.parse(k.expiresAt) <= Date.now())
    ).length;
    if (activeCount >= config.apiKeyMaxPerUser) {
      return NextResponse.json(
        {
          error: `You can have up to ${config.apiKeyMaxPerUser} active API keys. Revoke one before creating another.`,
        },
        { status: 400 }
      );
    }

    const generated = generateApiKey();
    const rateLimit: ApiKeyRateLimit = { rpm, rpd };
    const now = new Date();
    const record: ApiKey = {
      id: newApiKeyId(),
      userId: session.userId,
      userEmail: session.email,
      name,
      keyHash: generated.hash,
      keyPrefix: generated.prefix,
      createdAt: now.toISOString(),
      status: "active",
      requestCount: 0,
      rateLimit,
      expiresAt:
        expiresInDays === null
          ? undefined
          : new Date(now.getTime() + expiresInDays * 24 * 60 * 60 * 1000).toISOString(),
      dailyCount: 0,
      allowedModels: ALL_MODELS,
    };

    const saved = await db.createApiKey(record);
    notifyUser(
      session.email,
      apiKeyCreatedNotice({
        name: saved.name,
        prefix: saved.keyPrefix,
        rpm: saved.rateLimit.rpm,
        rpd: saved.rateLimit.rpd,
        expiresAt: saved.expiresAt,
      })
    );

    // The plaintext key is returned exactly once. It is never stored or shown again.
    return NextResponse.json(
      { key: generated.key, record: toPublicRecord(saved) },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("API keys POST error:", error);
    return NextResponse.json({ error: "Could not create the API key. Please try again." }, { status: 500 });
  }
}
