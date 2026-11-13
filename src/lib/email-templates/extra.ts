import type { EmailTemplate } from "./types";

/**
 * Templates added in v7. Every fact that can change (dates, amounts, reference numbers, counts,
 * regulators, vendors) is a {{placeholder}} or a plain request for the admin to confirm it, so an
 * admin cannot send an unverified claim by accident.
 */
export const EXTRA_TEMPLATES: EmailTemplate[] = [
  // ---------- Security (8) ----------
  {
    id: "sec-login-new-device",
    title: "New sign-in from a new device",
    category: "security",
    subject: "New sign-in to your RoleFlow account",
    tags: ["sign-in", "device", "account", "security"],
    icon: "lock",
    body: `Hi {{name}},

We noticed a sign-in to your RoleFlow account ({{email}}) on {{date}} from a device or browser we have not seen before.

If this was you, no action is needed. If it was not, change your password and sign out of all sessions from your account settings.`,
    ctaText: "Review your sessions",
    ctaUrl: "{{action_url}}",
  },
  {
    id: "sec-password-changed",
    title: "Password changed confirmation",
    category: "security",
    subject: "Your RoleFlow password was changed",
    tags: ["password", "account", "security", "confirmation"],
    icon: "key",
    body: `Hi {{name}},

The password for your RoleFlow account ({{email}}) was changed on {{date}}.

If you made this change, you do not need to do anything else. If you did not, reset your password now and contact support so we can review recent activity on the account.`,
    ctaText: "Secure my account",
    ctaUrl: "{{action_url}}",
  },
  {
    id: "sec-2fa-enabled",
    title: "Two-step verification turned on",
    category: "security",
    subject: "Two-step verification is now on for your account",
    tags: ["mfa", "two-step", "account", "security"],
    icon: "shield",
    body: `Hi {{name}},

Two-step verification is now on for your RoleFlow account. Each sign-in will ask for a second code, which protects your account if someone learns your password.

Keep your recovery codes somewhere safe. If you did not turn this on, contact support immediately.`,
  },
  {
    id: "sec-api-key-exposed",
    title: "API key may be exposed",
    category: "security",
    subject: "Action needed: revoke a RoleFlow API key that may be exposed",
    tags: ["api key", "exposure", "credentials", "security"],
    icon: "key",
    body: `Hi {{name}},

We believe an API key from your RoleFlow account may have been exposed, for example in a public repository, a shared log, or a screenshot. Reference: {{incident_id}}.

Please revoke the key now and create a new one. Then check your usage history for requests you do not recognize. Keys are shown only once, so store the new key in a secret manager, not in source code.`,
    ctaText: "Manage API keys",
    ctaUrl: "{{app_url}}/docs/api-keys",
  },
  {
    id: "sec-phishing-warning",
    title: "Phishing warning to users",
    category: "security",
    subject: "Phishing warning: fake RoleFlow emails are in circulation",
    tags: ["phishing", "scam", "warning", "security"],
    icon: "alert",
    body: `Hi {{name}},

We have seen emails that imitate RoleFlow. They ask you to sign in, verify your account, or confirm a payment through a link that does not lead to roleflow.site.

RoleFlow will never ask for your password by email, and we will never ask you to send us a one-time code. If you clicked a link and entered details, change your password and contact support.`,
    ctaText: "Read our security guidance",
    ctaUrl: "{{app_url}}",
  },
  {
    id: "sec-vuln-fixed",
    title: "Security fix deployed",
    category: "security",
    subject: "We fixed a security issue in RoleFlow",
    tags: ["vulnerability", "patch", "fix", "security"],
    icon: "shield",
    body: `Hi {{name}},

On {{date}} we fixed a security issue in RoleFlow. Our review found {{finding_summary}}.

We have no evidence that customer data was accessed. No action is needed from you. Thank you to the researchers and team members who reported and fixed it.`,
  },
  {
    id: "sec-account-locked",
    title: "Account locked after failed attempts",
    category: "security",
    subject: "Your RoleFlow account is temporarily locked",
    tags: ["lockout", "sign-in", "account", "security"],
    icon: "lock",
    body: `Hi {{name}},

Your RoleFlow account ({{email}}) was locked after several failed sign-in attempts. It will unlock automatically after {{lock_duration}}. You can also reset your password now.

If you did not try to sign in, someone else may know your email address. Reset your password and turn on two-step verification.`,
    ctaText: "Reset password",
    ctaUrl: "{{action_url}}",
  },
  {
    id: "sec-device-removed",
    title: "Session removed by you or an admin",
    category: "security",
    subject: "A device was signed out of your RoleFlow account",
    tags: ["session", "sign-out", "device", "account"],
    icon: "signin",
    body: `Hi {{name}},

A device was signed out of your RoleFlow account on {{date}}. The sign-out was made by {{actor}}.

If you do not recognize this action, change your password and review your recent activity.`,
  },

  // ---------- Legal (5) ----------
  {
    id: "legal-dpa-available",
    title: "Data processing agreement available",
    category: "legal",
    subject: "Our Data Processing Agreement is now available",
    tags: ["dpa", "gdpr", "data processing", "legal"],
    icon: "scale",
    body: `Hi {{name}},

Our Data Processing Agreement (DPA) is available for customers who need one for their own compliance. It describes how RoleFlow processes personal data on your behalf, the security measures we use, and how sub-processors are managed.

If you need a signed copy, reply to this email with your legal entity name and the name of your signatory.`,
    ctaText: "Read the DPA",
    ctaUrl: "{{app_url}}/privacy",
  },
  {
    id: "legal-subprocessors-update",
    title: "Sub-processor list updated",
    category: "legal",
    subject: "Update to our list of sub-processors",
    tags: ["sub-processor", "vendors", "data", "legal"],
    icon: "document",
    body: `Hi {{name}},

Effective {{effective_date}}, we are updating our list of sub-processors: {{change_summary}}.

You can read the full list in our privacy policy. If you object to a change, contact us before the effective date so we can talk through the options.`,
    ctaText: "View the privacy policy",
    ctaUrl: "{{app_url}}/privacy",
  },
  {
    id: "legal-terms-update",
    title: "Terms of Service update",
    category: "legal",
    subject: "Updates to the RoleFlow Terms of Service",
    tags: ["terms", "update", "contract", "legal"],
    icon: "scale",
    body: `Hi {{name}},

We are updating the RoleFlow Terms of Service. The main changes are: {{change_summary}}.

The updated terms take effect on {{effective_date}}. Your continued use of RoleFlow after that date means you accept them. If you do not agree, you can stop using the service and export your data before the effective date.`,
    ctaText: "Read the updated terms",
    ctaUrl: "{{app_url}}/terms",
  },
  {
    id: "legal-data-export-ready",
    title: "Your data export is ready",
    category: "legal",
    subject: "Your RoleFlow data export is ready",
    tags: ["export", "data", "privacy", "request"],
    icon: "document",
    body: `Hi {{name}},

Your data export is ready. It contains the information we hold for your account as of {{date}}.

For security, the download link expires after {{link_expiry}}. If you did not request this export, contact us immediately.`,
    ctaText: "Download my data",
    ctaUrl: "{{action_url}}",
  },
  {
    id: "legal-deletion-complete",
    title: "Account deletion confirmed",
    category: "legal",
    subject: "Your RoleFlow account has been deleted",
    tags: ["deletion", "account", "privacy", "request"],
    icon: "check",
    body: `Hi {{name}},

We have deleted your RoleFlow account ({{email}}) as you requested on {{date}}. Your chats, memories and uploaded files were removed from our active systems.

Some records may remain in encrypted backups for up to {{backup_retention}} and in records we must keep by law. Those records are not used for any other purpose.`,
  },

  // ---------- Ops (8) ----------
  {
    id: "ops-maintenance-tonight",
    title: "Scheduled maintenance tonight",
    category: "ops",
    subject: "Scheduled maintenance on {{date}}: RoleFlow may be briefly unavailable",
    tags: ["maintenance", "downtime", "schedule", "ops"],
    icon: "wrench",
    body: `Hi {{name}},

We will perform scheduled maintenance on {{date}} from {{start_time}} to {{end_time}} (UTC). During this window, chat and API requests may fail or be slow.

Your conversations will not be deleted. Live status updates will be posted at {{status_url}}.`,
    ctaText: "View status page",
    ctaUrl: "{{status_url}}",
  },
  {
    id: "ops-maintenance-done",
    title: "Maintenance completed",
    category: "ops",
    subject: "Maintenance is complete. RoleFlow is fully available.",
    tags: ["maintenance", "complete", "ops", "status"],
    icon: "check",
    body: `Hi {{name}},

The scheduled maintenance is complete and all services are available. {{summary}}

Thank you for your patience. If you still see errors, sign out, sign back in, and contact support if the problem continues.`,
    ctaText: "Open RoleFlow",
    ctaUrl: "{{app_url}}",
  },
  {
    id: "ops-model-degraded",
    title: "Model performance is degraded",
    category: "ops",
    subject: "Degraded performance on {{model_name}}",
    tags: ["degraded", "latency", "model", "ops"],
    icon: "alert",
    body: `Hi {{name}},

We are seeing slower responses and occasional errors on {{model_name}}, starting at {{start_time}}. Our team is working on it. Other RoleFlow models are not affected.

If you need a reliable response now, try another model in the model selector. We will post an update when the issue is resolved.`,
    ctaText: "View live status",
    ctaUrl: "{{status_url}}",
  },
  {
    id: "ops-incident-resolved",
    title: "Incident resolved",
    category: "ops",
    subject: "Resolved: {{incident_title}} ({{incident_id}})",
    tags: ["incident", "resolved", "ops", "status"],
    icon: "check",
    body: `Hi {{name}},

The incident {{incident_id}} has been resolved. Service was affected from {{start_time}} to {{end_time}}.

Cause: {{root_cause}}.
Fix: {{fix_summary}}.

We will publish a full written review within {{review_window}}.`,
    ctaText: "Read the status history",
    ctaUrl: "{{status_url}}",
  },
  {
    id: "ops-api-deprecation-v2",
    title: "API deprecation notice",
    category: "ops",
    subject: "Deprecation notice: {{feature}} will change on {{date}}",
    tags: ["api", "deprecation", "migration", "ops"],
    icon: "bolt",
    body: `Hi {{name}},

On {{date}}, {{feature}} will be retired. After that date, requests that use it will return an error.

What to change: {{migration_steps}}.

If this affects your integration and you need more time, reply to this email before {{date}}.`,
    ctaText: "Read the migration guide",
    ctaUrl: "{{app_url}}/docs/api-keys",
  },
  {
    id: "ops-rate-limit-change",
    title: "Rate limit change",
    category: "ops",
    subject: "Changes to RoleFlow rate limits from {{date}}",
    tags: ["rate limit", "quota", "api", "ops"],
    icon: "chart",
    body: `Hi {{name}},

From {{date}}, the rate limits for {{plan_or_tier}} will change: {{limit_summary}}.

Requests above the limit receive a 429 response with a retry time. Most applications need no change. If you expect a spike in traffic, contact us before then.`,
  },
  {
    id: "ops-region-expansion",
    title: "New region available",
    category: "ops",
    subject: "RoleFlow is now available in {{region}}",
    tags: ["region", "availability", "launch", "ops"],
    icon: "globe",
    body: `Hi {{name}},

RoleFlow is now available in {{region}}. Requests from that region will be served locally, which may reduce latency.

No change is needed on your side. Your data location settings are shown in your account privacy page.`,
    ctaText: "Learn more",
    ctaUrl: "{{app_url}}",
  },
  {
    id: "ops-postmortem",
    title: "Post-incident review",
    category: "ops",
    subject: "Post-incident review: {{incident_title}}",
    tags: ["postmortem", "review", "incident", "ops"],
    icon: "document",
    body: `Hi {{name}},

Here is our review of the incident on {{date}} that affected {{affected_area}}.

What happened: {{timeline_summary}}.
Impact: {{impact_summary}}.
What we are changing: {{action_items}}.

We are sorry for the disruption. Please reply if you have questions about any part of this review.`,
    ctaText: "Read the full review",
    ctaUrl: "{{action_url}}",
  },

  // ---------- Product (8) ----------
  {
    id: "prod-model-launch",
    title: "New model launch",
    category: "product",
    subject: "Introducing {{model_name}}",
    tags: ["launch", "model", "release", "product"],
    icon: "sparkle",
    body: `Hi {{name}},

{{model_name}} is now available in RoleFlow. {{summary_of_strengths}}.

Choose it from the model selector in any chat. It works with the effort settings you already use.`,
    ctaText: "Try it now",
    ctaUrl: "{{app_url}}/chat",
  },
  {
    id: "prod-feature-launch",
    title: "New feature available",
    category: "product",
    subject: "New in RoleFlow: {{feature}}",
    tags: ["feature", "launch", "product", "release"],
    icon: "sparkle",
    body: `Hi {{name}},

We have added {{feature}} to RoleFlow. It lets you {{feature_benefit}}.

You can turn it on from {{where_to_find}}. Let us know what you think by replying to this email.`,
    ctaText: "Try it",
    ctaUrl: "{{app_url}}/chat",
  },
  {
    id: "prod-beta-invite",
    title: "Invitation to a private beta",
    category: "product",
    subject: "You are invited to the {{feature}} beta",
    tags: ["beta", "invite", "early access", "product"],
    icon: "sparkle",
    body: `Hi {{name}},

You have been invited to try {{feature}} before everyone else. The beta is {{beta_scope}}, and we expect it to change based on feedback.

Accept the invitation to get access. Please report bugs through the feedback option in the app.`,
    ctaText: "Accept invitation",
    ctaUrl: "{{action_url}}",
  },
  {
    id: "prod-deprecate-feature",
    title: "Feature being removed",
    category: "product",
    subject: "{{feature}} is being removed on {{date}}",
    tags: ["removal", "deprecation", "product", "change"],
    icon: "wrench",
    body: `Hi {{name}},

We are removing {{feature}} from RoleFlow on {{date}}. The main reason is {{reason}}.

Your data is kept, but it will no longer be visible in the app after that date. Export anything you need from {{where_to_export}} before then.`,
  },
  {
    id: "prod-survey-request",
    title: "Quick survey request",
    category: "product",
    subject: "Two minutes to shape RoleFlow",
    tags: ["survey", "feedback", "research", "product"],
    icon: "chart",
    body: `Hi {{name}},

We are building the next version of RoleFlow and want to hear from people who use it every week. The survey takes about two minutes and helps us decide what to work on next.

Your answers are confidential and will be used only to improve the product.`,
    ctaText: "Take the survey",
    ctaUrl: "{{action_url}}",
  },
  {
    id: "prod-usage-tips",
    title: "Get more from RoleFlow",
    category: "product",
    subject: "Three ways to get better answers from RoleFlow",
    tags: ["tips", "onboarding", "product", "guide"],
    icon: "sparkle",
    body: `Hi {{name}},

Here are three things that help RoleFlow give better answers:

- Share the context: say what you are building and what you have already tried.
- Pick the right model: use Flash for quick questions and Apex for hard proofs or reviews.
- Attach the files: upload the document or code so the answer is based on your real material.`,
    ctaText: "Open RoleFlow",
    ctaUrl: "{{app_url}}/chat",
  },
  {
    id: "prod-project-shared",
    title: "A project was shared with you",
    category: "product",
    subject: "{{sharer_name}} shared a RoleFlow project with you",
    tags: ["share", "project", "collaboration", "product"],
    icon: "users",
    body: `Hi {{name}},

{{sharer_name}} shared the project "{{project_name}}" with you on RoleFlow. You can read its chats and use its instructions.

Sign in with {{email}} to open it.`,
    ctaText: "Open project",
    ctaUrl: "{{action_url}}",
  },
  {
    id: "prod-changelog",
    title: "Monthly changelog",
    category: "product",
    subject: "What changed in RoleFlow this month",
    tags: ["changelog", "release notes", "product", "update"],
    icon: "document",
    body: `Hi {{name}},

Here is what changed in RoleFlow this month:

- {{change_one}}
- {{change_two}}
- {{change_three}}

Full notes are in the changelog. Thank you for building with us.`,
    ctaText: "Read the changelog",
    ctaUrl: "{{action_url}}",
  },

  // ---------- Billing (7) ----------
  {
    id: "bill-payment-failed",
    title: "Payment failed",
    category: "billing",
    subject: "We could not process your RoleFlow payment",
    tags: ["payment", "failed", "billing", "renewal"],
    icon: "card",
    body: `Hi {{name}},

We could not process the payment of {{amount}} for your RoleFlow {{plan_name}} plan. Your plan stays active until {{grace_end_date}}.

Please update your payment method before then. Your card issuer may have declined the charge, and a new card usually fixes it.`,
    ctaText: "Update payment method",
    ctaUrl: "{{action_url}}",
  },
  {
    id: "bill-invoice-ready",
    title: "Invoice ready",
    category: "billing",
    subject: "Your RoleFlow invoice {{invoice_number}} is ready",
    tags: ["invoice", "receipt", "billing"],
    icon: "card",
    body: `Hi {{name}},

Your invoice {{invoice_number}} for {{amount}} is ready. It covers the period {{period}}.

You can download a PDF from your billing page at any time.`,
    ctaText: "View invoice",
    ctaUrl: "{{action_url}}",
  },
  {
    id: "bill-trial-ending-v2",
    title: "Trial ends soon",
    category: "billing",
    subject: "Your RoleFlow trial ends on {{date}}",
    tags: ["trial", "renewal", "billing", "conversion"],
    icon: "calendar",
    body: `Hi {{name}},

Your RoleFlow trial ends on {{date}}. After that, your account moves to the free plan, and the features that need a paid plan will pause.

Your chats and projects stay in your account either way.`,
    ctaText: "Choose a plan",
    ctaUrl: "{{action_url}}",
  },
  {
    id: "bill-plan-changed",
    title: "Plan changed",
    category: "billing",
    subject: "Your RoleFlow plan has changed to {{plan_name}}",
    tags: ["plan", "upgrade", "downgrade", "billing"],
    icon: "card",
    body: `Hi {{name}},

Your RoleFlow plan changed to {{plan_name}} on {{date}}. The new price is {{amount}} per {{billing_period}}.

If you did not request this change, contact support right away.`,
    ctaText: "Review my plan",
    ctaUrl: "{{action_url}}",
  },
  {
    id: "bill-refund-issued",
    title: "Refund issued",
    category: "billing",
    subject: "We have issued a refund of {{amount}}",
    tags: ["refund", "billing", "payment"],
    icon: "check",
    body: `Hi {{name}},

We have issued a refund of {{amount}} to your original payment method. Most banks show it within {{refund_timeframe}}.

Reference: {{invoice_number}}.`,
  },
  {
    id: "bill-quota-warning",
    title: "Usage quota almost reached",
    category: "billing",
    subject: "You have used {{percent}} of your RoleFlow quota",
    tags: ["quota", "usage", "limit", "billing"],
    icon: "chart",
    body: `Hi {{name}},

You have used {{percent}} of your monthly quota. It resets on {{reset_date}}.

If you need more capacity before then, you can upgrade your plan. Your existing chats are not affected.`,
    ctaText: "View usage",
    ctaUrl: "{{action_url}}",
  },
  {
    id: "bill-annual-renewal-v2",
    title: "Annual renewal reminder",
    category: "billing",
    subject: "Your RoleFlow subscription renews on {{date}}",
    tags: ["renewal", "annual", "billing", "reminder"],
    icon: "calendar",
    body: `Hi {{name}},

Your annual RoleFlow subscription renews on {{date}} for {{amount}}. If you want to change or cancel before then, you can do so from your billing page.

No action is needed if you want to keep your plan.`,
    ctaText: "Manage subscription",
    ctaUrl: "{{action_url}}",
  },

  // ---------- Trust & Safety (6) ----------
  {
    id: "trust-content-removed-v2",
    title: "Content removed under policy",
    category: "trust",
    subject: "A conversation on your account was removed",
    tags: ["moderation", "removed", "policy", "trust"],
    icon: "ban",
    body: `Hi {{name}},

We removed a conversation on your RoleFlow account on {{date}} because it did not meet our Acceptable Use Policy: {{policy_section}}.

You can read the policy and request a review by replying to this email, within {{appeal_window}}.`,
    ctaText: "Read the policy",
    ctaUrl: "{{app_url}}/acceptable-use",
  },
  {
    id: "trust-warning-issued",
    title: "Formal warning",
    category: "trust",
    subject: "Warning about your RoleFlow account",
    tags: ["warning", "policy", "strike", "trust"],
    icon: "alert",
    body: `Hi {{name}},

Your RoleFlow account received a warning on {{date}} for {{violation_summary}}.

No further action is taken on this warning. Repeated violations may lead to restrictions. You can read the policy and appeal this decision within {{appeal_window}}.`,
    ctaText: "Review policy and appeal",
    ctaUrl: "{{action_url}}",
  },
  {
    id: "trust-appeal-received-v2",
    title: "Appeal received",
    category: "trust",
    subject: "We received your appeal ({{incident_id}})",
    tags: ["appeal", "review", "trust", "moderation"],
    icon: "check",
    body: `Hi {{name}},

We received your appeal on {{date}}. Reference: {{incident_id}}. A team member who did not make the original decision will review it.

Most appeals are answered within {{review_time}}. You do not need to send anything else.`,
  },
  {
    id: "trust-appeal-decision",
    title: "Appeal decision",
    category: "trust",
    subject: "Decision on your appeal ({{incident_id}})",
    tags: ["appeal", "decision", "trust", "moderation"],
    icon: "scale",
    body: `Hi {{name}},

We have reviewed your appeal ({{incident_id}}). Our decision: {{decision}}.

Reason: {{reason}}.

This decision is final for this matter.`,
    ctaText: "View account status",
    ctaUrl: "{{action_url}}",
  },
  {
    id: "trust-restriction-lifted",
    title: "Restriction lifted",
    category: "trust",
    subject: "Your RoleFlow account is fully restored",
    tags: ["restriction", "restored", "account", "trust"],
    icon: "check",
    body: `Hi {{name}},

The restriction on your RoleFlow account has been lifted, effective {{date}}. You can use every feature again.

Thank you for your patience while we reviewed the matter. Please keep following the Acceptable Use Policy.`,
    ctaText: "Open RoleFlow",
    ctaUrl: "{{app_url}}/chat",
  },
  {
    id: "trust-abuse-report-thanks",
    title: "Thanks for reporting abuse",
    category: "trust",
    subject: "Thank you for reporting this to RoleFlow",
    tags: ["report", "abuse", "safety", "trust"],
    icon: "shield",
    body: `Hi {{name}},

Thank you for your report, reference {{incident_id}}. Our trust and safety team is reviewing it now.

We will contact you only if we need more information. If anyone is in immediate danger, contact local emergency services first.`,
  },

  // ---------- Community (8) ----------
  {
    id: "com-beta-call",
    title: "Invitation to a user interview",
    category: "community",
    subject: "Would you join a 30-minute call about RoleFlow?",
    tags: ["interview", "research", "community", "feedback"],
    icon: "users",
    body: `Hi {{name}},

We are talking with people who use RoleFlow every week. Would you join a 30-minute call on {{proposed_dates}} to share how you use it?

We will send a small thank-you gift card for your time. Reply with a time that suits you.`,
    ctaText: "Pick a time",
    ctaUrl: "{{action_url}}",
  },
  {
    id: "com-spotlight",
    title: "Customer spotlight request",
    category: "community",
    subject: "Would you let us share your story?",
    tags: ["spotlight", "case study", "community", "marketing"],
    icon: "users",
    body: `Hi {{name}},

Your work with RoleFlow has been impressive. We would like to feature how your team uses it in a short story on our site.

We will only publish what you approve, and you can withdraw permission at any time. Reply if you are interested.`,
  },
  {
    id: "com-community-event",
    title: "Community event",
    category: "community",
    subject: "Join us: {{event_name}} on {{date}}",
    tags: ["event", "community", "webinar", "invite"],
    icon: "calendar",
    body: `Hi {{name}},

You are invited to {{event_name}} on {{date}} at {{start_time}} (UTC). The session covers {{event_topic}}.

Attendance is free. Questions can be sent in advance by replying to this email.`,
    ctaText: "Register",
    ctaUrl: "{{action_url}}",
  },
  {
    id: "com-thank-you",
    title: "Thank you for your feedback",
    category: "community",
    subject: "Thank you for your feedback",
    tags: ["feedback", "thanks", "community"],
    icon: "users",
    body: `Hi {{name}},

Thank you for taking the time to share your feedback. We read every response, and it has already shaped {{outcome}}.

We will let you know if we make the change you suggested.`,
  },
  {
    id: "com-open-source-call",
    title: "Developer office hours",
    category: "community",
    subject: "RoleFlow developer office hours on {{date}}",
    tags: ["developers", "office hours", "community", "api"],
    icon: "users",
    body: `Hi {{name}},

We are holding open office hours for developers building on the RoleFlow API. Bring questions about integrations, rate limits, or anything in the documentation.

Time: {{start_time}} (UTC), {{date}}.`,
    ctaText: "Join office hours",
    ctaUrl: "{{action_url}}",
  },
  {
    id: "com-roadmap-update",
    title: "Roadmap update",
    category: "community",
    subject: "What we are working on next",
    tags: ["roadmap", "update", "community", "plans"],
    icon: "sparkle",
    body: `Hi {{name}},

Here is what we are working on next. Dates are estimates and may change.

- {{item_one}}
- {{item_two}}
- {{item_three}}

Your feedback decides the order. Reply to tell us what matters most to you.`,
    ctaText: "Share feedback",
    ctaUrl: "{{action_url}}",
  },
  {
    id: "com-holiday-greeting",
    title: "Holiday message",
    category: "community",
    subject: "Happy holidays from the RoleFlow team",
    tags: ["holiday", "greeting", "community"],
    icon: "sparkle",
    body: `Hi {{name}},

Thank you for building with RoleFlow this year. Our office will be closed from {{closure_start}} to {{closure_end}}, and support replies will resume on {{resume_date}}.

Wishing you a restful break.`,
  },
  {
    id: "com-newsletter",
    title: "Monthly newsletter",
    category: "community",
    subject: "RoleFlow monthly: {{headline}}",
    tags: ["newsletter", "monthly", "community", "update"],
    icon: "mail",
    body: `Hi {{name}},

This month: {{headline}}.

Also in this issue:
- {{story_one}}
- {{story_two}}

You are receiving this because you chose to follow RoleFlow news. You can unsubscribe from the link in the footer.`,
    ctaText: "Read the newsletter",
    ctaUrl: "{{action_url}}",
  },
];
