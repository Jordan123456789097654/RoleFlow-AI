/**
 * Vector icon set for transactional and broadcast emails. Each icon ships as a 192px PNG under
 * public/email/ (rendered from a 24px stroke SVG), because most mail clients block SVG. Client-safe.
 */
export const EMAIL_ASSET_BASE = "https://roleflow.site/email";

export const EMAIL_ICONS = [
  { id: "shield", label: "Shield (security)" },
  { id: "lock", label: "Lock (account security)" },
  { id: "key", label: "Key (access, licences)" },
  { id: "scale", label: "Scale (legal)" },
  { id: "wrench", label: "Wrench (maintenance, product changes)" },
  { id: "alert", label: "Alert (incidents)" },
  { id: "bolt", label: "Bolt (speed, launches)" },
  { id: "globe", label: "Globe (network, regions)" },
  { id: "sparkle", label: "Sparkle (features, news)" },
  { id: "document", label: "Document (policies, reports)" },
  { id: "card", label: "Card (billing)" },
  { id: "users", label: "Users (community)" },
  { id: "chart", label: "Chart (usage, quotas)" },
  { id: "calendar", label: "Calendar (dates, windows)" },
  { id: "mail", label: "Mail (messages)" },
  { id: "cookie", label: "Cookie (privacy)" },
  { id: "signin", label: "Sign-in (access)" },
  { id: "check", label: "Check (resolved, done)" },
  { id: "ban", label: "Ban (restrictions)" },
  { id: "terminal", label: "Terminal (CLI, developer tools)" },
  { id: "rocket", label: "Rocket (launches, releases)" },
  { id: "cpu", label: "CPU (models, neural engine)" },
  { id: "code", label: "Code (engineering, syntax)" },
  { id: "database", label: "Database (memory, data)" },
  { id: "book", label: "Book (handbook, guides)" },
  { id: "server", label: "Server (infrastructure, telemetry)" },
  { id: "flame", label: "Flame (performance, speed)" },
  { id: "star", label: "Star (highlights, featured)" },
  { id: "pen", label: "Pen (writing, blog, editorial)" },
  { id: "cloud", label: "Cloud (serverless, clusters)" },
  { id: "compass", label: "Compass (architecture, roadmap)" },
] as const;

export type EmailIconId = (typeof EMAIL_ICONS)[number]["id"];

export const DEFAULT_EMAIL_ICON: EmailIconId = "sparkle";

export function isEmailIcon(value: unknown): value is EmailIconId {
  return typeof value === "string" && EMAIL_ICONS.some((i) => i.id === value);
}

/** Resolves an icon id to its hosted PNG. Unknown ids fall back to the default icon. */
export function emailIconUrl(id: string | undefined | null): string {
  const key = isEmailIcon(id) ? id : DEFAULT_EMAIL_ICON;
  return `${EMAIL_ASSET_BASE}/icon-${key}.png`;
}
