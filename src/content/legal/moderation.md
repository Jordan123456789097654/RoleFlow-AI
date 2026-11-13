# Moderation and Appeals Policy

**Effective date:** November 13, 2026
**Last updated:** November 13, 2026

This policy explains how RoleFlow reviews content, what happens when a request or upload is flagged, how enforcement decisions are made, and how you can appeal. It applies to prompts, messages, text attachments, images, custom instructions, project content, shared conversations, and API requests.

## 1. Purpose

RoleFlow uses automated safety systems and, where appropriate, human review to enforce our Terms of Service and Acceptable Use Policy. We aim to:

- stop serious harms before a response is generated;
- avoid blocking legitimate content;
- explain decisions clearly enough that you can understand and contest them; and
- keep a reliable record of safety decisions for accountability and legal compliance.

No system is perfect. Automated classifiers can produce false positives (flagging harmless content) and false negatives (missing harmful content). This policy is designed around both risks.

## 2. What Is Reviewed

### 2.1 Text

Each message you send is checked against rule-based detectors in several categories. Detectors look for specific phrases and patterns. Some detectors normalize text to catch obfuscated spellings. We check your current message and, where relevant, recent user messages in the same conversation.

### 2.2 Text attachments

For supported text files, we check the file's content and its name. Text is truncated for scanning purposes if it is very long.

### 2.3 Images

Images are sent to an image-understanding classifier before a response is generated. The classifier is asked to flag only clear violations in the following categories: child sexual abuse material, weapons manufacturing instructions or diagrams, violent extremist propaganda, and imagery that encourages self-harm. Ordinary photos, screenshots, documents, art, and medical or educational images are not intended to be flagged.

File names of images are not used for keyword scanning.

### 2.4 Unavailable image review

If the image-review capability is not available on our systems, images are held and not answered until they can be reviewed. You will see a message explaining that the image could not be checked. We are working to minimize these interruptions. You can try again later, or send a text description in place of the image.

## 3. Outcomes of a Flag

Flags fall into two tiers.

### 3.1 Tier 1: Zero-tolerance categories

Tier 1 covers the most severe categories, including child sexual abuse material and exploitation of minors, mass-casualty weapons, imminent threats to life, and terrorist attack planning.

When a Tier 1 flag is triggered:

1. the request is blocked and no response is generated;
2. the account is suspended immediately and permanently terminated, and API keys associated with it may be revoked;
3. the flagged content and related context are preserved for review and for legal reporting; and
4. we may report the matter to the National Center for Missing and Exploited Children, law enforcement, or other authorities as required or permitted by law.

Tier 1 decisions are generally not reversed on appeal except where a clear, verifiable error is established, such as a confirmed misidentification of the account.

### 3.2 Tier 2: Policy violations

Tier 2 covers serious but lower-severity categories, including cyberattack tooling, ransomware, phishing and fraud, drug synthesis, self-harm instructions, and specific threats of violence.

When a Tier 2 flag is triggered:

1. the request is refused, and you receive a short explanation of the category;
2. the request and context are logged for review;
3. repeated violations may lead to feature restrictions, suspension, or termination; and
4. no response to the flagged request is generated.

Where content suggests a person may be at risk of self-harm, we will provide crisis resources in our response and will not treat the message as a policy violation requiring punishment.

### 3.3 Holds

When an image or other content cannot be classified, it may be placed on hold. Held content is not answered. Held content is reviewed as soon as practical. If review clears it, you may resubmit or we may restore the request.

## 4. Human Review

A trained reviewer examines flagged content when:

- an account is about to be suspended or terminated, other than for an immediately-enforceable Tier 1 category;
- a flag is appealed;
- a classifier is uncertain or has a known error pattern; or
- we conduct periodic quality audits.

Reviewers are bound by confidentiality obligations and access rules. Access to flagged content is limited to people who need it to perform safety, legal, or compliance functions.

## 5. Notice to You

When content is blocked, held, or results in enforcement, we will tell you:

- what action was taken;
- the general category of the concern (for example, "image could not be checked," or "request relates to malware");
- whether the action is a warning, a restriction, a suspension, or a termination; and
- how to appeal, where an appeal is available.

We will not reveal the exact detection rules to avoid helping people evade them. We will not disclose the content of another user's report to you.

## 6. Appeals

### 6.1 Who can appeal

You may appeal any suspension, termination, feature restriction, or Tier 2 refusal that you believe was made in error. Tier 1 decisions may be appealed only on the narrow grounds in Section 3.1.

### 6.2 How to appeal

Submit an appeal through the Services or by emailing support@roleflow.site with the subject "Appeal" and your account email address. Include:

- the date and time of the action;
- the account or key affected;
- a statement explaining why you believe the action was wrong; and
- any relevant context, such as what you were trying to accomplish.

Please keep appeal statements factual and concise. You may attach a short explanation but do not include unrelated personal information.

### 6.3 Review timeline

We aim to acknowledge appeals within two (2) business days and to decide them within ten (10) business days. Complex matters or those requiring law enforcement coordination may take longer. We will tell you if we need more time.

### 6.4 Who decides

Appeals are reviewed by a person who did not make the original decision. Where the decision rests on automated classification, the reviewer examines the content and context directly.

### 6.5 Possible outcomes

- **Upheld.** The original decision stands, and we explain the reasoning in general terms.
- **Reversed.** We restore access, remove the enforcement from your record, and restore any content we can lawfully restore.
- **Modified.** We change the outcome, for example reducing a suspension to a warning.

### 6.6 Final decision

Appeal outcomes are final within our internal process. This does not limit any rights you have under applicable law, including the right to contact a state attorney general or, where applicable, a data protection authority, or to pursue remedies available under law.

## 7. Automated Decisions and Your Rights

Where a decision based solely on automated processing has a significant effect on you, you may request human review and an explanation. Contact privacy@roleflow.site. Residents of some jurisdictions have additional rights to challenge automated decisions, and we will honor them where they apply.

## 8. Shared Content and Third Parties

Share links may be disabled when the underlying conversation violates policy. Disabling a share does not delete the original conversation, which is subject to review under this policy.

Reports from third parties, such as copyright holders or trusted flaggers, are reviewed under the same procedures. We may act on valid legal notices, including takedown requests, and will notify affected users where permitted.

## 9. Logging and Records

We maintain records of safety decisions, including the flagged content, the category, the action taken, the timestamp, and the outcome of any appeal. Records are protected, access-controlled, and retained as described in our Privacy Policy. Where we are required to preserve evidence for law enforcement, we do so.

## 10. Accuracy Commitments

We monitor the performance of our classifiers, including false positive rates for ordinary content, and we revise rules that cause avoidable false positives. If you believe a category is wrongly triggered for a class of ordinary content, tell us at support@roleflow.site so we can review it.

## 11. Developer and API Customers

API customers are responsible for their own end users' compliance and must implement reasonable measures to prevent abuse of their integrations. We may suspend API keys whose traffic triggers repeated Tier 1 or Tier 2 flags.

## 12. Contact

Moderation questions, appeals, and reports: support@roleflow.site
Safety and security reports: security@roleflow.site

