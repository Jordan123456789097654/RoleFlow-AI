# Privacy Policy

**Effective date:** November 13, 2026
**Last updated:** November 13, 2026

This Privacy Policy explains how RoleFlow, Inc. ("RoleFlow," "we," "us," or "our") collects, uses, discloses, retains, and protects personal information when you use the RoleFlow website at roleflow.site, the chat application, artifacts and live previews, the API, and related services (the "Services"). It also explains the choices and rights you have.

This policy applies to information about users of the Services and visitors to our website. It does not apply to content that third parties publish through links you visit, or to third-party services you connect to the Services, which have their own privacy practices.

Please read this policy together with our Terms of Service, Acceptable Use Policy, AI Output and Content Policy, and Moderation and Appeals Policy.

## 1. Who Controls Your Information

RoleFlow, Inc. is the controller of personal information processed to operate your account and the Services. Contact us at privacy@roleflow.site or support@roleflow.site.

If you are in the European Economic Area, the United Kingdom, or Switzerland, see Section 11 for additional information. You may contact our Data Protection team via email at privacy@roleflow.site.

## 2. Information We Collect

### 2.1 Information you give us

- **Account information.** Your email address, which we use to sign you in and to send you security and service messages. We may also store a display name or other profile details you add in settings.
- **Sign-in data.** When you request a sign-in, we generate a one-time six-digit code and a single-use magic link. We store a hashed or time-limited form of these values for the period needed to verify them, and we do not store them in readable form after use or expiry.
- **Content you submit.** Prompts, messages, edits, custom instructions, project names and settings, feedback such as thumbs up or thumbs down, and any text you type or paste.
- **Attachments.** Images, documents, and text files you upload. Text is extracted from supported files so the assistant can read it. Images are sent to an image-understanding model so the assistant can read them and so that they can be checked for safety.
- **Support communications.** Messages you send us, including appeal statements and AUP reports.
- **API data.** Requests and responses you send through the API, and metadata such as key identifiers and usage counts.

### 2.2 Information we create or collect automatically

- **Usage data.** Timestamps, features used, model selected, effort setting, message counts, and limit status, which we use to enforce usage limits and to keep the Services reliable.
- **Device and technical data.** IP address, browser type and version, operating system, language, and general location derived from IP address. We use IP address for security, abuse prevention, and rate limiting.
- **Cookies and similar technologies.** See Section 7.
- **Safety records.** When content is flagged by our safety systems, we record the flagged content, the classification that triggered the flag, the action taken, and surrounding conversation context needed to review the event. See Section 5.4 and the Moderation and Appeals Policy.

### 2.3 Information from third parties

- **Sign-in providers.** If we add third-party sign-in in the future, we will receive the information you authorize that provider to share.
- **Service providers.** Our infrastructure, email, and model providers may send us operational information, such as delivery status or error reports.

### 2.4 Sensitive information

Do not submit information you do not want processed, such as government identifiers, payment card numbers, passwords for other services, or health records, unless you have a specific need and understand the risk. Our safety systems may process any content you submit, including sensitive content, to detect violations.

## 3. How We Use Information

We use personal information for the following purposes and, where required, on the following legal bases in the EEA, UK, and Switzerland (see Section 11):

- **To provide the Services**, including generating responses, storing your conversations, showing artifacts, and sending sign-in codes. *Basis: performance of a contract.*
- **To secure accounts and prevent abuse**, including detecting fraud, brute-force attempts, credential stuffing, automated scraping, and misuse of API keys. *Basis: legitimate interests and, where applicable, legal obligation.*
- **To enforce our policies and keep users safe**, including automated and human review of flagged content, bans, appeals, and reports to law enforcement or the National Center for Missing and Exploited Children where required. *Basis: legitimate interests, legal obligation, and vital interests where there is risk of serious harm.*
- **To improve reliability and quality**, including diagnosing errors and measuring the performance of safety classifiers and features. Where we use content for this purpose, we apply the minimization and retention limits in Section 5. *Basis: legitimate interests.*
- **To communicate with you**, including service notices, security alerts, responses to support requests, and, with your consent where required, product updates. *Basis: contract, legitimate interests, or consent.*
- **To comply with law**, respond to lawful requests, and protect rights, property, and safety. *Basis: legal obligation and legitimate interests.*
- **To run our business**, including accounting, auditing, and planning. *Basis: legitimate interests.*

