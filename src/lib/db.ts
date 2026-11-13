import fs from "fs";
import path from "path";
import os from "os";
import { sql } from "@vercel/postgres";
import { Chat, Project, UserProfile, ModerationLogEntry, ModerationStatus, SystemConfig, MemoryItem, ApiKey, ModelId, EmailBroadcastLog } from "@/types";
import { MODEL_IDS, resolveModelList } from "@/lib/models";

const DATA_DIR = process.env.VERCEL ? path.join(os.tmpdir(), "roleflow-data") : path.join(process.cwd(), ".data");
const STORE_FILE = path.join(DATA_DIR, "store.json");

export const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || "").toLowerCase().trim();
export const FREE_DAILY_LIMIT = 25;
export const GUEST_TOTAL_LIMIT = 5;

export const DEFAULT_SYSTEM_CONFIG: SystemConfig = {
  guestLimit: 5,
  registeredDailyLimit: 25,
  maintenanceMode: false,
  broadcastBanner: "",
  allowHighEffort: true,
  apiKeysEnabled: true,
  apiKeyDefaultRpm: 30,
  apiKeyDefaultRpd: 2500,
  apiKeyMaxPerUser: 5,
};

interface LocalStore {
  users: Record<string, UserProfile>;
  chats: Record<string, Chat>;
  projects: Record<string, Project>;
  authCodes: Record<
    string,
    { code: string; email: string; token: string; expiresAt: number; attempts?: number }
  >;
  guestUsage?: Record<string, { count: number; lastResetDate: string }>;
  moderationLogs?: Record<string, ModerationLogEntry>;
  memories?: Record<string, MemoryItem[]>;
  systemConfig?: SystemConfig;
  apiKeys?: Record<string, ApiKey>;
  emailBroadcasts?: EmailBroadcastLog[];
}

export function getTodayDateString(): string {
  return new Date().toISOString().slice(0, 10);
}

const ALL_API_MODELS: ModelId[] = [...MODEL_IDS];

/** Maps a roleflow_api_keys row (snake_case) to the ApiKey shape. */
function rowToApiKey(r: any): ApiKey {
  let allowedModels: ModelId[] = ALL_API_MODELS;
  if (typeof r.allowed_models === "string" && r.allowed_models) {
    try {
      // Keys created before a model rename store retired IDs. Resolve them to current IDs.
      allowedModels = resolveModelList(JSON.parse(r.allowed_models));
    } catch {
      allowedModels = ALL_API_MODELS;
    }
  }
  return {
    id: r.id,
    userId: r.user_id,
    userEmail: r.user_email,
    name: r.name,
    keyHash: r.key_hash,
    keyPrefix: r.key_prefix,
    createdAt: new Date(r.created_at).toISOString(),
    lastUsedAt: r.last_used_at ? new Date(r.last_used_at).toISOString() : undefined,
    status: r.status === "revoked" ? "revoked" : "active",
    requestCount: Number(r.request_count) || 0,
    rateLimit: { rpm: Number(r.rpm), rpd: Number(r.rpd) },
    expiresAt: r.expires_at ? new Date(r.expires_at).toISOString() : undefined,
    dailyCount: Number(r.daily_count) || 0,
    dailyDate: r.daily_date || undefined,
    allowedModels,
  };
}

export function patchUserProfile(user: UserProfile): UserProfile {
  const isJordanAdmin = Boolean(ADMIN_EMAIL && user.email?.toLowerCase() === ADMIN_EMAIL);
  const isAdmin = isJordanAdmin || Boolean(user.isAdmin);
  const plan = isJordanAdmin ? "ADMIN" : (user.plan || "FREE");
  const today = getTodayDateString();

  let messageCount = typeof user.messageCount === "number" ? user.messageCount : 0;
  let lastResetDate = user.lastResetDate || today;

  // Auto reset counter if new calendar day (for non-admins)
  if (lastResetDate !== today && !isAdmin) {
    messageCount = 0;
    lastResetDate = today;
  }

  const isBanned = Boolean(user.isBanned);
  const strikes = typeof user.strikes === "number" ? user.strikes : 0;

  return {
    ...user,
    isAdmin,
    plan,
    messageCount,
    lastResetDate,
    isBanned,
    strikes,
  };
}

function getLocalStore(): LocalStore {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(STORE_FILE)) {
      const data = fs.readFileSync(STORE_FILE, "utf-8");
      return JSON.parse(data);
    }
  } catch (err) {
    console.error("Local store read error:", err);
  }
  return { users: {}, chats: {}, projects: {}, authCodes: {} };
}

function saveLocalStore(store: LocalStore) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    const tempFile = path.join(DATA_DIR, `store.${Date.now()}.${Math.random().toString(36).slice(2)}.tmp`);
    fs.writeFileSync(tempFile, JSON.stringify(store, null, 2), "utf-8");
    fs.renameSync(tempFile, STORE_FILE);
  } catch (err) {
    console.error("Local store save error:", err);
  }
}

const isPostgresConfigured = Boolean(
  process.env.POSTGRES_URL || process.env.DATABASE_URL || process.env.STORAGE_URL
);

