import fs from "fs";
import path from "path";
import { sql } from "@vercel/postgres";
import { MemoryItem } from "@/types";

const DATA_DIR = path.join(process.cwd(), ".data");
const STORE_FILE = path.join(DATA_DIR, "store.json");
const isPostgresConfigured = Boolean(process.env.POSTGRES_URL);

let isDbReady = false;
async function ensureMemoryTable() {
  if (!isPostgresConfigured || isDbReady) return;
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS roleflow_memories (
        id VARCHAR(255) PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL,
        memory TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_roleflow_memories_user ON roleflow_memories(user_id);
    `;
    isDbReady = true;
  } catch (error) {
    console.warn("Postgres memory table initialization notice:", error);
  }
}

interface LocalStore {
  memories?: Record<string, MemoryItem[]>;
  [key: string]: any;
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
    console.error("Local store read error in memory.ts:", err);
  }
  return {};
}

function saveLocalStore(store: LocalStore) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(STORE_FILE, JSON.stringify(store, null, 2), "utf-8");
  } catch (err) {
    console.error("Local store save error in memory.ts:", err);
  }
}

/**
 * Retrieve all personalized memory items for a specific user.
 */
export async function getMemories(userId: string): Promise<MemoryItem[]> {
  if (!userId) return [];
  const cleanUserId = userId.trim();

  // Try Postgres if configured
  if (isPostgresConfigured) {
    try {
      await ensureMemoryTable();
      const { rows } = await sql`
        SELECT id, user_id as "userId", memory, created_at as "createdAt"
        FROM roleflow_memories
        WHERE user_id = ${cleanUserId}
        ORDER BY created_at ASC;
      `;
      return rows.map((r: any) => ({
        id: r.id,
        userId: r.userId,
        memory: r.memory,
        createdAt: r.createdAt ? new Date(r.createdAt).toISOString() : new Date().toISOString(),
      }));
    } catch (e) {
      console.error("Postgres get memories error:", e);
    }
  }

  // LocalStore fallback
  const store = getLocalStore();
  const userMemories = store.memories?.[cleanUserId] || [];
  return [...userMemories].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );
}

/**
 * Add a new personalized memory item for a user.
 */
export async function addMemory(userId: string, memory: string): Promise<MemoryItem> {
  if (!userId) throw new Error("userId is required to save memory");
  const trimmed = memory?.trim();
  if (!trimmed) throw new Error("memory content cannot be empty");

  const cleanUserId = userId.trim();
  const id = "mem-" + Date.now() + "-" + Math.random().toString(36).substring(2, 8);
  const createdAt = new Date().toISOString();

  const item: MemoryItem = {
    id,
    userId: cleanUserId,
    memory: trimmed,
    createdAt,
  };

  if (isPostgresConfigured) {
    try {
      await ensureMemoryTable();
      await sql`
        INSERT INTO roleflow_memories (id, user_id, memory, created_at)
        VALUES (${id}, ${cleanUserId}, ${trimmed}, ${createdAt})
        ON CONFLICT (id) DO UPDATE SET memory = ${trimmed};
      `;
      return item;
    } catch (e) {
      console.error("Postgres add memory error:", e);
    }
  }

  // LocalStore persistence
  const store = getLocalStore();
  if (!store.memories) {
    store.memories = {};
  }
  if (!store.memories[cleanUserId]) {
    store.memories[cleanUserId] = [];
  }

  store.memories[cleanUserId].push(item);
  saveLocalStore(store);

  return item;
}

/**
 * Remove a specific memory item by memoryId for a user.
 */
export async function removeMemory(userId: string, memoryId: string): Promise<boolean> {
  if (!memoryId) return false;
  const cleanUserId = userId ? userId.trim() : "";

  if (isPostgresConfigured) {
    try {
      await ensureMemoryTable();
      if (cleanUserId) {
        await sql`
          DELETE FROM roleflow_memories
          WHERE id = ${memoryId} AND user_id = ${cleanUserId};
        `;
      } else {
        await sql`
          DELETE FROM roleflow_memories
          WHERE id = ${memoryId};
        `;
      }
      return true;
    } catch (e) {
      console.error("Postgres delete memory error:", e);
    }
  }

  const store = getLocalStore();
  if (!store.memories) return false;

  let removed = false;
  if (cleanUserId && store.memories[cleanUserId]) {
    const initialLen = store.memories[cleanUserId].length;
    store.memories[cleanUserId] = store.memories[cleanUserId].filter((m) => m.id !== memoryId);
    if (store.memories[cleanUserId].length < initialLen) {
      removed = true;
    }
  } else {
    // Search across all users if cleanUserId was not specified
    for (const uKey of Object.keys(store.memories)) {
      const initialLen = store.memories[uKey].length;
      store.memories[uKey] = store.memories[uKey].filter((m) => m.id !== memoryId);
      if (store.memories[uKey].length < initialLen) {
        removed = true;
      }
    }
  }

  if (removed) {
    saveLocalStore(store);
  }
  return removed;
}

/**
 * Remove all memories for a user.
 */
export async function clearAllMemories(userId: string): Promise<boolean> {
  const cleanUserId = userId.trim();
  if (!cleanUserId) return false;

  if (isPostgresConfigured) {
    try {
      await ensureMemoryTable();
      await sql`DELETE FROM roleflow_memories WHERE user_id = ${cleanUserId};`;
      return true;
    } catch (e) {
      console.error("Postgres clear all memories error:", e);
    }
  }

  const store = getLocalStore();
  if (store.memories && store.memories[cleanUserId]) {
    store.memories[cleanUserId] = [];
    saveLocalStore(store);
  }
  return true;
}

/**
 * Format memories into an injection string for the AI prompt.
 * If user has no memories, returns empty string.
 */
export async function formatMemoriesForPrompt(userId: string): Promise<string> {
  if (!userId) return "";
  try {
    const items = await getMemories(userId);
    if (!items || items.length === 0) return "";

    const lines = items.map((m) => `* ${m.memory}`).join("\n");
    return `User Long-Term Memory (Persistent facts recalled across previous conversations):\n${lines}\n(Apply these learned preferences and facts naturally without explicitly quoting "according to my memory").`;
  } catch (err) {
    console.error("Failed to format memories for prompt:", err);
    return "";
  }
}

/**
 * Helper to count total memories across all users (for cluster telemetry).
 */
export async function getTotalMemoriesCount(): Promise<number> {
  if (isPostgresConfigured) {
    try {
      await ensureMemoryTable();
      const { rows } = await sql`SELECT count(*)::int as count FROM roleflow_memories;`;
      return rows[0]?.count || 0;
    } catch (e) {
      console.error("Postgres count memories error:", e);
    }
  }
  const store = getLocalStore();
  if (!store.memories) return 0;
  return Object.values(store.memories).reduce((acc, arr) => acc + (arr?.length || 0), 0);
}
