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
  apiKeysEnabled: boolean;
  apiKeyDefaultRpm: number;
  apiKeyDefaultRpd: number;
  apiKeyMaxPerUser: number;
  forcedModel?: ModelId | null;
  forcedEffort?: EffortLevel | null;
}

export type EffortLevel = "low" | "medium" | "high" | "extra" | "max";

/** Current model IDs. Retired IDs such as "roleflow-flash-1" are resolved through lib/models.ts. */
export type ModelId = "roleflow-apex-1" | "roleflow-omni-1" | "roleflow-genesis-1" | "roleflow-flash-2";

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

/** Per-reply generation stats, shown under assistant replies. */
export interface MessageMeta {
  model: string;
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
  /** Wall-clock time from request start to the final token. */
  latencyMs: number;
  /** Completion tokens per second, when token counts are known. */
  tokensPerSecond?: number;
  /** True when the reply came from the fallback model instead of the tier's primary model. */
  usedFallback?: boolean;
}

/** A web result used to ground a reply. Cited in the text as [1], [2], and so on. */
export interface WebSource {
  title: string;
  url: string;
  snippet?: string;
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
  meta?: MessageMeta;
  sources?: WebSource[];
  /** True when the user stopped the reply before it finished. */
  stopped?: boolean;
}

/**
 * Summary of the oldest turns of a long chat. The model sees it in place of those turns.
 * coveredCount is how many messages from the start of the chat the summary replaces.
 */
export interface CompactionState {
  summary: string;
  coveredCount: number;
  updatedAt: string;
}

export interface Chat {
  id: string;
  compaction?: CompactionState;
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
  /** When a temporary suspension ends. Empty for permanent bans. */
  suspendedUntil?: string;
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
  expiresAt?: string;
  /** Successful requests on dailyDate (UTC). Resets when the date changes. */
  dailyCount?: number;
  dailyDate?: string;
  allowedModels?: ModelId[];
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
  | "VIOLENT_THREAT"
  | "FRAUD_PHISHING"
  | "DRUG_SYNTHESIS"
  | "SELF_HARM"
  | "IMAGE_REVIEW";

export type ModerationStatus = "FLAGGED" | "BANNED" | "APPEALED" | "RESOLVED" | "ESCALATED";

/** A staff note or an audit entry written by an admin on an incident. */
export interface AdminNote {
  id: string;
  text: string;
  authorEmail: string;
  createdAt: string;
  kind: "note" | "action";
}

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
  /** Staff notes and audit entries, oldest first. */
  adminNotes?: AdminNote[];
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

export type EmailTargetType = "broadcast" | "single" | "test";

/** One row of the admin email send history (table roleflow_email_broadcasts). */
export interface EmailBroadcastLog {
  id: string;
  adminEmail: string;
  targetType: EmailTargetType;
  targetEmail: string | null;
  subject: string;
  templateId: string | null;
  totalRecipients: number;
  deliveredCount: number;
  failedCount: number;
  status: "completed" | "partial" | "failed";
  createdAt: string;
}

/** Extra-usage license key. Only the SHA-256 hash of the key is stored. */
export type LicenseKeyState = "unused" | "redeemed";

/** Display status derived from a record and the current time. */
export type LicenseKeyStatus = "unused" | "active" | "used_up" | "expired";

export interface LicenseKeyRecord {
  id: string;
  keyHash: string;
  keyPrefix: string;
  /** Messages granted when the key is redeemed. */
  amount: number;
  /** Days the balance lasts after redemption, or null for no expiry. */
  durationDays: number | null;
  status: LicenseKeyState;
  /** Messages still unspent on this key. */
  remaining: number;
  note?: string;
  recipientEmail?: string;
  createdBy: string;
  createdAt: string;
  sentAt?: string;
  redeemedAt?: string;
  redeemedByEmail?: string;
  /** Set when the key is redeemed. Null means no expiry. */
  expiresAt?: string | null;
}

/** Record of a Tier 1 incident referred to an agency. */
export interface ReferralRecord {
  id: string;
  reference: string;
  incidentId: string;
  userId: string;
  agencyName: string;
  recipientEmail: string;
  adminEmail: string;
  adminName: string;
  adminTitle: string;
  sentAt: string;
  excerptIncluded: boolean;
  userNotified: boolean;
  status: "sent";
}

export type LawRequestType = "subpoena" | "court_order" | "search_warrant" | "emergency_disclosure" | "preservation";
export type LawRequestStatus = "received" | "in_review" | "closed" | "rejected";

/** A request from a law enforcement agency, submitted at /law-enforcement. */
export interface LawRequestRecord {
  id: string;
  reference: string;
  requestType: LawRequestType;
  agencyName: string;
  officerName: string;
  badgeId: string;
  caseNumber: string;
  accountIdentifier: string;
  contactEmail: string;
  statement: string;
  emergency: boolean;
  preservationExpiresAt: string | null;
  status: LawRequestStatus;
  reviewNote?: string;
  reviewedBy?: string;
  createdAt: string;
  updatedAt: string;
}
