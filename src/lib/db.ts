import fs from "fs";
import path from "path";
import { sql } from "@vercel/postgres";
import { Chat, Project, UserProfile, ModerationLogEntry, ModerationStatus } from "@/types";

const DATA_DIR = path.join(process.cwd(), ".data");
const STORE_FILE = path.join(DATA_DIR, "store.json");

export const ADMIN_EMAIL = "jordanedanield13@gmail.com";
export const FREE_DAILY_LIMIT = 25;
export const GUEST_TOTAL_LIMIT = 5;

interface LocalStore {
  users: Record<string, UserProfile>;
  chats: Record<string, Chat>;
  projects: Record<string, Project>;
  authCodes: Record<
    string,
    { code: string; email: string; token: string; expiresAt: number }
  >;
  guestUsage?: Record<string, { count: number; lastResetDate: string }>;
  moderationLogs?: Record<string, ModerationLogEntry>;
}

export function getTodayDateString(): string {
  return new Date().toISOString().slice(0, 10);
}

export function patchUserProfile(user: UserProfile): UserProfile {
  const isJordanAdmin = user.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase();
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
    fs.writeFileSync(STORE_FILE, JSON.stringify(store, null, 2), "utf-8");
  } catch (err) {
    console.error("Local store save error:", err);
  }
}

const isPostgresConfigured = Boolean(process.env.POSTGRES_URL);

