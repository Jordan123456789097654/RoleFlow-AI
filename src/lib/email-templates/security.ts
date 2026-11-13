import type { EmailTemplate } from "./types";

/** Security, Breaches & Incidents (15 templates) */
export const SECURITY_TEMPLATES: EmailTemplate[] = [
  {
    id: "sec-breach-critical",
    title: "Critical data breach notice",
    category: "security",
    subject: "Important: security incident affecting your RoleFlow account",
    tags: ["breach", "incident", "data", "critical", "notice"],
    icon: "alert",
    body: `Hi {{name}},

We are writing to tell you about a security incident that may have affected information associated with your RoleFlow account ({{email}}). We detected the incident on {{date}} and have contained it. Reference: {{incident_id}}.

What happened: an unauthorized party gained access to part of our systems. We are still completing our investigation, and we will share more as we confirm the details.

What information was involved: we are reviewing which records were accessed. Passwords are stored in hashed form, but we recommend that you sign in and change your password as a precaution.

What we are doing: we have revoked the affected credentials, rotated internal secrets, and engaged an independent forensic firm. We have also notified the appropriate regulators where required.

What you should do: sign in, change your password, and review your recent activity. If you see anything you do not recognize, contact us right away.`,
    ctaText: "Review your account",
    ctaUrl: "{{action_url}}",
  },
  {
    id: "sec-backup-readonly",
    title: "Read-only backup access incident",
    category: "security",
    subject: "Security notice: read-only access to a backup store ({{incident_id}})",
    tags: ["backup", "read-only", "incident", "access"],
    icon: "lock",
    body: `Hi {{name}},

On {{date}}, we identified that a read-only credential for one of our backup stores was used outside its approved scope. Reference: {{incident_id}}.

Our review so far shows that the access was read-only. Nothing was modified or deleted, and the credential could not be used to change production data. We have revoked the credential, restricted the backup store to a named service identity, and started a full audit of access logs for the past 30 days.

We are still confirming whether any personal data was viewed. If our review finds that your information was viewed, we will tell you directly and explain what it means for you.

No action is required from you at this time. If you have questions, reply to this email or contact RoleFlow Support.`,
  },
  {
    id: "sec-credential-reset",
    title: "Credential reset required",
    category: "security",
    subject: "Action required: reset your RoleFlow password",
    tags: ["password", "reset", "credentials", "required"],
    icon: "key",
    body: `Hi {{name}},

As a precaution, we have expired the password on your RoleFlow account ({{email}}). This is part of a routine security measure and is not a sign that your account has been misused.

To regain access, use the "Forgot password" option or sign in with a one-time code sent to your email. Choose a new password that you do not use anywhere else. A password manager is the easiest way to do this.

If you did not expect this change, please contact us right away so we can review recent sign-ins with you.`,
    ctaText: "Reset your password",
    ctaUrl: "{{action_url}}",
  },
  {
    id: "sec-suspicious-login",
    title: "Suspicious IP / unauthorized login",
    category: "security",
    subject: "We noticed an unusual sign-in to your RoleFlow account",
    tags: ["login", "suspicious", "ip", "unauthorized", "alert"],
    icon: "shield",
    body: `Hi {{name}},

We noticed a sign-in to your RoleFlow account ({{email}}) on {{date}} from a location and network that do not match your usual activity. We temporarily limited sensitive actions on the account as a precaution.

If this was you, you do not need to do anything else. If it was not you, please secure your account now:

1. Sign out of all sessions from your account settings.
2. Change your password.
3. Check that your recovery email address is one you control.

Reference: {{incident_id}}. Our team can also review the sign-in history with you if you reply to this email.`,
    ctaText: "Secure my account",
    ctaUrl: "{{action_url}}",
  },
  {
    id: "sec-api-key-invalidated",
    title: "Exposed API key invalidation",
    category: "security",
    subject: "Your RoleFlow API key was revoked because it may be exposed",
    tags: ["api key", "exposed", "revoked", "rotation"],
    icon: "key",
    body: `Hi {{name}},

We found one of your RoleFlow API keys in a public location, such as a public code repository or a shared log. To protect your account and your data, we revoked that key on {{date}}. Reference: {{incident_id}}.

Anyone who has the key can use it to make requests on your behalf, so please treat it as compromised even if you have not seen any misuse.

What to do next:
1. Create a new key in your API keys settings.
2. Update your applications and environment variables with the new key.
3. Remove the old key from the place where it was exposed, and review that repository's history.

If you believe you received this notice in error, please reply to this email.`,
    ctaText: "Manage API keys",
    ctaUrl: "{{action_url}}",
  },
  {
    id: "sec-mandatory-2fa",
    title: "Mandatory 2FA enforcement",
    category: "security",
    subject: "Two-factor sign-in will be required for your account",
    tags: ["2fa", "mfa", "enforcement", "security", "policy"],
    icon: "mail",
    body: `Hi {{name}},

Starting {{date}}, RoleFlow will require two-step verification for all accounts. This helps protect your conversations, memories and API keys from unauthorized sign-in, even if a password is leaked.

You can set this up now in a few minutes. Open your account settings, choose Security, and add an authenticator app or a recovery method. Keep the recovery codes somewhere safe.

If you do not set up two-step verification before the deadline, you will be asked to complete it the next time you sign in. We will never ask you for your full password or your verification code by email, chat or phone.`,
    ctaText: "Set up two-step verification",
    ctaUrl: "{{action_url}}",
  },
  {
    id: "sec-zero-day-disclosure",
    title: "Zero-day vulnerability disclosure",
    category: "security",
    subject: "Security advisory: vulnerability in a third-party component ({{incident_id}})",
    tags: ["zero-day", "vulnerability", "advisory", "disclosure", "patch"],
    icon: "sparkle",
    body: `Hi {{name}},

On {{date}}, a publicly disclosed vulnerability was identified in a third-party component used by parts of the RoleFlow platform. Reference: {{incident_id}}.

We reviewed our exposure and found no evidence that the vulnerability was exploited against RoleFlow. As a precaution, we applied a mitigation within hours of confirming the issue and have scheduled a permanent upgrade.

You do not need to take action. We will publish a full write-up once the upgrade is complete. If you run your own integrations with RoleFlow, please keep your client libraries up to date.`,
  },
  {
    id: "sec-phishing-advisory",
    title: "Phishing advisory and warning",
    category: "security",
    subject: "Warning: phishing emails pretending to be RoleFlow",
    tags: ["phishing", "scam", "warning", "advisory", "fraud"],
    icon: "alert",
    body: `Hi {{name}},

We have received reports of emails that pretend to come from RoleFlow. They ask you to "verify your account", "confirm a payment" or "restore access" through a link that does not go to roleflow.site.

RoleFlow will never ask for your password, your one-time sign-in code or your API keys by email, text message or chat. Our sign-in emails come from noreply@roleflow.site and only contain links to roleflow.site.

If you received a message like this, do not click any links or open attachments. Delete it and report it to us. If you already entered credentials anywhere, change your password and contact us immediately.

Reference: {{incident_id}}.`,
  },
  {
    id: "sec-session-invalidation",
    title: "Session invalidation",
    category: "security",
    subject: "We signed you out of all RoleFlow sessions",
    tags: ["session", "sign out", "invalidated", "security"],
    icon: "wrench",
    body: `Hi {{name}},

For your protection, we have ended all active RoleFlow sessions on your account ({{email}}). This happened on {{date}} after a security check, and it affects every browser and device where you were signed in.

To continue, sign in again. You may be asked for a one-time code sent to your email. Your conversations, projects and settings are unchanged.

If you did not expect this, please change your password once you sign in and let us know so we can review the activity.`,
    ctaText: "Sign in again",
    ctaUrl: "{{app_url}}",
  },
  {
    id: "sec-ddos-lockdown",
    title: "DDoS and security lockdown notice",
    category: "security",
    subject: "Service in security lockdown while we mitigate an attack",
    tags: ["ddos", "lockdown", "attack", "availability", "security"],
    icon: "wrench",
    body: `Hi {{name}},

On {{date}}, RoleFlow experienced a large-scale denial-of-service attack. As a protective measure, we placed parts of the service into a temporary lockdown, which may have caused slow responses, sign-in delays or intermittent errors.

Our traffic filtering is now absorbing the attack, and service has returned to normal for most people. We are keeping extra protections in place for the next several hours while we confirm that the attack has stopped.

Your data was not accessed as part of this event. Reference: {{incident_id}}. Thank you for your patience while we keep the platform safe.`,
    ctaText: "Check service status",
    ctaUrl: "{{app_url}}",
  },
  {
    id: "sec-password-policy",
    title: "Password policy update",
    category: "security",
    subject: "Updated password requirements for RoleFlow accounts",
    tags: ["password", "policy", "requirements", "update"],
    icon: "lock",
    body: `Hi {{name}},

Starting {{date}}, new RoleFlow passwords must be at least 12 characters long and must not appear in known data breach lists. Existing passwords will keep working until you next change them.

We made this change to keep accounts safer against guessing and credential-stuffing attacks. A long passphrase of four or five random words works well.

No action is needed right now. If you use RoleFlow with a password manager, it may already generate passwords that meet the new requirements.`,
    ctaText: "Review security settings",
    ctaUrl: "{{action_url}}",
  },
  {
    id: "sec-bug-bounty-thanks",
    title: "Vulnerability report thank-you",
    category: "security",
    subject: "Thank you for reporting a security issue to RoleFlow",
    tags: ["bug bounty", "researcher", "thanks", "vulnerability", "responsible disclosure"],
    icon: "users",
    body: `Hi {{name}},

Thank you for reporting a potential security issue to RoleFlow. We have reviewed your report (reference {{incident_id}}) and confirmed the issue. Our engineering team has deployed a fix as of {{date}}.

We are grateful for responsible disclosure. As a thank you, we have added your name to our security acknowledgements page if you would like to be listed, and we are happy to discuss a reward under our disclosure policy.

Please keep the details confidential until we publish our write-up together.`,
  },
  {
    id: "sec-api-key-rotation",
    title: "Scheduled API key rotation required",
    category: "security",
    subject: "Action required: rotate your RoleFlow API keys by {{date}}",
    tags: ["api key", "rotation", "deadline", "required"],
    icon: "wrench",
    body: `Hi {{name}},

As part of our key-hygiene program, API keys that were created before our 2026 security update must be rotated by {{date}}. After that date, older keys will stop working.

To rotate a key, create a new one in your API keys settings, update your applications, and then revoke the old key. You can keep both keys active during the transition.

If you need help with the migration, reply to this email and our team will assist.`,
    ctaText: "Rotate API keys",
    ctaUrl: "{{action_url}}",
  },
  {
    id: "sec-new-device-alert",
    title: "New device sign-in alert",
    category: "security",
    subject: "New sign-in to your RoleFlow account",
    tags: ["new device", "sign-in", "alert", "verification"],
    icon: "wrench",
    body: `Hi {{name}},

Your RoleFlow account ({{email}}) was signed in on a new device on {{date}}. If this was you, you can ignore this message.

If you do not recognize this sign-in, please sign out of all sessions and change your password right away. We recommend turning on two-step verification to block unfamiliar sign-ins.`,
    ctaText: "Review recent sign-ins",
    ctaUrl: "{{action_url}}",
  },
  {
    id: "sec-incident-update",
    title: "Security incident status update",
    category: "security",
    subject: "Security incident update ({{incident_id}})",
    tags: ["incident", "update", "status", "security"],
    icon: "document",
    body: `Hi {{name}},

This is an update on security incident {{incident_id}}, which we first shared with you on {{date}}.

Where we are now: we have completed containment and are in the recovery phase. We have confirmed the scope of the incident and have no evidence that it has spread beyond the systems already identified.

What comes next: we will publish a final report once our independent review is complete. We will email you again if there is anything you need to do.

Thank you for your continued patience. We know this is unsettling, and we are committed to being open with you.`,
  },
];
