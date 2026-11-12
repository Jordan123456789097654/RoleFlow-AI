export interface MemoryItem {
  id: string;
  userId: string;
  memory: string;
  createdAt: string;
}

export interface SystemConfig {
  guestLimit: number;
  registeredDailyLimit: number;
  maintenanceMode: boolean;
  broadcastBanner: string;
  allowHighEffort: boolean;
}

export type EffortLevel = "low" | "medium" | "high" | "extra" | "max";

export type ModelId = "roleflow-genesis-1" | "roleflow-flash-1";

export interface ModelInfo {
  id: ModelId;
  name: string;
  tagline: string;
  badge?: string;
  description: string;
}

export interface Attachment {
  name: string;
  type: string;
  size: number;
  content: string; // text or base64 data
}

export interface ArtifactFile {
  filename: string;
  language: string;
  content: string;
}

export interface Artifact {
  id: string;
  title: string;
  type: "code" | "web" | "document";
  primaryLanguage: string;
  files: ArtifactFile[];
  createdAt: string;
}

export interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  thinking?: string;
  thinkingTime?: number;
  attachments?: Attachment[];
  generatedFiles?: GeneratedFile[];
  artifact?: Artifact;
  createdAt: string;
  moderationBlocked?: boolean;
  moderationTier?: ModerationTier;
  moderationCategory?: string;
  moderationLogId?: string;
  canAppeal?: boolean;
  appealStatus?: "NONE" | "APPEALED" | "RESOLVED";
}

export interface Chat {
  id: string;
  userId?: string;
  title: string;
  projectId?: string;
  pinned?: boolean;
  messages: Message[];
  model: ModelId;
  effort: EffortLevel;
  createdAt: string;
  updatedAt: string;
}

export interface Project {
  id: string;
  userId?: string;
  name: string;
  description?: string;
  customInstructions?: string;
  createdAt: string;
}

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  customInstructions?: string;
  responseInstructions?: string;
  isAdmin?: boolean;
  plan?: "FREE" | "ADMIN" | "PRO";
  messageCount?: number;
  lastResetDate?: string;
  isBanned?: boolean;
  strikes?: number;
  createdAt: string;
}

export interface UsageStats {
  used: number;
  limit: number;
  remaining: number;
  isUnlimited: boolean;
  resetsAt?: string;
}

export interface ApiKeyRateLimit {
  rpm: number; // requests per minute (e.g. 30 or -1 for unlimited)
  rpd: number; // requests per day (e.g. 2500 or -1 for unlimited)
}

export interface ApiKey {
  id: string;
  userId: string;
  userEmail: string;
  name: string;
  keyHash: string;
  keyPrefix: string;
  createdAt: string;
  lastUsedAt?: string;
  status: "active" | "revoked";
  requestCount: number;
  rateLimit: ApiKeyRateLimit;
}

export type ModerationTier = 1 | 2;

export type ModerationCategory =
  | "VIOLENT_EXTREMISM"
  | "DOMESTIC_TERRORISM"
  | "MASS_VIOLENCE"
  | "WEAPONS_MANUFACTURING"
  | "CSAM"
  | "IMMINENT_THREAT_TO_LIFE"
  | "CYBERATTACK"
  | "RANSOMWARE_MALWARE"
  | "SELF_HARM"
  | "IMAGE_REVIEW";

export type ModerationStatus = "FLAGGED" | "BANNED" | "APPEALED" | "RESOLVED";

export interface ModerationLogEntry {
  id: string;
  userId: string;
  userEmail: string;
  prompt: string;
  tier: ModerationTier;
  category: ModerationCategory | string;
  status: ModerationStatus;
  appealNote?: string;
  ipAddress: string;
  createdAt: string;
  reason?: string;
  matchedKeywords?: string[];
  /** JSON-encoded IncidentContext: the conversation as it stood when the incident was flagged. */
  context?: string;
}

export interface ModerationVerdict {
  flagged: boolean;
  tier: ModerationTier | null;
  category: ModerationCategory | null;
  reason: string | null;
  confidence: number;
  matchedKeywords?: string[];
  action: "BLOCK_AND_BAN" | "REFUSE_WITH_WARNING" | "ALLOW";
}

export interface IncidentAttachment {
  name: string;
  type: string;
  size: number;
  text?: string;
  truncated?: boolean;
  imageDataUrl?: string | null;
}

export interface IncidentTurn {
  role: string;
  createdAt?: string;
  content: string;
  attachments?: IncidentAttachment[];
}

export interface IncidentContext {
  capturedAt: string;
  turns: IncidentTurn[];
}

export interface GeneratedFile {
  name: string;
  type: string;
  size: number;
  dataUrl: string;
}
