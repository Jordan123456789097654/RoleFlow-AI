import type { EmailTemplate } from "./types";

/** Billing, Quotas & Lifecycle (15 templates) */
export const BILLING_TEMPLATES: EmailTemplate[] = [
  {
    id: "bill-quota-80",
    title: "Daily quota 80% warning",
    category: "billing",
    subject: "You have used 80% of your daily RoleFlow quota",
    tags: ["quota", "limit", "warning", "80%", "usage"],
    icon: "chart",
    body: `Hi {{name}},

You have used about 80% of your daily message quota on RoleFlow. Your quota resets at midnight UTC.

If you are close to the limit, you can plan your remaining messages for the day, switch to a faster model for quick questions, or upgrade for a higher daily allowance.

No action is required right now.`,
    ctaText: "View usage",
    ctaUrl: "{{action_url}}",
  },
  {
    id: "bill-quota-100",
    title: "Daily quota exhausted",
    category: "billing",
    subject: "You have reached your daily RoleFlow quota",
    tags: ["quota", "exhausted", "limit", "100%", "reset"],
    icon: "alert",
    body: `Hi {{name}},

You have used your full daily message quota on RoleFlow. You can continue again when your quota resets at midnight UTC.

Your chats and saved settings are safe. If you need more capacity today, you can upgrade your plan at any time, and the higher allowance applies immediately.`,
    ctaText: "See plan options",
    ctaUrl: "{{action_url}}",
  },
  {
    id: "bill-upgrade-confirm",
    title: "Subscription upgrade confirmation",
    category: "billing",
    subject: "Your RoleFlow upgrade is confirmed",
    tags: ["upgrade", "subscription", "confirmation", "plan"],
    icon: "sparkle",
    body: `Hi {{name}},

Thank you for upgrading your RoleFlow subscription. Your new plan is active as of {{date}}.

Your updated benefits apply immediately, including higher daily limits and access to additional models. You will see the change in your account settings.

Your receipt is available in your billing settings. If anything looks wrong, contact support within 14 days.`,
    ctaText: "View my plan",
    ctaUrl: "{{action_url}}",
  },
  {
    id: "bill-invoice-receipt",
    title: "Invoice and tax receipt",
    category: "billing",
    subject: "Your RoleFlow invoice for {{date}}",
    tags: ["invoice", "receipt", "tax", "billing"],
    icon: "card",
    body: `Hi {{name}},

Your RoleFlow invoice for {{date}} is ready. Your invoice includes the billing period, the plan charged, and any applicable tax, along with your invoice number.

Invoice reference: {{incident_id}}. If your company needs a tax identification number or a VAT number added to future invoices, update your billing details in your account settings.

Keep this email for your records. Reply to this message if you need a corrected invoice.`,
    ctaText: "Download invoice",
    ctaUrl: "{{action_url}}",
  },
  {
    id: "bill-failed-payment-grace",
    title: "Failed payment grace period",
    category: "billing",
    subject: "Action needed: we could not process your RoleFlow payment",
    tags: ["payment", "failed", "grace period", "billing", "dunning"],
    icon: "card",
    body: `Hi {{name}},

We could not process the most recent payment for your RoleFlow subscription on {{date}}. Your account stays active during a grace period of seven days, so nothing is lost.

To avoid interruption, update your payment method or try the payment again. If the payment is not completed by the end of the grace period, your account will move to the Free plan. Your chats and memories will remain available.

If you believe this is an error, contact your bank or card issuer, then reply to this email.`,
    ctaText: "Update payment method",
    ctaUrl: "{{action_url}}",
  },
  {
    id: "bill-trial-ending",
    title: "Trial ending in 48 hours",
    category: "billing",
    subject: "Your RoleFlow trial ends in 48 hours",
    tags: ["trial", "ending", "reminder", "subscription"],
    icon: "calendar",
    body: `Hi {{name}},

Your RoleFlow trial ends in 48 hours, on {{date}}. After that, your account moves to the plan you selected, or to the Free plan if you did not choose one.

If you want to keep the features you have been using, choose a plan before the trial ends. If you are not ready, you do not need to do anything. Your chats and settings remain available on the Free plan.`,
    ctaText: "Choose a plan",
    ctaUrl: "{{action_url}}",
  },
  {
    id: "bill-annual-renewal",
    title: "Upcoming annual renewal",
    category: "billing",
    subject: "Your RoleFlow annual plan renews on {{date}}",
    tags: ["renewal", "annual", "reminder", "subscription"],
    icon: "calendar",
    body: `Hi {{name}},

Your annual RoleFlow plan will renew on {{date}}. The renewal will be charged to the payment method on file, unless you change or cancel your plan before then.

If you want to change plans, do so before the renewal date. Changes take effect at the start of the next billing period. You can cancel at any time, and access continues until the end of the paid period.`,
    ctaText: "Manage my plan",
    ctaUrl: "{{action_url}}",
  },
  {
    id: "bill-inactive-deactivation",
    title: "Inactive account deactivation notice",
    category: "billing",
    subject: "Your inactive RoleFlow account will be closed on {{date}}",
    tags: ["inactive", "deactivation", "closure", "lifecycle"],
    icon: "calendar",
    body: `Hi {{name}},

We have not seen activity on your RoleFlow account ({{email}}) for a long time. To keep our records clean, we will deactivate inactive accounts on {{date}}.

To keep your account, sign in before that date. Signing in is all it takes. If you no longer need the account, you can do nothing. We will delete it after the deactivation period, in line with our data retention policy.

If you have saved content you want to keep, export it before then.`,
    ctaText: "Sign in to keep my account",
    ctaUrl: "{{app_url}}",
  },
  {
    id: "bill-referral-reward",
    title: "Referral reward applied",
    category: "billing",
    subject: "Your referral reward has been applied",
    tags: ["referral", "reward", "credit", "promotion"],
    icon: "sparkle",
    body: `Hi {{name}},

Thank you for referring a friend to RoleFlow. Your referral reward has been applied to your account as of {{date}}, and it will appear on your next invoice.

Rewards apply automatically. Referred accounts must be active and in good standing for the reward to count. You can see all your referrals in your account settings.`,
    ctaText: "View my rewards",
    ctaUrl: "{{action_url}}",
  },
  {
    id: "bill-downgrade-confirm",
    title: "Plan downgrade confirmation",
    category: "billing",
    subject: "Your RoleFlow plan change is scheduled",
    tags: ["downgrade", "plan", "change", "confirmation"],
    icon: "chart",
    body: `Hi {{name}},

We have received your request to change your RoleFlow plan. The change takes effect at the end of your current billing period, on {{date}}. Until then, you keep the features of your current plan.

Your chats, projects and memories remain available after the change. Some features that are specific to the higher plan may no longer be available.`,
    ctaText: "View plan details",
    ctaUrl: "{{action_url}}",
  },
  {
    id: "bill-price-change",
    title: "Price change notice",
    category: "billing",
    subject: "Upcoming price change for your RoleFlow plan",
    tags: ["price", "change", "notice", "billing"],
    icon: "card",
    body: `Hi {{name}},

We are updating the price of your RoleFlow plan. The new price will apply starting {{date}}, at least 30 days from this notice.

You can keep your current price by switching to an annual plan before that date, or you can cancel at any time without penalty. We will remind you again before the change takes effect.

Thank you for being part of RoleFlow. Questions? Reply to this email.`,
    ctaText: "Review my plan",
    ctaUrl: "{{action_url}}",
  },
  {
    id: "bill-card-expiring",
    title: "Payment method expiring",
    category: "billing",
    subject: "Your saved payment card expires soon",
    tags: ["card", "expiring", "payment", "billing"],
    icon: "calendar",
    body: `Hi {{name}},

The payment card saved to your RoleFlow account expires at the end of this month. To avoid any interruption to your subscription, add a new card before your next renewal.

Your subscription and data are not affected today. You can update your card in just a few clicks.`,
    ctaText: "Update my card",
    ctaUrl: "{{action_url}}",
  },
  {
    id: "bill-refund-processed",
    title: "Refund processed",
    category: "billing",
    subject: "Your RoleFlow refund has been processed",
    tags: ["refund", "processed", "billing"],
    icon: "card",
    body: `Hi {{name}},

We have processed your refund on {{date}}. Depending on your bank or card issuer, it may take 5 to 10 business days to appear on your statement.

Reference: {{incident_id}}. If the refund does not appear after that period, contact your card issuer and mention this reference, or reply to this email.`,
  },
  {
    id: "bill-welcome-paid",
    title: "Welcome to your paid plan",
    category: "billing",
    subject: "Welcome to RoleFlow paid",
    tags: ["welcome", "paid", "onboarding", "plan"],
    icon: "signin",
    body: `Hi {{name}},

Welcome to RoleFlow paid. Your plan is active, and your higher limits and additional models are ready to use.

A few tips to get started: create a project for your ongoing work, set your Custom Instructions once so every chat starts with the right context, and try a different model on a question you have already answered to compare.

Thank you for supporting RoleFlow.`,
    ctaText: "Open RoleFlow",
    ctaUrl: "{{app_url}}",
  },
  {
    id: "bill-cancellation-confirm",
    title: "Subscription cancellation confirmation",
    category: "billing",
    subject: "Your RoleFlow subscription has been cancelled",
    tags: ["cancel", "subscription", "confirmation", "billing"],
    icon: "signin",
    body: `Hi {{name}},

We have received your request to cancel your RoleFlow subscription. You keep paid access until the end of your current billing period, on {{date}}. After that, your account moves to the Free plan.

Your chats and settings remain available. You can resubscribe at any time from your account settings.

We are sorry to see you go. If there was a problem we could have solved, we would like to hear about it.`,
    ctaText: "Manage my plan",
    ctaUrl: "{{action_url}}",
  },
];