let isInitialized = false;
async function ensureDb() {
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
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;
    await sql`
      ALTER TABLE roleflow_users ADD COLUMN IF NOT EXISTS response_instructions TEXT;
      ALTER TABLE roleflow_users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;
      ALTER TABLE roleflow_users ADD COLUMN IF NOT EXISTS plan VARCHAR(50) DEFAULT 'FREE';
      ALTER TABLE roleflow_users ADD COLUMN IF NOT EXISTS message_count INTEGER DEFAULT 0;
      ALTER TABLE roleflow_users ADD COLUMN IF NOT EXISTS last_reset_date VARCHAR(20);
      ALTER TABLE roleflow_users ADD COLUMN IF NOT EXISTS is_banned BOOLEAN DEFAULT FALSE;
      ALTER TABLE roleflow_users ADD COLUMN IF NOT EXISTS strikes INTEGER DEFAULT 0;
    `;
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
        expires_at BIGINT NOT NULL
      );
    `;
    isInitialized = true;
  } catch (error) {
    console.warn("Postgres initialization notice (using fallback):", error);
  }
}

export const db = {
  // Auth Codes
  async saveAuthCode(email: string, code: string, token: string, expiresAt: number) {
    await ensureDb();
    if (isPostgresConfigured) {
      try {
        await sql`
          INSERT INTO roleflow_auth_codes (email, code, token, expires_at)
          VALUES (${email.toLowerCase()}, ${code}, ${token}, ${expiresAt})
          ON CONFLICT (email) DO UPDATE
          SET code = ${code}, token = ${token}, expires_at = ${expiresAt};
        `;
        return;
      } catch (e) {
        console.error("Postgres auth code save error:", e);
      }
    }
    const store = getLocalStore();
    store.authCodes[email.toLowerCase()] = { code, email, token, expiresAt };
    saveLocalStore(store);
  },

  async verifyAuthCode(email: string, inputCodeOrToken: string): Promise<boolean> {
    await ensureDb();
    const cleanEmail = email.toLowerCase();
    const now = Date.now();

    if (isPostgresConfigured) {
      try {
        const { rows } = await sql`
          SELECT * FROM roleflow_auth_codes
          WHERE email = ${cleanEmail} AND (code = ${inputCodeOrToken} OR token = ${inputCodeOrToken}) AND expires_at > ${now};
        `;
        if (rows.length > 0) {
          await sql`DELETE FROM roleflow_auth_codes WHERE email = ${cleanEmail};`;
          return true;
        }
        return false;
      } catch (e) {
        console.error("Postgres auth verify error:", e);
      }
    }

    const store = getLocalStore();
    const entry = store.authCodes[cleanEmail];
    if (entry && (entry.code === inputCodeOrToken || entry.token === inputCodeOrToken) && entry.expiresAt > now) {
      delete store.authCodes[cleanEmail];
      saveLocalStore(store);
      return true;
    }
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

    if (!identifier || isGuest || identifier.startsWith("guest_")) {
      const store = getLocalStore();
      const guestRecords = store.guestUsage || {};
      const key = identifier || "guest_default";
      const entry = guestRecords[key] || { count: 0, lastResetDate: today };
      const used = entry.count;
      const limit = GUEST_TOTAL_LIMIT;
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
        limit: GUEST_TOTAL_LIMIT,
        remaining: GUEST_TOTAL_LIMIT,
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

    const limit = FREE_DAILY_LIMIT;
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

    if (!identifier || isGuest || identifier.startsWith("guest_")) {
      const store = getLocalStore();
      if (!store.guestUsage) store.guestUsage = {};
      const key = identifier || "guest_default";
      const entry = store.guestUsage[key] || { count: 0, lastResetDate: today };
      entry.count += 1;
      store.guestUsage[key] = entry;
      saveLocalStore(store);

      const used = entry.count;
      const limit = GUEST_TOTAL_LIMIT;
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
        limit: GUEST_TOTAL_LIMIT,
        remaining: Math.max(0, GUEST_TOTAL_LIMIT - 1),
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

    const limit = FREE_DAILY_LIMIT;
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
    const users = Object.values(store.users).map((u) => patchUserProfile(u));
    const totalChats = Object.keys(store.chats).length;

    // Check Groq pool keys
    const envKeys = process.env.GROQ_API_KEYS || "";
    const keyList = envKeys
      .split(",")
      .map((k) => k.trim())
      .filter((k) => k.startsWith("gsk_"));

    return {
      totalUsers: users.length,
      totalChats,
      modelKeys: {
        total: keyList.length,
        active: keyList.length,
        keysMasked: keyList.map((k) => `${k.slice(0, 10)}...${k.slice(-4)}`),
      },
      users: users.map((u) => ({
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
  async getChat(chatId: string, userId?: string): Promise<Chat | null> {
    await ensureDb();
    if (isPostgresConfigured) {
      try {
        const { rows } = await sql`
          SELECT id, user_id as "userId", title, project_id as "projectId", pinned, model, effort, messages, created_at as "createdAt", updated_at as "updatedAt"
          FROM roleflow_chats WHERE id = ${chatId};
        `;
        if (rows[0]) {
          const chat = rows[0] as unknown as Chat;
          if (userId && chat.userId && chat.userId !== userId) {
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
      if (userId && chat.userId && chat.userId !== userId) {
        return null; // Restricted
      }
      return chat;
    }
    return null;
  },

  async saveChat(chat: Chat): Promise<void> {
    await ensureDb();
    if (isPostgresConfigured) {
      try {
        await sql`
          INSERT INTO roleflow_chats (id, user_id, title, project_id, pinned, model, effort, messages, updated_at)
          VALUES (${chat.id}, ${chat.userId || null}, ${chat.title}, ${chat.projectId || null}, ${chat.pinned || false}, ${chat.model}, ${chat.effort}, ${JSON.stringify(chat.messages)}, NOW())
          ON CONFLICT (id) DO UPDATE
          SET user_id = ${chat.userId || null}, title = ${chat.title}, project_id = ${chat.projectId || null}, pinned = ${chat.pinned || false}, model = ${chat.model}, effort = ${chat.effort}, messages = ${JSON.stringify(chat.messages)}, updated_at = NOW();
        `;
        return;
      } catch (e) {
        console.error("Postgres save chat error:", e);
      }
    }
    const store = getLocalStore();
    store.chats[chat.id] = chat;
    saveLocalStore(store);
  },

  async deleteChat(chatId: string, userId?: string): Promise<boolean> {
    await ensureDb();
    if (isPostgresConfigured) {
      try {
        if (userId) {
          await sql`DELETE FROM roleflow_chats WHERE id = ${chatId} AND (user_id = ${userId} OR user_id IS NULL);`;
        } else {
          await sql`DELETE FROM roleflow_chats WHERE id = ${chatId};`;
        }
        return true;
      } catch (e) {
        console.error("Postgres delete chat error:", e);
      }
    }
    const store = getLocalStore();
    const chat = store.chats[chatId];
    if (chat) {
      if (userId && chat.userId && chat.userId !== userId) {
        return false;
      }
      delete store.chats[chatId];
      saveLocalStore(store);
      return true;
    }
    return false;
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
    await ensureDb();
    if (isPostgresConfigured) {
      try {
        if (userId) {
          const { rows } = await sql`
            SELECT id, name, description, custom_instructions as "customInstructions", created_at as "createdAt"
            FROM roleflow_projects WHERE user_id = ${userId} OR user_id IS NULL ORDER BY created_at DESC;
          `;
          return rows as unknown as Project[];
        }
        const { rows } = await sql`
          SELECT id, name, description, custom_instructions as "customInstructions", created_at as "createdAt"
          FROM roleflow_projects ORDER BY created_at DESC;
        `;
        return rows as unknown as Project[];
      } catch (e) {
        console.error("Postgres get projects error:", e);
      }
    }
    const store = getLocalStore();
    return Object.values(store.projects);
  },

  async saveProject(project: Project): Promise<void> {
    await ensureDb();
    if (isPostgresConfigured) {
      try {
        await sql`
          INSERT INTO roleflow_projects (id, user_id, name, description, custom_instructions)
          VALUES (${project.id}, ${project.userId || null}, ${project.name}, ${project.description || ""}, ${project.customInstructions || ""})
          ON CONFLICT (id) DO UPDATE
          SET name = ${project.name}, description = ${project.description || ""}, custom_instructions = ${project.customInstructions || ""};
        `;
        return;
      } catch (e) {
        console.error("Postgres save project error:", e);
      }
    }
    const store = getLocalStore();
    store.projects[project.id] = project;
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
          INSERT INTO roleflow_moderation_logs (id, user_id, user_email, prompt, tier, category, status, appeal_note, ip_address, created_at)
          VALUES (${log.id}, ${log.userId}, ${log.userEmail}, ${log.prompt}, ${log.tier}, ${log.category}, ${log.status}, ${log.appealNote || null}, ${log.ipAddress || ""}, ${log.createdAt ? new Date(log.createdAt).toISOString() : new Date().toISOString()})
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
          SELECT id, user_id as "userId", user_email as "userEmail", prompt, tier, category, status, appeal_note as "appealNote", ip_address as "ipAddress", created_at as "createdAt"
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
          SELECT id, user_id as "userId", user_email as "userEmail", prompt, tier, category, status, appeal_note as "appealNote", ip_address as "ipAddress", created_at as "createdAt"
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
};
