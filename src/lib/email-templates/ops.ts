import type { EmailTemplate } from "./types";

/** Outages, Maintenance & System Ops (15 templates) */
export const OPS_TEMPLATES: EmailTemplate[] = [
  {
    id: "ops-db-maintenance",
    title: "Scheduled database maintenance window",
    category: "ops",
    subject: "Scheduled maintenance on {{date}}: brief interruption expected",
    tags: ["maintenance", "database", "scheduled", "downtime"],
    icon: "wrench",
    body: `Hi {{name}},

We will perform scheduled database maintenance on {{date}}. During the window, RoleFlow may be read-only or briefly unavailable. We expect the window to last no more than 45 minutes.

What to expect: you may see a "temporarily unavailable" message if you try to send a message or save settings during the window. Chats you have already sent will not be lost.

We scheduled this window at a time of low traffic. Reference: {{incident_id}}. Thank you for your patience while we keep the platform fast and reliable.`,
    ctaText: "View status page",
    ctaUrl: "{{app_url}}",
  },
  {
    id: "ops-emergency-infra",
    title: "Emergency infrastructure maintenance",
    category: "ops",
    subject: "Emergency maintenance in progress on RoleFlow",
    tags: ["emergency", "infrastructure", "maintenance", "urgent"],
    icon: "wrench",
    body: `Hi {{name}},

We have started emergency maintenance on part of the RoleFlow infrastructure as of {{date}}. We chose to act now rather than wait for a scheduled window because the work reduces a risk to service stability.

You may see slower responses or brief errors while we work. We will update you as soon as the work is complete. Reference: {{incident_id}}.

We are sorry for the disruption and appreciate your patience.`,
  },
  {
    id: "ops-p1-disruption",
    title: "P1 service disruption alert",
    category: "ops",
    subject: "[P1] RoleFlow service disruption in progress",
    tags: ["p1", "outage", "disruption", "critical", "alert"],
    icon: "alert",
    body: `Hi {{name}},

We are currently experiencing a P1 service disruption that affects {{incident_id}}. Some users may be unable to sign in, load chats, or receive responses. Our engineers are actively working on a fix.

We first observed the problem on {{date}}. We will post updates every 30 minutes until the service is fully restored, and we will send a final summary once the incident is closed.

Your data has not been lost. Please avoid repeatedly retrying actions, as this can slow recovery.`,
    ctaText: "View live status",
    ctaUrl: "{{app_url}}",
  },
  {
    id: "ops-ai-degradation",
    title: "Partial AI degradation and queue delays",
    category: "ops",
    subject: "Slower AI responses while we manage high demand",
    tags: ["degradation", "latency", "queue", "ai", "performance"],
    icon: "calendar",
    body: `Hi {{name}},

Since {{date}}, some AI responses on RoleFlow have taken longer than usual. Demand has risen faster than our current capacity, and requests are waiting in a queue before they are processed.

What we are doing: we are adding capacity, routing requests across additional provider keys, and temporarily prioritizing interactive chats over background tasks.

Your conversations and saved data are not affected. You may find that responses succeed on a retry. We will let you know once response times are back to normal.`,
    ctaText: "Check status",
    ctaUrl: "{{app_url}}",
  },
  {
    id: "ops-provider-failover",
    title: "Third-party provider failover advisory",
    category: "ops",
    subject: "RoleFlow moved traffic to a backup provider",
    tags: ["failover", "provider", "backup", "routing", "advisory"],
    icon: "globe",
    body: `Hi {{name}},

On {{date}}, one of our upstream AI providers began returning errors. To keep RoleFlow available, we automatically moved affected traffic to a backup provider and model. Reference: {{incident_id}}.

What this means for you: responses may come from a different model for a short period, and they may read slightly differently. Your chats, memories and settings are unchanged.

We will move traffic back to the primary provider once it has been stable for a sustained period. We will confirm when that happens.`,
  },
  {
    id: "ops-rca-postmortem",
    title: "Incident resolved: post-mortem (RCA)",
    category: "ops",
    subject: "Incident resolved: root cause analysis for {{incident_id}}",
    tags: ["rca", "post-mortem", "resolved", "incident", "review"],
    icon: "check",
    body: `Hi {{name}},

The incident {{incident_id}}, which began on {{date}}, is now resolved. Service has returned to normal for all users.

Summary: a configuration change deployed to part of the platform caused intermittent failures for a subset of requests. Our monitoring detected the issue, and our on-call team reverted the change.

Root cause: the change was validated in staging but not against production traffic patterns. We have added automated checks and a staged rollout for this class of change.

What we are changing: a canary step for production configuration changes, faster rollback tooling, and a review of our alert thresholds. Thank you for your patience while we fixed this.`,
    ctaText: "Read the full post-mortem",
    ctaUrl: "{{app_url}}",
  },
  {
    id: "ops-api-deprecation",
    title: "API endpoint deprecation notice",
    category: "ops",
    subject: "Deprecation notice: an API endpoint will be retired on {{date}}",
    tags: ["api", "deprecation", "endpoint", "migration", "developers"],
    icon: "document",
    body: `Hi {{name}},

We are deprecating one of the RoleFlow API endpoints. It will stop accepting requests on {{date}}. Until then, it will keep working, but responses include a deprecation header.

How to migrate: use the current chat completions endpoint, which supports the same request format. The migration guide, with example requests and error handling, is in our developer docs.

If you need more time, reply to this email with your use case and we will consider an extension.`,
    ctaText: "Read the migration guide",
    ctaUrl: "{{action_url}}",
  },
  {
    id: "ops-release-window",
    title: "Planned release window",
    category: "ops",
    subject: "Planned platform release on {{date}}",
    tags: ["release", "deploy", "window", "planned"],
    icon: "bolt",
    body: `Hi {{name}},

We will deploy a planned platform release on {{date}}. We expect no user-visible downtime. If anything does change, we will show a short banner in the app.

What is in the release: performance improvements, reliability fixes and a few small interface refinements. Full details will be in the changelog once the release is live.

Reference: {{incident_id}}.`,
  },
  {
    id: "ops-search-degradation",
    title: "Web search provider degradation",
    category: "ops",
    subject: "Web search is temporarily degraded on RoleFlow",
    tags: ["search", "degradation", "web", "provider"],
    icon: "chart",
    body: `Hi {{name}},

Since {{date}}, web search results in RoleFlow may be slower or incomplete. Our search provider is experiencing elevated error rates.

When search is unavailable, RoleFlow still answers from its own knowledge, and it tells you when a result could not be verified. You can retry a question in a few minutes.

We will confirm when search is back to normal. Reference: {{incident_id}}.`,
  },
  {
    id: "ops-email-delay",
    title: "Email delivery delay notice",
    category: "ops",
    subject: "Delayed sign-in and notification emails",
    tags: ["email", "delay", "sign-in", "delivery"],
    icon: "mail",
    body: `Hi {{name}},

Since {{date}}, some RoleFlow emails, including sign-in codes and notifications, have been delivered later than usual. This is caused by a delay at our email delivery provider.

If you are waiting for a sign-in code, please wait a few minutes before requesting another one. Codes that arrive late still expire on schedule, so request a new one if the first code has expired.

Check your spam folder if you do not see the email. We will confirm once delivery has recovered.`,
  },
  {
    id: "ops-cert-renewal",
    title: "Certificate renewal notice",
    category: "ops",
    subject: "Certificate renewal for roleflow.site completed",
    tags: ["certificate", "tls", "renewal", "security", "no action"],
    icon: "lock",
    body: `Hi {{name}},

We renewed the TLS certificate for roleflow.site on {{date}}. The renewal completed without interruption, and no action is needed on your side.

If you use RoleFlow through a custom integration that pins our certificate, please update the pin using the new public key published in our developer documentation.

Thank you for keeping your integrations current.`,
  },
  {
    id: "ops-data-backfill",
    title: "Data backfill and export reprocessing",
    category: "ops",
    subject: "A data reprocessing job affected some exports",
    tags: ["backfill", "export", "reprocessing", "data"],
    icon: "document",
    body: `Hi {{name}},

On {{date}}, we ran a background job to reprocess stored data. For a short period, some data exports may have been delayed or may have omitted recent items.

The job has finished, and exports now include all records. If you requested an export between {{date}} and today, please request it again to make sure you have the latest copy.

Reference: {{incident_id}}. Your chats and settings were not changed by this job.`,
    ctaText: "Export my data",
    ctaUrl: "{{action_url}}",
  },
  {
    id: "ops-feature-rollout",
    title: "Staged feature rollout",
    category: "ops",
    subject: "A new feature is rolling out in stages",
    tags: ["rollout", "feature flag", "staged", "beta"],
    icon: "sparkle",
    body: `Hi {{name}},

Starting {{date}}, we are rolling out a new feature in stages. You may see it appear in your account over the coming days, or you may not see it until a later stage.

If you notice a problem, please report it from the feedback option in the app. Including what you were doing when it happened helps us fix it faster.

There is nothing you need to do to receive the feature. Reference: {{incident_id}}.`,
  },
  {
    id: "ops-monthly-uptime",
    title: "Monthly uptime and reliability report",
    category: "ops",
    subject: "RoleFlow reliability report for {{date}}",
    tags: ["uptime", "report", "reliability", "monthly", "sla"],
    icon: "chart",
    body: `Hi {{name}},

Here is a summary of RoleFlow reliability for the period ending {{date}}.

Availability: the platform met its availability target for the month. Incidents: we recorded a small number of incidents, each with a published post-mortem. Response times: median and 95th percentile latencies were within our targets for chat responses.

What we are working on next: reducing time to detect degraded AI responses and improving the way we communicate during incidents.

Thank you for trusting RoleFlow with your work. Reference: {{incident_id}}.`,
    ctaText: "View status history",
    ctaUrl: "{{app_url}}",
  },
  {
    id: "ops-deprecated-model",
    title: "Legacy model retirement schedule",
    category: "ops",
    subject: "A legacy model will be retired on {{date}}",
    tags: ["model", "retirement", "deprecation", "legacy"],
    icon: "calendar",
    body: `Hi {{name}},

We will retire a legacy model on {{date}}. After that date, chats that were set to use it will automatically use the closest current model in the same family.

What to do: if you prefer a specific model, select it in the model picker before the retirement date. Your existing chats, projects and memories are unaffected.

If you rely on this model in an integration, check your API calls and update the model name to a current one.`,
    ctaText: "See available models",
    ctaUrl: "{{app_url}}",
  },
];