We do not sell personal information in exchange for money. We do not use the content of your conversations to show third-party advertising.

## 4. Automated Decisions and Safety Review

Our safety systems use automated rules and machine-learning classifiers to evaluate text prompts, text attachments, and images. These systems can:

- block a request before any answer is generated;
- hold an image for review when it cannot be checked automatically;
- record an incident for human review; and
- in the most serious categories, restrict or suspend an account.

Automated classifications can be wrong. Pattern matching in particular can mistake ordinary words, names, or file names for violations. For this reason, we limit automatic account suspension to the most serious categories, and we give users a way to appeal. Automated decisions that significantly affect you may be reviewed by a person on request, as described in the Moderation and Appeals Policy.

## 5. How Long We Keep Information

We keep information only as long as needed for the purposes described above, unless a longer period is required by law. Typical periods are below.

- **Account data.** For as long as your account is active, and for up to 30 days after deletion request, subject to backups described in Section 5.2.
- **Conversations and attachments.** Until you delete them or delete your account. Deleted conversations are removed from our active systems within 30 days.
- **Sign-in codes and magic links.** Only until they expire or are used, typically a few minutes to 24 hours.
- **Usage and security logs.** Up to 90 days, unless needed for an active investigation.
- **Safety incident records.** Flagged content and the related context are retained for as long as needed to review, process appeals, meet legal reporting duties, and protect the Services. Records for account bans are generally retained for [1–3] years. Incident records involving child sexual abuse material are retained as required by 18 U.S.C. § 2258A and related law.
- **Share links.** Until you revoke the link or delete the conversation. Copies made by others are not under our control.
- **Backups.** Backups may retain deleted data for up to 35 days before being overwritten.

### 5.1 Minimization for review

Where possible, we store safety incident context in the smallest form needed. Images that are not flagged are not retained beyond the processing needed to answer your request. Images that are flagged may be retained as evidence for review. We do not use retained flagged images to train our models.

### 5.2 Backups

Backups are encrypted and access-restricted. Deleted data may persist in backups until those backups expire under the schedule above.

## 6. How We Share Information

We share personal information only in the following circumstances:

- **Service providers.** Vendors that host our application and database, deliver email, provide model inference, store logs, and provide security services. They may process information only on our instructions and under confidentiality and data protection obligations. Current categories include cloud hosting, managed Postgres, transactional email, and language model inference providers. Our core infrastructure partners include Vercel (cloud hosting), Neon (PostgreSQL database), Resend (transactional email), and dedicated neural network inference clusters.
- **Model providers.** When you send a prompt, the relevant text, attachments, and images are transmitted to the model provider that runs the model you selected or that the Services use to answer. Those providers process data under their own terms and are restricted by contract from using your data for purposes beyond providing the service. Model inference providers process data under zero-retention or operational-only terms and do not use your inputs to train foundational models.
- **Web search providers.** When web search is turned on for a reply, the search query (the words used to look things up, not your whole conversation) is sent to the search provider the Services use. That provider receives the query and the network information that comes with any request.
- **Other users you share with.** Share links make the shared conversation visible to anyone who has the link.
- **Law enforcement and legal process.** When required by law, valid legal process, or a good-faith belief that disclosure is necessary to prevent imminent death or serious bodily injury. We report apparent child sexual abuse material to the National Center for Missing and Exploited Children as required by 18 U.S.C. § 2258A.
- **Protection of rights and safety.** To enforce our terms, investigate abuse, and protect users, the public, and our systems.
- **Business transfers.** In connection with a merger, acquisition, financing, or sale of assets, subject to notice and continued protection consistent with this policy.
- **With your consent.** For any other purpose you direct or approve.
- **Aggregated or de-identified data.** We may share statistics that cannot reasonably be used to identify you.

## 7. Cookies and Similar Technologies

We use cookies and similar technologies for these purposes:

