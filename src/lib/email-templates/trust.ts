import type { EmailTemplate } from "./types";

/** Trust, Safety & Moderation (10 templates) */
export const TRUST_TEMPLATES: EmailTemplate[] = [
  {
    id: "trust-suspended-terms",
    title: "Account suspended for terms violation",
    category: "trust",
    subject: "Your RoleFlow account has been suspended",
    tags: ["suspension", "terms", "violation", "account", "moderation"],
    emoji: "🚫",
    body: `Hi {{name}},

On {{date}}, we suspended your RoleFlow account ({{email}}) because activity on it violated our Acceptable Use Policy. Reference: {{incident_id}}.

While the suspension is in place, you cannot sign in or use the service. Your data is preserved while we review the matter.

If you believe this decision is wrong, you can submit an appeal from the moderation page within 30 days. Please include any context that helps us review the activity.`,
    ctaText: "Submit an appeal",
    ctaUrl: "{{action_url}}",
  },
  {
    id: "trust-tier2-strike",
    title: "Formal Tier 2 strike warning",
    category: "trust",
    subject: "Formal warning: Tier 2 policy strike on your account",
    tags: ["strike", "tier 2", "warning", "policy", "moderation"],
    emoji: "⚠️",
    body: `Hi {{name}},

Our review found that content submitted from your account on {{date}} violated our Acceptable Use Policy at the Tier 2 level. We have recorded a formal strike against your account. Reference: {{incident_id}}.

A Tier 2 strike is a formal warning. Repeated or serious violations may lead to limits on your account, suspension or termination. Strikes are reviewed over time, and you can ask us about the status of your strikes at any time.

Please review the Acceptable Use Policy and make sure your future use follows it. Thank you for helping keep RoleFlow safe for everyone.`,
    ctaText: "Read the Acceptable Use Policy",
    ctaUrl: "https://roleflow.site/acceptable-use",
  },
  {
    id: "trust-strike-status",
    title: "Strike status clarification",
    category: "trust",
    subject: "Clarification about the strikes on your account",
    tags: ["strike", "status", "clarification", "moderation"],
    emoji: "📋",
    body: `Hi {{name}},

You asked about the status of the strikes on your RoleFlow account. As of {{date}}, your account has the following status: strikes are active and count toward future reviews, unless they have expired under our moderation policy.

Each strike is tied to a specific review record. If you want to understand which content led to a strike, reply to this email with your reference, and we will share the relevant details that we are permitted to share.

Strikes do not expire on a fixed schedule for serious violations, but they are reviewed each time a new review is opened.`,
    ctaText: "View my moderation record",
    ctaUrl: "{{action_url}}",
  },
  {
    id: "trust-appeal-received",
    title: "Appeal received",
    category: "trust",
    subject: "We have received your appeal",
    tags: ["appeal", "received", "moderation", "review"],
    emoji: "📥",
    body: `Hi {{name}},

Thank you for submitting an appeal on {{date}}. We have received it, and it is now in the review queue. Reference: {{incident_id}}.

A reviewer who did not make the original decision will look at your appeal. We aim to respond within five business days. You do not need to send anything else unless we ask you for more information.`,
  },
  {
    id: "trust-appeal-approved",
    title: "Appeal approved",
    category: "trust",
    subject: "Your appeal was approved",
    tags: ["appeal", "approved", "reinstatement", "moderation"],
    emoji: "✅",
    body: `Hi {{name}},

We have reviewed your appeal (reference {{incident_id}}) and approved it. The decision was updated on {{date}}, and the related restriction has been lifted.

Your account is active again, and your data was preserved throughout. We also removed the related strike from your record.

Thank you for taking the time to write to us. We appreciate your patience during the review.`,
    ctaText: "Sign in",
    ctaUrl: "{{app_url}}",
  },
  {
    id: "trust-appeal-denied",
    title: "Appeal denied",
    category: "trust",
    subject: "Our decision on your appeal",
    tags: ["appeal", "denied", "decision", "moderation"],
    emoji: "📄",
    body: `Hi {{name}},

We have completed our review of your appeal (reference {{incident_id}}). After careful consideration, we have decided to uphold the original decision made on {{date}}.

The review found that the content in question violated our Acceptable Use Policy. We recognize this is not the outcome you were hoping for. You can reply to this email with any new information that was not available during the review, and we will consider it.

Thank you for engaging with our process.`,
    ctaText: "Read the Moderation and Appeals Policy",
    ctaUrl: "https://roleflow.site/moderation",
  },
  {
    id: "trust-child-safety-zero-tolerance",
    title: "Child safety zero-tolerance policy",
    category: "trust",
    subject: "RoleFlow's zero-tolerance policy on child sexual abuse material",
    tags: ["child safety", "csam", "zero tolerance", "policy", "reporting"],
    emoji: "🛑",
    body: `Hi {{name}},

RoleFlow has a zero-tolerance policy for child sexual abuse material and for any content that sexualizes minors. Any such content is blocked, reported where required by law, and results in immediate termination of the account involved.

We reviewed the activity linked to reference {{incident_id}} on {{date}}, and we took the actions required by this policy.

If you encounter content that concerns the safety of a child, report it to us right away at legal@roleflow.site, and to the appropriate authorities in your country. In the United States, you can report to the NCMEC CyberTipline.`,
    ctaText: "Read the Acceptable Use Policy",
    ctaUrl: "https://roleflow.site/acceptable-use",
  },
  {
    id: "trust-content-removed",
    title: "Content removed notice",
    category: "trust",
    subject: "A shared conversation was removed",
    tags: ["content", "removed", "shared link", "moderation"],
    emoji: "🧹",
    body: `Hi {{name}},

On {{date}}, we removed a conversation you shared through a RoleFlow link because it violated our Acceptable Use Policy. Reference: {{incident_id}}.

Your other chats were not affected. The shared link no longer works, and the content has been removed from public access.

If you think we made a mistake, you can reply to this email to request a review.`,
  },
  {
    id: "trust-community-guidelines-reminder",
    title: "Community guidelines reminder",
    category: "trust",
    subject: "A friendly reminder about our community guidelines",
    tags: ["guidelines", "reminder", "community", "conduct"],
    emoji: "🤝",
    body: `Hi {{name}},

We want RoleFlow to be a useful and respectful place for everyone. This is a friendly reminder of the guidelines that apply to all accounts:

- Do not use RoleFlow to harass, threaten or target other people.
- Do not share credentials or let other people use your account.
- Do not try to bypass usage limits or security controls.
- Do not generate content that is illegal or sexualizes minors.

No action is needed. We send reminders like this to help everyone stay on the right side of these rules.`,
    ctaText: "Read the Acceptable Use Policy",
    ctaUrl: "https://roleflow.site/acceptable-use",
  },
  {
    id: "trust-ban-lifted",
    title: "Account reinstated after review",
    category: "trust",
    subject: "Your RoleFlow account has been reinstated",
    tags: ["reinstatement", "ban lifted", "account", "restored"],
    emoji: "🔓",
    body: `Hi {{name}},

We have completed the review of your RoleFlow account and have lifted the restriction placed on it. Your account is active again as of {{date}}.

Please keep in mind the Acceptable Use Policy going forward. Repeated violations will lead to stronger action.`,
    ctaText: "Sign in",
    ctaUrl: "{{app_url}}",
  },
];