let isInitialized = false;
async function ensureDb() {
  if (!isPostgresConfigured && process.env.VERCEL) {
    throw new Error("Database not configured: link Vercel Postgres (POSTGRES_URL) before serving traffic. Refusing to store data in temporary storage.");
  }
  if (!isPostgresConfigured || isInitialized) return;
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS roleflow_users (
        id VARCHAR(255) PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        custom_instructions TEXT,
        response_instructions TEXT,
        is_admin BOOLEAN DEFAULT FALSE,
        plan VARCHAR(50) DEFAULT 'FREE',
        message_count INTEGER DEFAULT 0,
        last_reset_date VARCHAR(20),
        is_banned BOOLEAN DEFAULT FALSE,
        strikes INTEGER DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;

    // Alter columns one by one to avoid prepared statement multi-command error
    const userColumns = [
      "response_instructions TEXT",
      "is_admin BOOLEAN DEFAULT FALSE",
      "plan VARCHAR(50) DEFAULT 'FREE'",
      "message_count INTEGER DEFAULT 0",
      "last_reset_date VARCHAR(20)",
      "is_banned BOOLEAN DEFAULT FALSE",
      "strikes INTEGER DEFAULT 0",
    ];
    for (const col of userColumns) {
      try {
        await sql.query(`ALTER TABLE roleflow_users ADD COLUMN IF NOT EXISTS ${col};`);
      } catch (_) {}
    }

    await sql`
      CREATE TABLE IF NOT EXISTS roleflow_moderation_logs (
        id VARCHAR(255) PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL,
        user_email VARCHAR(255) NOT NULL,
        prompt TEXT NOT NULL,
        tier INTEGER NOT NULL,
        category VARCHAR(100) NOT NULL,
        status VARCHAR(50) NOT NULL,
        appeal_note TEXT,
        ip_address VARCHAR(100),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;

    await sql`
      ALTER TABLE roleflow_moderation_logs ADD COLUMN IF NOT EXISTS context TEXT;
    `;

    await sql`
      ALTER TABLE roleflow_chats ADD COLUMN IF NOT EXISTS compaction JSONB;
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS roleflow_guest_usage (
        id VARCHAR(255) PRIMARY KEY,
        count INTEGER DEFAULT 0,
        last_reset_date VARCHAR(20)
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS roleflow_chats (
        id VARCHAR(255) PRIMARY KEY,
        user_id VARCHAR(255),
        title VARCHAR(255) NOT NULL,
        project_id VARCHAR(255),
        pinned BOOLEAN DEFAULT FALSE,
        model VARCHAR(100) NOT NULL,
        effort VARCHAR(50) NOT NULL,
        messages JSONB NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS roleflow_projects (
        id VARCHAR(255) PRIMARY KEY,
        user_id VARCHAR(255),
        name VARCHAR(255) NOT NULL,
        description TEXT,
        custom_instructions TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS roleflow_auth_codes (
        email VARCHAR(255) PRIMARY KEY,
        code VARCHAR(10) NOT NULL,
        token VARCHAR(255) NOT NULL,
        expires_at BIGINT NOT NULL,
        attempts INTEGER DEFAULT 0
      );
    `;

    try {
      await sql.query(`ALTER TABLE roleflow_auth_codes ADD COLUMN IF NOT EXISTS attempts INTEGER DEFAULT 0;`);
    } catch (_) {}

    await sql`
      CREATE TABLE IF NOT EXISTS roleflow_system_configs (
        key VARCHAR(50) PRIMARY KEY,
        value JSONB NOT NULL
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS roleflow_memories (
        id VARCHAR(255) PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL,
        memory TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS roleflow_api_keys (
        id VARCHAR(255) PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL,
        user_email VARCHAR(255) NOT NULL,
        name VARCHAR(120) NOT NULL,
        key_hash VARCHAR(128) UNIQUE NOT NULL,
        key_prefix VARCHAR(32) NOT NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'active',
        request_count INTEGER DEFAULT 0,
        rpm INTEGER NOT NULL,
        rpd INTEGER NOT NULL,
        expires_at TIMESTAMP WITH TIME ZONE,
        last_used_at TIMESTAMP WITH TIME ZONE,
        daily_count INTEGER DEFAULT 0,
        daily_date VARCHAR(20),
        allowed_models TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS roleflow_email_broadcasts (
        id VARCHAR(255) PRIMARY KEY,
        admin_email VARCHAR(255) NOT NULL,
        target_type VARCHAR(20) NOT NULL,
        target_email TEXT,
        subject TEXT NOT NULL,
        template_id VARCHAR(120),
        total_recipients INTEGER NOT NULL DEFAULT 0,
        delivered_count INTEGER NOT NULL DEFAULT 0,
        failed_count INTEGER NOT NULL DEFAULT 0,
        status VARCHAR(20) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;

    isInitialized = true;
  } catch (error) {
    console.warn("Postgres initialization notice (using fallback):", error);
  }
}

export const db = {
  /**
   * Readiness check for uptime monitors. Unlike getSystemConfig, this does not swallow errors:
   * it throws when Postgres is configured but unreachable. Without Postgres (local store) it passes.
   */
  async ping(): Promise<void> {
    await ensureDb();
    if (isPostgresConfigured) {
      await sql`SELECT 1;`;
    }
  },

  // Auth Codes
  async saveAuthCode(email: string, code: string, token: string, expiresAt: number) {
    await ensureDb();
    const cleanEmail = email.toLowerCase().trim();
    if (isPostgresConfigured) {
      try {
        await sql`
          INSERT INTO roleflow_auth_codes (email, code, token, expires_at, attempts)
          VALUES (${cleanEmail}, ${code}, ${token}, ${expiresAt}, 0)
          ON CONFLICT (email) DO UPDATE
          SET code = ${code}, token = ${token}, expires_at = ${expiresAt}, attempts = 0;
        `;
        return;
      } catch (e) {
        console.error("Postgres auth code save error:", e);
      }
    }
    const store = getLocalStore();
    store.authCodes[cleanEmail] = { code, email: cleanEmail, token, expiresAt, attempts: 0 };
    saveLocalStore(store);
  },

  async getAuthCode(email: string): Promise<{ code: string; email: string; token: string; expiresAt: number; attempts: number } | null> {
    await ensureDb();
    const cleanEmail = email.toLowerCase().trim();
    if (isPostgresConfigured) {
      try {
        const { rows } = await sql`
          SELECT code, email, token, expires_at as "expiresAt", COALESCE(attempts, 0) as attempts
          FROM roleflow_auth_codes
          WHERE email = ${cleanEmail};
        `;
        if (rows[0]) {
          return {
            code: String(rows[0].code),
            email: String(rows[0].email),
            token: String(rows[0].token),
            expiresAt: Number(rows[0].expiresAt),
            attempts: Number(rows[0].attempts || 0),
          };
        }
        return null;
      } catch (e) {
        console.error("Postgres get auth code error:", e);
      }
    }
    const store = getLocalStore();
    const entry = store.authCodes[cleanEmail];
    if (entry) {
      return {
        ...entry,
        attempts: entry.attempts || 0,
      };
    }
    return null;
  },

  async recordFailedAuthAttempt(email: string): Promise<{ invalidated: boolean; remaining: number }> {
    await ensureDb();
    const cleanEmail = email.toLowerCase().trim();
    let currentAttempts = 0;

    if (isPostgresConfigured) {
      try {
        const { rows } = await sql`
          UPDATE roleflow_auth_codes
          SET attempts = COALESCE(attempts, 0) + 1
          WHERE email = ${cleanEmail}
          RETURNING attempts;
        `;
        if (rows[0]) {
          currentAttempts = Number(rows[0].attempts);
          if (currentAttempts >= 5) {
            await sql`DELETE FROM roleflow_auth_codes WHERE email = ${cleanEmail};`;
            return { invalidated: true, remaining: 0 };
          }
          return { invalidated: false, remaining: Math.max(0, 5 - currentAttempts) };
        }
      } catch (e) {
        console.error("Postgres record failed auth attempt error:", e);
      }
    }

    const store = getLocalStore();
    const entry = store.authCodes[cleanEmail];
    if (entry) {
      currentAttempts = (entry.attempts || 0) + 1;
      if (currentAttempts >= 5) {
        delete store.authCodes[cleanEmail];
        saveLocalStore(store);
        return { invalidated: true, remaining: 0 };
      }
      entry.attempts = currentAttempts;
      store.authCodes[cleanEmail] = entry;
      saveLocalStore(store);
      return { invalidated: false, remaining: Math.max(0, 5 - currentAttempts) };
    }
    return { invalidated: true, remaining: 0 };
  },

  async deleteAuthCode(email: string): Promise<void> {
    await ensureDb();
    const cleanEmail = email.toLowerCase().trim();
    if (isPostgresConfigured) {
      try {
        await sql`DELETE FROM roleflow_auth_codes WHERE email = ${cleanEmail};`;
        return;
      } catch (e) {
        console.error("Postgres delete auth code error:", e);
      }
    }
    const store = getLocalStore();
    delete store.authCodes[cleanEmail];
    saveLocalStore(store);
  },

  async verifyAuthCode(email: string, inputCodeOrToken: string): Promise<boolean> {
    await ensureDb();
    const cleanEmail = email.toLowerCase().trim();
    const now = Date.now();

    const entry = await this.getAuthCode(cleanEmail);
    if (!entry || entry.expiresAt <= now) {
      if (entry) await this.deleteAuthCode(cleanEmail);
      return false;
    }

    if (entry.attempts >= 5) {
      await this.deleteAuthCode(cleanEmail);
      return false;
    }

    const matchesCode = entry.code === inputCodeOrToken;
    const matchesToken = entry.token === inputCodeOrToken;

    if (matchesCode || matchesToken) {
      await this.deleteAuthCode(cleanEmail);
      return true;
    }

    await this.recordFailedAuthAttempt(cleanEmail);
    return false;
  },

  // Users
  async getUserByEmail(email: string): Promise<UserProfile | null> {
    await ensureDb();
    const cleanEmail = email.toLowerCase().trim();
    if (isPostgresConfigured) {
      try {
        const { rows } = await sql`
          SELECT id, email, name, custom_instructions as "customInstructions", response_instructions as "responseInstructions", is_admin as "isAdmin", plan, message_count as "messageCount", last_reset_date as "lastResetDate", is_banned as "isBanned", strikes, created_at as "createdAt"
          FROM roleflow_users WHERE email = ${cleanEmail};
        `;
        if (rows[0]) return patchUserProfile(rows[0] as unknown as UserProfile);
      } catch (e) {
        console.error("Postgres get user error:", e);
      }
    }
    const store = getLocalStore();
    const user = store.users[cleanEmail];
    return user ? patchUserProfile(user) : null;
  },

  async getUserById(id: string): Promise<UserProfile | null> {
    await ensureDb();
    if (isPostgresConfigured) {
      try {
        const { rows } = await sql`
          SELECT id, email, name, custom_instructions as "customInstructions", response_instructions as "responseInstructions", is_admin as "isAdmin", plan, message_count as "messageCount", last_reset_date as "lastResetDate", is_banned as "isBanned", strikes, created_at as "createdAt"
          FROM roleflow_users WHERE id = ${id};
        `;
        if (rows[0]) return patchUserProfile(rows[0] as unknown as UserProfile);
      } catch (e) {
        console.error("Postgres get user by id error:", e);
      }
    }
    const store = getLocalStore();
    const user = Object.values(store.users).find((u) => u.id === id);
    return user ? patchUserProfile(user) : null;
  },

  async upsertUser(user: UserProfile): Promise<UserProfile> {
    await ensureDb();
    const cleanEmail = user.email.toLowerCase().trim();
    const patched = patchUserProfile(user);

    if (isPostgresConfigured) {
      try {
        await sql`
          INSERT INTO roleflow_users (id, email, name, custom_instructions, response_instructions, is_admin, plan, message_count, last_reset_date, is_banned, strikes)
          VALUES (${patched.id}, ${cleanEmail}, ${patched.name}, ${patched.customInstructions || ""}, ${patched.responseInstructions || ""}, ${patched.isAdmin || false}, ${patched.plan || "FREE"}, ${patched.messageCount || 0}, ${patched.lastResetDate || ""}, ${patched.isBanned || false}, ${patched.strikes || 0})
          ON CONFLICT (email) DO UPDATE
          SET name = ${patched.name}, 
              custom_instructions = ${patched.customInstructions || ""}, 
              response_instructions = ${patched.responseInstructions || ""}, 
              is_admin = ${patched.isAdmin || false}, 
              plan = ${patched.plan || "FREE"}, 
              message_count = ${patched.messageCount || 0}, 
              last_reset_date = ${patched.lastResetDate || ""},
              is_banned = ${patched.isBanned || false},
              strikes = ${patched.strikes || 0};
        `;
        return patched;
      } catch (e) {
        console.error("Postgres upsert user error:", e);
      }
    }
    const store = getLocalStore();
    store.users[cleanEmail] = patched;
    saveLocalStore(store);
    return patched;
  },

  // Usage Limits & Tracking
  async getUsage(identifier?: string, isGuest: boolean = false): Promise<{
    allowed: boolean;
    used: number;
    limit: number;
    remaining: number;
    isUnlimited: boolean;
    resetsAt: string;
  }> {
    const today = getTodayDateString();
    const config = await this.getSystemConfig();
    const dynamicGuestLimit = config.guestLimit || GUEST_TOTAL_LIMIT;
    const dynamicDailyLimit = config.registeredDailyLimit || FREE_DAILY_LIMIT;

    if (!identifier || isGuest || identifier.startsWith("guest_")) {
      const store = getLocalStore();
      const guestRecords = store.guestUsage || {};
      const key = identifier || "guest_default";
      const entry = guestRecords[key] || { count: 0, lastResetDate: today };
      const used = entry.count;
      const limit = dynamicGuestLimit;
      return {
        allowed: used < limit,
        used,
        limit,
        remaining: Math.max(0, limit - used),
        isUnlimited: false,
        resetsAt: "sign in",
      };
    }

    let user = identifier.includes("@")
      ? await this.getUserByEmail(identifier)
      : await this.getUserById(identifier);

    if (!user) {
      const store = getLocalStore();
      const found = Object.values(store.users).find(
        (u) => u.id === identifier || u.email.toLowerCase() === identifier.toLowerCase()
      );
      if (found) user = patchUserProfile(found);
    }

    if (!user) {
      return {
        allowed: true,
        used: 0,
        limit: dynamicGuestLimit,
        remaining: dynamicGuestLimit,
        isUnlimited: false,
        resetsAt: "sign in",
      };
    }

    // Admin users have UNLIMITED usage
    if (user.isAdmin || user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
      return {
        allowed: true,
        used: user.messageCount || 0,
        limit: 999999,
        remaining: 999999,
        isUnlimited: true,
        resetsAt: "never",
      };
    }

    let used = user.messageCount || 0;
    if (user.lastResetDate !== today) {
      used = 0;
      user.messageCount = 0;
      user.lastResetDate = today;
      await this.upsertUser(user);
    }

    const limit = dynamicDailyLimit;
    return {
      allowed: used < limit,
      used,
      limit,
      remaining: Math.max(0, limit - used),
      isUnlimited: false,
      resetsAt: "midnight",
    };
  },

  async incrementUsage(identifier?: string, isGuest: boolean = false): Promise<{
    allowed: boolean;
    used: number;
    limit: number;
    remaining: number;
    isUnlimited: boolean;
    resetsAt: string;
  }> {
    const today = getTodayDateString();
    const config = await this.getSystemConfig();
    const dynamicGuestLimit = config.guestLimit || GUEST_TOTAL_LIMIT;
    const dynamicDailyLimit = config.registeredDailyLimit || FREE_DAILY_LIMIT;

    if (!identifier || isGuest || identifier.startsWith("guest_")) {
      const store = getLocalStore();
      if (!store.guestUsage) store.guestUsage = {};
      const key = identifier || "guest_default";
      const entry = store.guestUsage[key] || { count: 0, lastResetDate: today };
      entry.count += 1;
      store.guestUsage[key] = entry;
      saveLocalStore(store);

      const used = entry.count;
      const limit = dynamicGuestLimit;
      return {
        allowed: used <= limit,
        used,
        limit,
        remaining: Math.max(0, limit - used),
        isUnlimited: false,
        resetsAt: "sign in",
      };
    }

    let user = identifier.includes("@")
      ? await this.getUserByEmail(identifier)
      : await this.getUserById(identifier);

    if (!user) {
      const store = getLocalStore();
      const found = Object.values(store.users).find(
        (u) => u.id === identifier || u.email.toLowerCase() === identifier.toLowerCase()
      );
      if (found) user = patchUserProfile(found);
    }

    if (!user) {
      return {
        allowed: true,
        used: 1,
        limit: dynamicGuestLimit,
        remaining: Math.max(0, dynamicGuestLimit - 1),
        isUnlimited: false,
        resetsAt: "sign in",
      };
    }

    if (user.isAdmin || user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
      user.messageCount = (user.messageCount || 0) + 1;
      await this.upsertUser(user);
      return {
        allowed: true,
        used: user.messageCount,
        limit: 999999,
        remaining: 999999,
        isUnlimited: true,
        resetsAt: "never",
      };
    }

    let count = user.messageCount || 0;
    if (user.lastResetDate !== today) {
      count = 0;
      user.lastResetDate = today;
    }

    count += 1;
    user.messageCount = count;
    await this.upsertUser(user);

    const limit = dynamicDailyLimit;
    return {
      allowed: count <= limit,
      used: count,
      limit,
      remaining: Math.max(0, limit - count),
      isUnlimited: false,
      resetsAt: "midnight",
    };
  },

  async resetAllUsage(): Promise<{ success: boolean; usersReset: number; guestsReset: number }> {
    await ensureDb();
    const today = getTodayDateString();
    let usersReset = 0;
    let guestsReset = 0;

    const store = getLocalStore();
    for (const key of Object.keys(store.users)) {
      store.users[key].messageCount = 0;
      store.users[key].lastResetDate = today;
      usersReset++;
    }
    if (store.guestUsage) {
      guestsReset = Object.keys(store.guestUsage).length;
      store.guestUsage = {};
    }
    saveLocalStore(store);

    if (isPostgresConfigured) {
      try {
        await sql`UPDATE roleflow_users SET message_count = 0, last_reset_date = ${today};`;
        await sql`TRUNCATE TABLE roleflow_guest_usage;`;
      } catch (e) {
        console.error("Postgres reset usage error:", e);
      }
    }

    return { success: true, usersReset, guestsReset };
  },

  async getAdminStats() {
    await ensureDb();
    const store = getLocalStore();
    let totalUsers = Object.keys(store.users).length;
    let totalChats = Object.keys(store.chats).length;
    let usersList = Object.values(store.users).map((u) => patchUserProfile(u));

    if (isPostgresConfigured) {
      try {
        const uRes = await sql`SELECT count(*)::int as count FROM roleflow_users;`;
        const cRes = await sql`SELECT count(*)::int as count FROM roleflow_chats;`;
        totalUsers = uRes.rows[0]?.count || 0;
        totalChats = cRes.rows[0]?.count || 0;
        const allUsers = await this.getAllUsers();
        usersList = allUsers;
      } catch (e) {
        console.error("Postgres admin stats error:", e);
      }
    }

    // Check Groq pool keys safely without exposing full prefix/suffix
    const envKeys = process.env.GROQ_API_KEYS || "";
    const keyList = envKeys
      .split(",")
      .map((k) => k.trim())
      .filter((k) => k.startsWith("gsk_"));

    return {
      totalUsers,
      totalChats,
      modelKeys: {
        total: keyList.length,
        active: keyList.length,
        keysMasked: keyList.map((k) => `${k.slice(0, 7)}...${k.slice(-3)}`),
      },
      users: usersList.map((u) => ({
        id: u.id,
        email: u.email,
        name: u.name,
        plan: u.plan || "FREE",
        isAdmin: Boolean(u.isAdmin),
        messageCount: u.messageCount || 0,
        lastResetDate: u.lastResetDate,
      })),
    };
  },

  // Chats with User/Session Isolation
  async getChat(chatId: string, userId?: string, isShared: boolean = false): Promise<Chat | null> {
    await ensureDb();
    if (!chatId) return null;

    if (isPostgresConfigured) {
      try {
        const { rows } = await sql`
          SELECT id, user_id as "userId", title, project_id as "projectId", pinned, model, effort, messages, compaction, created_at as "createdAt", updated_at as "updatedAt"
          FROM roleflow_chats WHERE id = ${chatId};
        `;
        if (rows[0]) {
          const chat = rows[0] as unknown as Chat;
          if (isShared) return chat;
          if (!userId) return null; // Private chat requires user
          if (chat.userId && chat.userId !== userId) {
            return null; // Restricted
          }
          return chat;
        }
      } catch (e) {
        console.error("Postgres get chat error:", e);
      }
    }
    const store = getLocalStore();
    const chat = store.chats[chatId];
    if (chat) {
      if (isShared) return chat;
      if (!userId) return null;
      if (chat.userId && chat.userId !== userId) {
        return null; // Restricted
      }
      return chat;
    }
    return null;
  },

  async saveChat(chat: Chat, requesterId?: string): Promise<void> {
    await ensureDb();
    const existing = await this.getChat(chat.id, undefined, true);
    if (existing && existing.userId) {
      if (requesterId && existing.userId !== requesterId) {
        throw new Error("Forbidden: You do not own this chat.");
      }
    }

    const assignedUserId = existing?.userId || chat.userId || requesterId || null;

    if (isPostgresConfigured) {
      try {
        await sql`
          INSERT INTO roleflow_chats (id, user_id, title, project_id, pinned, model, effort, messages, compaction, updated_at)
          VALUES (${chat.id}, ${assignedUserId}, ${chat.title}, ${chat.projectId || null}, ${chat.pinned || false}, ${chat.model}, ${chat.effort}, ${JSON.stringify(chat.messages)}, ${chat.compaction ? JSON.stringify(chat.compaction) : null}, NOW())
          ON CONFLICT (id) DO UPDATE
          SET title = ${chat.title}, project_id = ${chat.projectId || null}, pinned = ${chat.pinned || false}, model = ${chat.model}, effort = ${chat.effort}, messages = ${JSON.stringify(chat.messages)}, compaction = ${chat.compaction ? JSON.stringify(chat.compaction) : null}, updated_at = NOW()
          WHERE roleflow_chats.user_id = ${assignedUserId} OR roleflow_chats.user_id IS NULL;
        `;
        return;
      } catch (e) {
        console.error("Postgres save chat error:", e);
      }
    }
    const store = getLocalStore();
    store.chats[chat.id] = { ...chat, userId: assignedUserId || undefined };
    saveLocalStore(store);
  },

  async deleteChat(chatId: string, userId?: string): Promise<boolean> {
    if (!userId || !chatId) return false;
    await ensureDb();

    if (isPostgresConfigured) {
      try {
        const result = await sql`
          DELETE FROM roleflow_chats 
          WHERE id = ${chatId} AND user_id = ${userId}
          RETURNING id;
        `;
        return (result.rows?.length || 0) > 0;
      } catch (e) {
        console.error("Postgres delete chat error:", e);
      }
    }
    const store = getLocalStore();
    const chat = store.chats[chatId];
    if (chat) {
      if (chat.userId !== userId) {
        return false;
      }
      delete store.chats[chatId];
      saveLocalStore(store);
      return true;
    }
    return false;
  },

  async deleteAllChats(userId?: string): Promise<boolean> {
    if (!userId || typeof userId !== "string" || !userId.trim()) {
      return false; // NEVER delete all chats across the whole database
    }
    await ensureDb();
    const cleanUserId = userId.trim();

    if (isPostgresConfigured) {
      try {
        await sql`DELETE FROM roleflow_chats WHERE user_id = ${cleanUserId};`;
        return true;
      } catch (e) {
        console.error("Postgres delete all chats error:", e);
      }
    }
    const store = getLocalStore();
    let changed = false;
    for (const id of Object.keys(store.chats)) {
      if (store.chats[id].userId === cleanUserId) {
        delete store.chats[id];
        changed = true;
      }
    }
    if (changed) {
      saveLocalStore(store);
    }
    return true;
  },

  async getAllChats(userId?: string): Promise<Chat[]> {
    await ensureDb();
    if (isPostgresConfigured) {
      try {
        if (userId) {
          const { rows } = await sql`
            SELECT id, user_id as "userId", title, project_id as "projectId", pinned, model, effort, messages, created_at as "createdAt", updated_at as "updatedAt"
            FROM roleflow_chats 
            WHERE user_id = ${userId}
            ORDER BY updated_at DESC;
          `;
          return rows as unknown as Chat[];
        } else {
          // If no user specified, return empty or guest chats only
          const { rows } = await sql`
            SELECT id, user_id as "userId", title, project_id as "projectId", pinned, model, effort, messages, created_at as "createdAt", updated_at as "updatedAt"
            FROM roleflow_chats 
            WHERE user_id IS NULL OR user_id LIKE 'guest_%'
            ORDER BY updated_at DESC;
          `;
          return rows as unknown as Chat[];
        }
      } catch (e) {
        console.error("Postgres get all chats error:", e);
      }
    }
    const store = getLocalStore();
    const all = Object.values(store.chats);
    
    // Strict user isolation
    const filtered = userId
      ? all.filter((c) => c.userId === userId)
      : all.filter((c) => !c.userId || c.userId.startsWith("guest_"));

    return filtered.sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  },

  // Projects
  async getProjects(userId?: string): Promise<Project[]> {
    if (!userId) return [];
    await ensureDb();
    if (isPostgresConfigured) {
      try {
        const { rows } = await sql`
          SELECT id, user_id as "userId", name, description, custom_instructions as "customInstructions", created_at as "createdAt"
          FROM roleflow_projects WHERE user_id = ${userId} ORDER BY created_at DESC;
        `;
        return rows as unknown as Project[];
      } catch (e) {
        console.error("Postgres get projects error:", e);
      }
    }
    const store = getLocalStore();
    return Object.values(store.projects).filter((p) => p.userId === userId);
  },

  async saveProject(project: Project, requesterId?: string): Promise<void> {
    await ensureDb();
    const assignedUserId = project.userId || requesterId;
    if (!assignedUserId) {
      throw new Error("Unauthorized: Project must belong to an authenticated user.");
    }

    if (isPostgresConfigured) {
      try {
        await sql`
          INSERT INTO roleflow_projects (id, user_id, name, description, custom_instructions)
          VALUES (${project.id}, ${assignedUserId}, ${project.name}, ${project.description || ""}, ${project.customInstructions || ""})
          ON CONFLICT (id) DO UPDATE
          SET name = ${project.name}, description = ${project.description || ""}, custom_instructions = ${project.customInstructions || ""}
          WHERE roleflow_projects.user_id = ${assignedUserId};
        `;
        return;
      } catch (e) {
        console.error("Postgres save project error:", e);
      }
    }
    const store = getLocalStore();
    const existing = store.projects[project.id];
    if (existing && existing.userId && existing.userId !== assignedUserId) {
      throw new Error("Forbidden: You do not own this project.");
    }
    store.projects[project.id] = { ...project, userId: assignedUserId };
    saveLocalStore(store);
  },

  // ───────────────────────────────────────────────────────────────────────────
  // Moderation & Trust / Safety Audit Logs
  // ───────────────────────────────────────────────────────────────────────────
  async saveModerationLog(log: ModerationLogEntry): Promise<void> {
    await ensureDb();
    if (isPostgresConfigured) {
      try {
        await sql`
          INSERT INTO roleflow_moderation_logs (id, user_id, user_email, prompt, tier, category, status, appeal_note, ip_address, created_at, context)
          VALUES (${log.id}, ${log.userId}, ${log.userEmail}, ${log.prompt}, ${log.tier}, ${log.category}, ${log.status}, ${log.appealNote || null}, ${log.ipAddress || ""}, ${log.createdAt ? new Date(log.createdAt).toISOString() : new Date().toISOString()}, ${log.context || null})
          ON CONFLICT (id) DO UPDATE
          SET status = ${log.status}, appeal_note = ${log.appealNote || null};
        `;
        return;
      } catch (e) {
        console.error("Postgres save moderation log error:", e);
      }
    }
    const store = getLocalStore();
    if (!store.moderationLogs) store.moderationLogs = {};
    store.moderationLogs[log.id] = log;
    saveLocalStore(store);
  },

  async getModerationLogs(filter?: { status?: string; tier?: number }): Promise<ModerationLogEntry[]> {
    await ensureDb();
    if (isPostgresConfigured) {
      try {
        const { rows } = await sql`
          SELECT id, user_id as "userId", user_email as "userEmail", prompt, tier, category, status, appeal_note as "appealNote", ip_address as "ipAddress", context, created_at as "createdAt"
          FROM roleflow_moderation_logs
          ORDER BY created_at DESC;
        `;
        let list = rows as unknown as ModerationLogEntry[];
        if (filter?.status) list = list.filter((l) => l.status === filter.status);
        if (filter?.tier) list = list.filter((l) => l.tier === filter.tier);
        return list;
      } catch (e) {
        console.error("Postgres get moderation logs error:", e);
      }
    }
    const store = getLocalStore();
    let list = Object.values(store.moderationLogs || {});
    if (filter?.status) list = list.filter((l) => l.status === filter.status);
    if (filter?.tier) list = list.filter((l) => l.tier === filter.tier);
    return list.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  },

  async getModerationLogById(id: string): Promise<ModerationLogEntry | null> {
    await ensureDb();
    if (isPostgresConfigured) {
      try {
        const { rows } = await sql`
          SELECT id, user_id as "userId", user_email as "userEmail", prompt, tier, category, status, appeal_note as "appealNote", ip_address as "ipAddress", context, created_at as "createdAt"
          FROM roleflow_moderation_logs
          WHERE id = ${id};
        `;
        if (rows[0]) return rows[0] as unknown as ModerationLogEntry;
      } catch (e) {
        console.error("Postgres get moderation log by id error:", e);
      }
    }
    const store = getLocalStore();
    return store.moderationLogs?.[id] || null;
  },

  async updateModerationLogStatus(
    id: string,
    status: ModerationStatus,
    appealNote?: string
  ): Promise<ModerationLogEntry | null> {
    await ensureDb();
    if (isPostgresConfigured) {
      try {
        if (appealNote !== undefined) {
          await sql`
            UPDATE roleflow_moderation_logs
            SET status = ${status}, appeal_note = ${appealNote}
            WHERE id = ${id};
          `;
        } else {
          await sql`
            UPDATE roleflow_moderation_logs
            SET status = ${status}
            WHERE id = ${id};
          `;
        }
        return await this.getModerationLogById(id);
      } catch (e) {
        console.error("Postgres update moderation log error:", e);
      }
    }
    const store = getLocalStore();
    if (store.moderationLogs && store.moderationLogs[id]) {
      store.moderationLogs[id].status = status;
      if (appealNote !== undefined) {
        store.moderationLogs[id].appealNote = appealNote;
      }
      saveLocalStore(store);
      return store.moderationLogs[id];
    }
    return null;
  },

  async banUser(userIdOrEmail: string): Promise<void> {
    await ensureDb();
    if (!userIdOrEmail) return;
    const clean = userIdOrEmail.toLowerCase().trim();
    let user = clean.includes("@")
      ? await this.getUserByEmail(clean)
      : await this.getUserById(userIdOrEmail);

    if (user) {
      user.isBanned = true;
      await this.upsertUser(user);
    } else {
      const store = getLocalStore();
      for (const [key, u] of Object.entries(store.users)) {
        if (u.id === userIdOrEmail || u.email.toLowerCase() === clean) {
          u.isBanned = true;
          store.users[key] = u;
        }
      }
      saveLocalStore(store);
    }

    if (isPostgresConfigured) {
      try {
        await sql`
          UPDATE roleflow_users
          SET is_banned = TRUE
          WHERE id = ${userIdOrEmail} OR LOWER(email) = ${clean};
        `;
      } catch (e) {
        console.error("Postgres ban user error:", e);
      }
    }
  },

  async unbanUser(userIdOrEmail: string): Promise<void> {
    await ensureDb();
    if (!userIdOrEmail) return;
    const clean = userIdOrEmail.toLowerCase().trim();
    let user = clean.includes("@")
      ? await this.getUserByEmail(clean)
      : await this.getUserById(userIdOrEmail);

    if (user) {
      user.isBanned = false;
      await this.upsertUser(user);
    } else {
      const store = getLocalStore();
      for (const [key, u] of Object.entries(store.users)) {
        if (u.id === userIdOrEmail || u.email.toLowerCase() === clean) {
          u.isBanned = false;
          store.users[key] = u;
        }
      }
      saveLocalStore(store);
    }

    if (isPostgresConfigured) {
      try {
        await sql`
          UPDATE roleflow_users
          SET is_banned = FALSE
          WHERE id = ${userIdOrEmail} OR LOWER(email) = ${clean};
        `;
      } catch (e) {
        console.error("Postgres unban user error:", e);
      }
    }
  },

  async incrementStrikes(userIdOrEmail: string): Promise<number> {
    await ensureDb();
    if (!userIdOrEmail) return 1;
    const clean = userIdOrEmail.toLowerCase().trim();
    let user = clean.includes("@")
      ? await this.getUserByEmail(clean)
      : await this.getUserById(userIdOrEmail);

    let newStrikes = 1;
    if (user) {
      newStrikes = (user.strikes || 0) + 1;
      user.strikes = newStrikes;
      await this.upsertUser(user);
      return newStrikes;
    } else {
      const store = getLocalStore();
      for (const [key, u] of Object.entries(store.users)) {
        if (u.id === userIdOrEmail || u.email.toLowerCase() === clean) {
          newStrikes = (u.strikes || 0) + 1;
          u.strikes = newStrikes;
          store.users[key] = u;
        }
      }
      saveLocalStore(store);
    }

    if (isPostgresConfigured) {
      try {
        await sql`
          UPDATE roleflow_users
          SET strikes = COALESCE(strikes, 0) + 1
          WHERE id = ${userIdOrEmail} OR LOWER(email) = ${clean};
        `;
      } catch (e) {
        console.error("Postgres increment strikes error:", e);
      }
    }

    return newStrikes;
  },

  async getUserBanStatus(userIdOrEmail: string): Promise<{ isBanned: boolean; strikes: number }> {
    if (!userIdOrEmail) return { isBanned: false, strikes: 0 };
    const clean = userIdOrEmail.toLowerCase().trim();
    const user = clean.includes("@")
      ? await this.getUserByEmail(clean)
      : await this.getUserById(userIdOrEmail);

    if (user) {
      return {
        isBanned: Boolean(user.isBanned),
        strikes: typeof user.strikes === "number" ? user.strikes : 0,
      };
    }
    return { isBanned: false, strikes: 0 };
  },

  // ───────────────────────────────────────────────────────────────────────────
  // System Configurations
  // ───────────────────────────────────────────────────────────────────────────
  async getSystemConfig(): Promise<SystemConfig> {
    await ensureDb();
    if (isPostgresConfigured) {
      try {
        const { rows } = await sql`
          SELECT value FROM roleflow_system_configs WHERE key = 'global';
        `;
        if (rows[0]?.value) {
          return {
            ...DEFAULT_SYSTEM_CONFIG,
            ...(typeof rows[0].value === "string" ? JSON.parse(rows[0].value) : rows[0].value),
          };
        }
      } catch (e) {
        console.error("Postgres get system config error:", e);
      }
    }
    const store = getLocalStore();
    return {
      ...DEFAULT_SYSTEM_CONFIG,
      ...(store.systemConfig || {}),
    };
  },

  async updateSystemConfig(patch: Partial<SystemConfig>): Promise<SystemConfig> {
    await ensureDb();
    const current = await this.getSystemConfig();
    const updated: SystemConfig = {
      guestLimit: typeof patch.guestLimit === "number" && patch.guestLimit > 0 ? patch.guestLimit : current.guestLimit,
      registeredDailyLimit: typeof patch.registeredDailyLimit === "number" && patch.registeredDailyLimit > 0 ? patch.registeredDailyLimit : current.registeredDailyLimit,
      maintenanceMode: typeof patch.maintenanceMode === "boolean" ? patch.maintenanceMode : current.maintenanceMode,
      broadcastBanner: typeof patch.broadcastBanner === "string" ? patch.broadcastBanner.trim() : current.broadcastBanner,
      allowHighEffort: typeof patch.allowHighEffort === "boolean" ? patch.allowHighEffort : current.allowHighEffort,
      apiKeysEnabled: typeof patch.apiKeysEnabled === "boolean" ? patch.apiKeysEnabled : current.apiKeysEnabled,
      apiKeyDefaultRpm: typeof patch.apiKeyDefaultRpm === "number" && patch.apiKeyDefaultRpm >= 1 ? patch.apiKeyDefaultRpm : current.apiKeyDefaultRpm,
      apiKeyDefaultRpd: typeof patch.apiKeyDefaultRpd === "number" && patch.apiKeyDefaultRpd >= 1 ? patch.apiKeyDefaultRpd : current.apiKeyDefaultRpd,
      apiKeyMaxPerUser: typeof patch.apiKeyMaxPerUser === "number" && patch.apiKeyMaxPerUser >= 1 ? patch.apiKeyMaxPerUser : current.apiKeyMaxPerUser,
    };

    if (isPostgresConfigured) {
      try {
        await sql`
          INSERT INTO roleflow_system_configs (key, value)
          VALUES ('global', ${JSON.stringify(updated)})
          ON CONFLICT (key) DO UPDATE SET value = ${JSON.stringify(updated)};
        `;
      } catch (e) {
        console.error("Postgres update system config error:", e);
      }
    }

    const store = getLocalStore();
    store.systemConfig = updated;
    saveLocalStore(store);

    return updated;
  },

  // ───────────────────────────────────────────────────────────────────────────
  // Admin email broadcasts
  // ───────────────────────────────────────────────────────────────────────────
  async saveBroadcastLog(
    entry: Omit<EmailBroadcastLog, "id" | "createdAt"> & { id?: string; createdAt?: string }
  ): Promise<EmailBroadcastLog> {
    await ensureDb();
    const record: EmailBroadcastLog = {
      id: entry.id || `bc_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`,
      adminEmail: entry.adminEmail,
      targetType: entry.targetType,
      targetEmail: entry.targetEmail ?? null,
      subject: entry.subject,
      templateId: entry.templateId ?? null,
      totalRecipients: entry.totalRecipients,
      deliveredCount: entry.deliveredCount,
      failedCount: entry.failedCount,
      status: entry.status,
      createdAt: entry.createdAt || new Date().toISOString(),
    };

    if (isPostgresConfigured) {
      try {
        await sql`
          INSERT INTO roleflow_email_broadcasts
            (id, admin_email, target_type, target_email, subject, template_id, total_recipients, delivered_count, failed_count, status, created_at)
          VALUES
            (${record.id}, ${record.adminEmail}, ${record.targetType}, ${record.targetEmail}, ${record.subject}, ${record.templateId}, ${record.totalRecipients}, ${record.deliveredCount}, ${record.failedCount}, ${record.status}, ${record.createdAt});
        `;
      } catch (e) {
        console.error("Postgres save broadcast log error:", e);
      }
    } else {
      const store = getLocalStore();
      store.emailBroadcasts = [record, ...(store.emailBroadcasts || [])].slice(0, 500);
      saveLocalStore(store);
    }
    return record;
  },

  async getBroadcastHistory(limit = 100): Promise<EmailBroadcastLog[]> {
    await ensureDb();
    const max = Math.min(Math.max(1, Math.floor(limit)), 500);

    if (isPostgresConfigured) {
      try {
        const { rows } = await sql`
          SELECT id, admin_email as "adminEmail", target_type as "targetType", target_email as "targetEmail", subject,
                 template_id as "templateId", total_recipients as "totalRecipients", delivered_count as "deliveredCount",
                 failed_count as "failedCount", status, created_at as "createdAt"
          FROM roleflow_email_broadcasts
          ORDER BY created_at DESC
          LIMIT ${max};
        `;
        return rows as unknown as EmailBroadcastLog[];
      } catch (e) {
        console.error("Postgres get broadcast history error:", e);
        return [];
      }
    }

    return (getLocalStore().emailBroadcasts || []).slice(0, max);
  },

  // ───────────────────────────────────────────────────────────────────────────
  // User Management
  // ───────────────────────────────────────────────────────────────────────────
  async getAllUsers(): Promise<UserProfile[]> {
    await ensureDb();
    const usersMap = new Map<string, UserProfile>();

    if (isPostgresConfigured) {
      try {
        const { rows } = await sql`
          SELECT id, email, name, custom_instructions as "customInstructions", response_instructions as "responseInstructions", is_admin as "isAdmin", plan, message_count as "messageCount", last_reset_date as "lastResetDate", is_banned as "isBanned", strikes, created_at as "createdAt"
          FROM roleflow_users ORDER BY created_at DESC;
        `;
        for (const row of rows) {
          const patched = patchUserProfile(row as unknown as UserProfile);
          usersMap.set(patched.email.toLowerCase(), patched);
        }
      } catch (e) {
        console.error("Postgres get all users error:", e);
      }
    }

    const store = getLocalStore();
    for (const rawUser of Object.values(store.users || {})) {
      const patched = patchUserProfile(rawUser);
      if (!usersMap.has(patched.email.toLowerCase())) {
        usersMap.set(patched.email.toLowerCase(), patched);
      }
    }

    return Array.from(usersMap.values()).sort(
      (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
    );
  },

  async toggleUserAdmin(userIdOrEmail: string): Promise<UserProfile | null> {
    await ensureDb();
    if (!userIdOrEmail) return null;
    const clean = userIdOrEmail.toLowerCase().trim();
    let user = clean.includes("@")
      ? await this.getUserByEmail(clean)
      : await this.getUserById(userIdOrEmail);

    if (!user) return null;

    // Jordan Daniels is permanently super admin
    if (user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
      user.isAdmin = true;
      user.plan = "ADMIN";
      return await this.upsertUser(user);
    }

    user.isAdmin = !user.isAdmin;
    user.plan = user.isAdmin ? "ADMIN" : "FREE";
    return await this.upsertUser(user);
  },

  async resetUserQuota(userIdOrEmail: string): Promise<UserProfile | null> {
    await ensureDb();
    if (!userIdOrEmail) return null;
    const clean = userIdOrEmail.toLowerCase().trim();
    let user = clean.includes("@")
      ? await this.getUserByEmail(clean)
      : await this.getUserById(userIdOrEmail);

    if (!user) return null;

    user.messageCount = 0;
    user.lastResetDate = getTodayDateString();
    return await this.upsertUser(user);
  },

  // ───────────────────────────────────────────────────────────────────────────
  // API keys. Postgres when configured; errors propagate there, because a key must
  // never be written to the ephemeral local fallback. Otherwise the local store.
  // Only the SHA-256 hash of a key is ever stored.
  // ───────────────────────────────────────────────────────────────────────────
  async createApiKey(record: ApiKey): Promise<ApiKey> {
    await ensureDb();
    if (isPostgresConfigured) {
      const allowed = JSON.stringify(record.allowedModels ?? ALL_API_MODELS);
      await sql`
        INSERT INTO roleflow_api_keys
          (id, user_id, user_email, name, key_hash, key_prefix, status, request_count,
           rpm, rpd, expires_at, last_used_at, daily_count, daily_date, allowed_models, created_at)
        VALUES
          (${record.id}, ${record.userId}, ${record.userEmail}, ${record.name}, ${record.keyHash},
           ${record.keyPrefix}, ${record.status}, ${record.requestCount}, ${record.rateLimit.rpm},
           ${record.rateLimit.rpd}, ${record.expiresAt ?? null}, ${record.lastUsedAt ?? null},
           ${record.dailyCount ?? 0}, ${record.dailyDate ?? null}, ${allowed}, ${record.createdAt});
      `;
      return record;
    }
    const store = getLocalStore();
    store.apiKeys = store.apiKeys || {};
    store.apiKeys[record.id] = record;
    saveLocalStore(store);
    return record;
  },

  async listApiKeysByUser(userId: string): Promise<ApiKey[]> {
    await ensureDb();
    if (isPostgresConfigured) {
      const { rows } = await sql`
        SELECT * FROM roleflow_api_keys WHERE user_id = ${userId} ORDER BY created_at DESC;
      `;
      return rows.map(rowToApiKey);
    }
    const store = getLocalStore();
    return Object.values(store.apiKeys || {})
      .filter((k) => k.userId === userId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  async getApiKeyByHash(keyHash: string): Promise<ApiKey | null> {
    await ensureDb();
    if (isPostgresConfigured) {
      const { rows } = await sql`
        SELECT * FROM roleflow_api_keys WHERE key_hash = ${keyHash} LIMIT 1;
      `;
      return rows[0] ? rowToApiKey(rows[0]) : null;
    }
    const store = getLocalStore();
    return Object.values(store.apiKeys || {}).find((k) => k.keyHash === keyHash) ?? null;
  },

  /** Revokes one key owned by userId. Returns false if no such key belongs to that user. */
  async revokeApiKey(id: string, userId: string): Promise<boolean> {
    await ensureDb();
    if (isPostgresConfigured) {
      const result = await sql`
        UPDATE roleflow_api_keys SET status = 'revoked'
        WHERE id = ${id} AND user_id = ${userId};
      `;
      return (result.rowCount ?? 0) > 0;
    }
    const store = getLocalStore();
    const key = store.apiKeys?.[id];
    if (!key || key.userId !== userId) return false;
    key.status = "revoked";
    saveLocalStore(store);
    return true;
  },

  /** Used when an account is banned: every active key it owns stops working. */
  async revokeAllApiKeysForUser(userId: string): Promise<void> {
    await ensureDb();
    if (isPostgresConfigured) {
      await sql`
        UPDATE roleflow_api_keys SET status = 'revoked'
        WHERE user_id = ${userId} AND status = 'active';
      `;
      return;
    }
    const store = getLocalStore();
    let changed = false;
    for (const key of Object.values(store.apiKeys || {})) {
      if (key.userId === userId && key.status === "active") {
        key.status = "revoked";
        changed = true;
      }
    }
    if (changed) saveLocalStore(store);
  },

  /** Records one successful API request: last used, lifetime count, and the UTC daily counter. */
  async touchApiKeyUsage(id: string): Promise<void> {
    await ensureDb();
    const today = getTodayDateString();
    if (isPostgresConfigured) {
      await sql`
        UPDATE roleflow_api_keys SET
          last_used_at = NOW(),
          request_count = COALESCE(request_count, 0) + 1,
          daily_count = CASE WHEN daily_date = ${today} THEN COALESCE(daily_count, 0) + 1 ELSE 1 END,
          daily_date = ${today}
        WHERE id = ${id};
      `;
      return;
    }
    const store = getLocalStore();
    const key = store.apiKeys?.[id];
    if (!key) return;
    key.lastUsedAt = new Date().toISOString();
    key.requestCount = (key.requestCount || 0) + 1;
    key.dailyCount = key.dailyDate === today ? (key.dailyCount || 0) + 1 : 1;
    key.dailyDate = today;
    saveLocalStore(store);
  },
};
