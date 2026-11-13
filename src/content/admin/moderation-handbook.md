# RoleFlow AI · Executive Administration & Moderation Handbook

**Confidential · Internal Operations Only**  
**Role:** Lead of Administration  
**Author / Executive Authority:** Jordan Daniels, Founder & Creator  
**Target Platform:** [<u>RoleFlow AI</u>](https://roleflow.site)

## 1. Executive Summary & Platform Architecture

Welcome to **RoleFlow**. As **Lead of Administration**, you hold primary operational stewardship over the platform's stability, user safety, compliance, and enforcement protocols. RoleFlow is engineered as an intellectual, high-precision AI assistant and engineering environment.

## 2. Administrative Console Overview (/admin)

Your daily operational headquarters is located at https://roleflow.site/admin. Access is strictly governed by admin session authentication.

### 2.1 System Configuration & Emergency Controls

- **Maintenance Mode:** Pauses incoming inference requests and notifies users via an elevated banner while simultaneously updating Better Stack to avoid false-alarm incident alerts. Only toggle during coordinated maintenance.

- **Broadcast System:** Allows sending platform-wide banner announcements across all active user sessions for scheduled updates, feature releases, or incident notices.

- **Model Enforcements:** Ability to lock guest or user tiers to specific models or force low/medium effort levels during upstream capacity squeezes.

- **Limit Controls:** Configurable daily limits for unregistered guests (default: 5) and standard registered users (default: 25).

### 2.2 Needs Attention Page (Admin Home)

- The admin console opens on the Needs Attention page. It shows how many incidents are awaiting review (flagged, appealed, or escalated), total users with how many joined in the last 7 days, banned accounts, and total chats.

- Waiting for review lists the five most recent open incidents. Recent sign-ups lists the five newest accounts. Each panel has a button that opens the Moderation or Users tab.

## 3. Trust, Safety & Moderation Operations

Platform integrity and legal safety are paramount. RoleFlow enforces automated tier classification alongside administrative human-in-the-loop oversight.

### 3.1 Incident Severity Tiers

| **Tier Level**           | **Definition & Violations**                                                                                                          | **Mandatory Action Protocol**                                                                                             |
|--------------------------|--------------------------------------------------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------------------------------|
| **Tier 0**               | Benign queries, technical research, general discussion.                                                                              | Normal processing; no intervention required.                                                                              |
| **Tier 1 (Critical)**    | Child exploitation (CSAM/CSAE), imminent self-harm / suicide threats, violent terrorism, or severe illegal weapons/malware creation. | **Immediate Account Freeze.** Automated generation of an incident dossier. Trigger referral to relevant authorities.      |
| **Tier 2 (Severe)**      | Targeted harassment, hate speech, unauthorized mass scraping, credential harvesting, or spam.                                        | Temporary suspension (7 or 30 days) or account restriction. Issue a formal policy violation notice using Warn or Suspend. |
| **Tier 3 (Operational)** | Repeated rate limit hammering, automated bot bypass attempts, or prompt injection exploits.                                          | IP-level throttling, rate limit reset, or session invalidation.                                                           |

### 3.2 Handling Critical (Tier 1) Emergencies

1.  **Freeze the Account:** Open the incident in the Moderation tab and select Account history. Use Suspend 7 days or Suspend 30 days for a temporary freeze, which ends on its own. Use Ban only for permanent removal.

2.  **Review Incident Dossier:** In the Moderation tab, select Download dossier on the incident. It includes the prompt, conversation context, IP address, and timestamps.

3.  **Escalation & Crisis Guardrails:**

    - For **Self-Harm/Suicide**: Ensure the user was delivered the 988 Suicide & Crisis Lifeline notification guardrail.

    - For **CSAE / Child Safety**: File an expedited report with the National Center for Missing & Exploited Children (NCMEC) and relevant law enforcement bodies.

4.  **Notify Founder:** Direct escalation to Jordan Daniels is required for all Tier 1 incidents.

5.  **Escalate for Review:** Select Escalate on the incident to send it to senior review. It stays in the queue as Escalated until someone reopens it or resolves it. Add a staff note explaining why first.

### 3.3 User Appeals Workflow (/moderation/appeal)

Users whose accounts have been flagged or suspended have the right to submit an appeal.

- Review the historical transcript to distinguish between benign safety classifier false-positives (e.g., creative writing or academic cybersecurity research) and malicious violations.

- If overturned: Select Dismiss and lift ban. This also lifts any suspension. Reset user limits if needed, and add a staff note with your reasoning. The system records the decision with your email address and the time.

- If upheld: Keep the ban or suspension in place and add a staff note quoting the violated Acceptable Use Policy clause. Confirm Ban sends the outcome email automatically.

### 3.4 Moderation Queue Tools

- **Search and filters:** Search by email, prompt text, or incident ID. Filter by status, tier, and category.

- **Warn:** Adds a strike to the account and emails the user a warning. The incident is then closed as Resolved.

- **Suspend:** Blocks chat and API access for 7 days from the incident. Account history also offers 30-day suspensions.

- **Staff notes:** Add internal notes to any incident. Notes are visible to every administrator.

- **Account history:** Shows every incident, the account status, and the strike count for one user. Warn, suspend, lift, and ban are available from there.

- **Bulk actions:** Select several incidents with the checkboxes, then dismiss, warn, escalate, reopen, or suspend them together. Each incident is recorded separately.

- **Audit trail:** Every action is written to the incident with the administrator's email address and the time. These entries cannot be deleted from the console.

### 3.5 Suspension Rules

- **Length:** 1 to 365 days. The suspension ends automatically, and access returns without further action.

- **Permanent bans:** Have no end date. Use Dismiss and lift ban, or Lift ban or suspension on the account, to reverse one.

- **Protected account:** The primary system administrator account cannot be suspended or banned.

- **Effect:** A suspended user cannot use chat or API keys until the suspension ends.

- **Notices:** The user receives an email for each warning and each suspension. Suspension emails give the end date.

## 4. Law Enforcement & Subpoena Compliance (/law-enforcement)

RoleFlow maintains a dedicated portal for verified law enforcement and regulatory inquiries (https://roleflow.site/law-enforcement).

### 4.1 Request Verification Protocol

- **Official Credentials:** All inquiries must originate from an official government or law enforcement domain (e.g., .gov, .police.uk). Personal emails (Gmail, Yahoo) are immediately rejected.

- **Legal Authority:** Requests must present valid statutory authority:

  - **Subpoena:** Non-content account records (basic subscriber information, login timestamps, IP logs).

  - **Court Order / 2703(d):** Detailed transaction records, usage metrics.

  - **Search Warrant:** Probable cause warrant signed by a judicial officer for full content transcripts.

  - **Emergency Disclosure Request:** Immediate threat of death or serious physical harm.

- **Chain of Custody:** Record the Law Request ID, agency name, badge number, case number, and preserve target records in an immutable archive.

## 5. License Keys, Vouchers & Customer Support

### 5.1 License Key Architecture (RF-XXXX-XXXX-XXXX)

Administrators can issue voucher keys to VIP users, enterprise partners, or educational accounts to unlock extended quotas.

- **Generation:** Use the Admin License Keys panel to generate secure SHA-256 hashed keys.

- **Validity Periods:**

  - 7 Days (Trial / Support compensation)

  - 30 Days (Standard Monthly)

  - 90 Days (Quarterly)

  - 365 Days (Annual)

  - Permanent / Infinite (Executive / Staff)

- **Quota Consumption:** Keys automatically serve as a secondary fallback quota when standard daily limits expire.

### 5.2 Support Chat Inspector

- Administrators can inspect chat IDs to diagnose model truncation, failed streams, or API disconnections.

- Never alter user chat transcripts. Respect user privacy outside active support investigations.

## 6. Incident Response & Key Contacts

In the event of an infrastructure outage or critical security incident, follow this escalation matrix:

1.  **Platform Downtime:**

    - Verify Better Stack status page at status.roleflow.site.

    - Post an administrative notice to keep users informed.

2.  **Executive Escalation:**

    - **Founder & Executive Authority:** Jordan Daniels

    - **Emergency Escalation Channel:** Direct platform administrator dispatch

*Handbook Version 1.1 · Updated 13 November 2026 · RoleFlow Operations Team*
