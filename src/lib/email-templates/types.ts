export type EmailTemplateCategoryId =
  | "security"
  | "legal"
  | "ops"
  | "product"
  | "billing"
  | "trust"
  | "community";

export interface EmailTemplate {
  /** Unique slug, such as "sec-breach-critical". */
  id: string;
  title: string;
  category: EmailTemplateCategoryId;
  /** Professional subject line. May contain placeholders. */
  subject: string;
  tags: string[];
  /** Header badge emoji. */
  emoji: string;
  /** Plain-text body. Blank lines separate paragraphs. Uses {{placeholders}}. */
  body: string;
  ctaText?: string;
  /** May be a placeholder such as {{action_url}}. */
  ctaUrl?: string;
}

export const EMAIL_TEMPLATE_CATEGORIES: { id: EmailTemplateCategoryId; label: string; description: string }[] = [
  { id: "security", label: "Security & Incidents", description: "Breaches, credential resets, lockdowns and advisories." },
  { id: "legal", label: "Legal & Policy", description: "Terms, privacy, DPA, AI usage rights and disclosures." },
  { id: "ops", label: "Outages & Ops", description: "Maintenance windows, incidents, degradations and deprecations." },
  { id: "product", label: "Product & Models", description: "Model releases, features and platform launches." },
  { id: "billing", label: "Billing & Quotas", description: "Quotas, invoices, renewals and account lifecycle." },
  { id: "trust", label: "Trust & Safety", description: "Suspensions, strikes, appeals and safety policy." },
  { id: "community", label: "Community & Roadmap", description: "Letters, surveys, interviews, beta calls and spotlights." },
];
