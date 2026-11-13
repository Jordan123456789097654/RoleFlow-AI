export type EmailTemplateCategoryId =
  | "security"
  | "legal"
  | "ops"
  | "product"
  | "billing"
  | "trust"
  | "community"
  | "custom";

export interface EmailTemplate {
  /** Unique slug, such as "sec-breach-critical". Custom templates use "custom-<id>". */
  id: string;
  title: string;
  category: EmailTemplateCategoryId;
  /** Professional subject line. May contain placeholders. */
  subject: string;
  tags: string[];
  /** Vector icon id from src/lib/email-icons.ts, such as "shield". */
  icon: string;
  /** Plain-text body. Blank lines separate paragraphs. Uses {{placeholders}}. */
  body: string;
  ctaText?: string;
  /** May be a placeholder such as {{action_url}}. */
  ctaUrl?: string;
  /** True for templates an admin saved from the composer. */
  custom?: boolean;
}

export const EMAIL_TEMPLATE_CATEGORIES: { id: EmailTemplateCategoryId; label: string; description: string }[] = [
  { id: "security", label: "Security & Incidents", description: "Breaches, credential resets, lockdowns and advisories." },
  { id: "legal", label: "Legal & Policy", description: "Terms, privacy, DPA, AI usage rights and disclosures." },
  { id: "ops", label: "Outages & Ops", description: "Maintenance windows, incidents, degradations and deprecations." },
  { id: "product", label: "Product & Models", description: "Model releases, features and platform launches." },
  { id: "billing", label: "Billing & Quotas", description: "Quotas, invoices, renewals and account lifecycle." },
  { id: "trust", label: "Trust & Safety", description: "Suspensions, strikes, appeals and safety policy." },
  { id: "community", label: "Community & Roadmap", description: "Letters, surveys, interviews, beta calls and spotlights." },
  { id: "custom", label: "Your templates", description: "Templates saved from the composer." },
];
