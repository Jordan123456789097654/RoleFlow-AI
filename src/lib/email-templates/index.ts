import type { EmailTemplate, EmailTemplateCategoryId } from "./types";
import { EMAIL_TEMPLATE_CATEGORIES } from "./types";
import { SECURITY_TEMPLATES } from "./security";
import { LEGAL_TEMPLATES } from "./legal";
import { OPS_TEMPLATES } from "./ops";
import { PRODUCT_TEMPLATES } from "./product";
import { BILLING_TEMPLATES } from "./billing";
import { TRUST_TEMPLATES } from "./trust";
import { COMMUNITY_TEMPLATES } from "./community";

export type { EmailTemplate, EmailTemplateCategoryId } from "./types";
export { EMAIL_TEMPLATE_CATEGORIES } from "./types";

/** The curated library of 100 templates, in category order. */
export const EMAIL_TEMPLATES: EmailTemplate[] = [
  ...SECURITY_TEMPLATES,
  ...LEGAL_TEMPLATES,
  ...OPS_TEMPLATES,
  ...PRODUCT_TEMPLATES,
  ...BILLING_TEMPLATES,
  ...TRUST_TEMPLATES,
  ...COMMUNITY_TEMPLATES,
];

const BY_ID = new Map(EMAIL_TEMPLATES.map((t) => [t.id, t]));

export function getEmailTemplate(id: string): EmailTemplate | undefined {
  return BY_ID.get(id);
}

/**
 * Case-insensitive search across title, subject, tags and body. Every word in the query must
 * match somewhere. An optional category narrows the results.
 */
export function searchEmailTemplates(query: string, category?: EmailTemplateCategoryId | "all"): EmailTemplate[] {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  return EMAIL_TEMPLATES.filter((t) => {
    if (category && category !== "all" && t.category !== category) return false;
    if (words.length === 0) return true;
    const haystack = `${t.title} ${t.subject} ${t.tags.join(" ")} ${t.body}`.toLowerCase();
    return words.every((w) => haystack.includes(w));
  });
}

export function getCategoryLabel(id: EmailTemplateCategoryId): string {
  return EMAIL_TEMPLATE_CATEGORIES.find((c) => c.id === id)?.label ?? id;
}