- **Strictly necessary.** To keep you signed in, protect against cross-site request forgery, maintain your session, and remember your choices. These cookies are required for the Services to function.
- **Preferences.** To remember settings such as theme, model selection, and interface state.
- **Security.** To detect abuse and to apply rate limits.
- **Analytics.** Where we use analytics, we will use only aggregate, privacy-respecting measurement and will describe it here and in our cookie settings.

You can control cookies through your browser settings. Blocking strictly necessary cookies will prevent you from signing in. Local storage may be used for interface preferences and is not used to store your conversations.

## 8. Your Choices and Rights

Depending on where you live, you may have the following rights. You can exercise them through your account settings where available, or by emailing privacy@roleflow.site.

- **Access and portability.** Request a copy of the personal information we hold about you in a commonly used, machine-readable format.
- **Correction.** Ask us to correct inaccurate information.
- **Deletion.** Ask us to delete your personal information, subject to legal exceptions such as retention of safety records required by law.
- **Restriction and objection.** Ask us to limit or object to certain processing, including processing based on legitimate interests.
- **Withdrawal of consent.** Withdraw consent for processing that depends on consent, without affecting prior processing.
- **Opt out of sale or sharing.** Where applicable under state law, we do not sell or share personal information for cross-context behavioral advertising.
- **Non-discrimination.** We will not treat you differently for exercising these rights.
- **Appeal.** If we deny a request, you may appeal by replying to our decision. Residents of some states may also appeal to their state attorney general.

We will verify your identity before acting on a request, typically by confirming access to the email address on your account. We aim to respond within 45 days, extendable where permitted by law, and will tell you if we need more time.

Account deletion removes your account and associated conversations, subject to the retention exceptions in Section 5. Deletion of a conversation that has already been shared does not automatically remove copies made by others.

## 9. Memory, Custom Instructions, and Projects

Where enabled, memory stores selected facts you tell the assistant so it can apply them in later conversations. You can view, edit, and delete memory entries, and you can turn memory off. Custom instructions and project settings apply to the conversations within the scope you set them. Memory and custom instructions are personal information and are subject to this policy. Do not store information in memory that you would not want processed in that way, such as third-party personal information you do not have the right to share.

## 10. Security

We use technical and organizational measures designed to protect personal information, including encryption in transit using TLS, access controls with least-privilege principles, session management, rate limiting, logging and monitoring, and secure development practices. No system is perfectly secure. If we learn of a breach affecting your personal information, we will notify you and any required authorities without undue delay and within the time required by law.

You are responsible for protecting your email account and API keys. Revoke any API key you believe has been exposed.

## 11. Additional Information for Specific Regions

### 11.1 European Economic Area, United Kingdom, and Switzerland

You have the rights listed in Section 8 and the right to lodge a complaint with your local data protection authority. Where we rely on legitimate interests, you may object. Where we transfer personal information outside your region, we rely on appropriate safeguards, such as Standard Contractual Clauses or the UK International Data Transfer Addendum, or an adequacy decision.

### 11.2 United States state residents

Several states, including California, Colorado, Connecticut, Virginia, and others, provide specific privacy rights. Where applicable, you may request the categories and specific pieces of personal information we hold, correction and deletion, and you may opt out of targeted advertising, sale, and certain profiling. We do not knowingly sell personal information of consumers under 16.

### 11.3 Children and minors

The Services are not directed to children under 13. We do not knowingly collect personal information from children under 13. If you believe a child under 13 has provided us information, contact privacy@roleflow.site and we will delete it. Users aged 13 to 17 must have a parent or guardian consent to these terms. Where local law requires stronger protections, we will apply them.

## 12. International Transfers

Your information may be processed in the United States and in other countries where our providers operate. Those countries may have data protection laws different from those in your location. Where required, we use appropriate safeguards for transfers.

## 13. Third-Party Links and Services

The Services may contain links to third-party websites, or generated code may call third-party services when you run it. We are not responsible for those third parties' privacy practices. Review their policies before providing them with information.

## 14. Changes to This Policy

We may update this policy from time to time. For material changes, we will post notice in the Services or email the address on your account at least 14 days before the change takes effect. The "Last updated" date at the top shows the most recent revision. Earlier versions are available on request.

## 15. Contact Us

For questions, requests, or complaints about this policy:

- Email: privacy@roleflow.site
- General support & legal inquiries: support@roleflow.site

