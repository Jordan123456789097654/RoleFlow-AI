import React from "react";
import { LegalHeader } from "@/components/LegalHeader";
import { Footer } from "@/components/Footer";
import { ShieldCheck, Lock, Mail, Database, EyeOff, Server, FileCheck } from "lucide-react";
import Link from "next/link";

export const metadata = {
  title: "Privacy Policy · RoleFlow",
  description: "Learn how RoleFlow protects your data, respects your intellectual property, and maintains strict confidentiality.",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen flex flex-col bg-app text-ink">
      <LegalHeader currentPage="privacy" />

      <main className="flex-1 mx-auto w-full max-w-2xl px-4 py-14 sm:px-6 sm:py-20">
        {/* Header Badge */}
        <div className="mb-10 pb-8 border-b border-line">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-panel border border-line text-xs text-accent mb-4">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Effective Date: January 1, 2026</span>
          </div>
          <h1 className="font-display text-3xl sm:text-4xl text-ink font-normal tracking-tight mb-4">
            Privacy Policy
          </h1>
          <p className="text-sm sm:text-base text-ink/75 leading-relaxed">
            At RoleFlow, privacy is an architectural priority, not an afterthought. We do not sell your personal data,
            nor do we use your private prompts and generated artifacts to train foundational public models.
          </p>
        </div>

        {/* Highlight Callouts */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-12">
          <div className="p-4 rounded-xl bg-app border border-line">
            <EyeOff className="w-5 h-5 text-accent mb-2" />
            <h3 className="text-xs font-semibold text-ink uppercase tracking-wider mb-1">
              No Data Selling
            </h3>
            <p className="text-xs text-ink/75 leading-relaxed">
              We never monetize or broker your personal information, email addresses, or conversation histories.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-app border border-line">
            <Lock className="w-5 h-5 text-accent mb-2" />
            <h3 className="text-xs font-semibold text-ink uppercase tracking-wider mb-1">
              Zero Model Training
            </h3>
            <p className="text-xs text-ink/75 leading-relaxed">
              Your confidential code and enterprise prompts are never fed into foundational training corpuses.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-app border border-line">
            <Mail className="w-5 h-5 text-muted mb-2" />
            <h3 className="text-xs font-semibold text-ink uppercase tracking-wider mb-1">
              Passwordless Auth
            </h3>
            <p className="text-xs text-ink/75 leading-relaxed">
              Resend-powered one-time codes ensure you never store passwords on our servers that could be breached.
            </p>
          </div>
        </div>

        {/* Legal Document Content */}
        <div className="space-y-12 text-ink leading-relaxed text-sm sm:text-[15px]">
          {/* Section 1 */}
          <section className="space-y-3">
            <h2 className="text-xl font-display text-ink font-medium tracking-tight flex items-center gap-2">
              <span className="text-accent font-mono text-sm">01.</span>
              Information We Collect
            </h2>
            <p>
              We collect information strictly necessary to provide, optimize, and secure the RoleFlow service:
            </p>
            <ul className="list-disc list-inside space-y-2 pl-2 text-ink/75">
              <li>
                <strong className="text-ink">Account Identification:</strong> When you authenticate, we collect
                your email address and generate a secure user identifier. For unauthenticated guests, we generate a
                randomized, non-personally identifiable browser guest ID (`guest_xyz`) stored locally in your browser.
              </li>
              <li>
                <strong className="text-ink">Chat Content & Artifacts:</strong> We store your chat messages,
                custom instructions, workspace parameters, and generated code artifacts so you can access, review,
                edit, and share them across sessions.
              </li>
              <li>
                <strong className="text-ink">Technical Telemetry:</strong> Anonymized operational logs such as
                HTTP request timing, model latency, error traces, and token usage to maintain cluster health.
              </li>
            </ul>
          </section>

          {/* Section 2 */}
          <section className="space-y-3">
            <h2 className="text-xl font-display text-ink font-medium tracking-tight flex items-center gap-2">
              <span className="text-accent font-mono text-sm">02.</span>
              Authentication via Resend
            </h2>
            <p>
              RoleFlow does not manage or store user passwords. We utilize <strong>Resend</strong> as our trusted
              transactional email delivery infrastructure to transmit secure 6-digit one-time verification passcodes
              (OTP) and instant magic login links.
            </p>
            <p>
              Your email address is transmitted to Resend exclusively for the purpose of dispatching authentication
              tokens. Resend operates under strict SOC 2 and GDPR-compliant data processing agreements and does not
              market to or contact our users.
            </p>
          </section>

          {/* Section 3 */}
          <section className="space-y-3">
            <h2 className="text-xl font-display text-ink font-medium tracking-tight flex items-center gap-2">
              <span className="text-accent font-mono text-sm">03.</span>
              How We Use Your Data
            </h2>
            <p>We process your data exclusively for the following operational objectives:</p>
            <ul className="list-disc list-inside space-y-1.5 pl-2 text-ink/75">
              <li>Inferencing and delivering responses from RoleFlow Genesis 1.0 and Flash 1.0.</li>
              <li>Rendering sandboxed live interactive previews (HTML, JavaScript, SVGs) within Artifacts.</li>
              <li>Maintaining project memory and custom instructions within dedicated project workspaces.</li>
              <li>Enforcing usage fairness, preventing fraud, and guarding against automated abuse.</li>
            </ul>
            <p className="pt-2">
              <strong className="text-ink">Zero Training Commitment:</strong> Neither your prompts nor model outputs
              are sold, rented, shared with advertising brokers, or used to fine-tune foundational open-weights or proprietary
              models without your explicit, voluntary opt-in.
            </p>
          </section>

          {/* Section 4 */}
          <section className="space-y-3">
            <h2 className="text-xl font-display text-ink font-medium tracking-tight flex items-center gap-2">
              <span className="text-accent font-mono text-sm">04.</span>
              Local Storage & Cookie Usage
            </h2>
            <p>
              RoleFlow uses minimal local storage and essential first-party cookies:
            </p>
            <ul className="list-disc list-inside space-y-1.5 pl-2 text-ink/75">
              <li><code className="text-accent bg-panel px-1.5 py-0.5 rounded text-xs">roleflow_user</code>: Stores your active user session profile for fast UI hydration.</li>
              <li><code className="text-accent bg-panel px-1.5 py-0.5 rounded text-xs">roleflow_guest_id</code>: Tracks guest session isolation to prevent cross-contamination between anonymous users.</li>
              <li><code className="text-accent bg-panel px-1.5 py-0.5 rounded text-xs">roleflow_guest_count</code>: Enforces the 5-message complimentary guest quota.</li>
            </ul>
            <p>
              We do not use third-party tracking pixels, advertising retargeting tags, or cross-site tracking beacons.
            </p>
          </section>

          {/* Section 5 */}
          <section className="space-y-3">
            <h2 className="text-xl font-display text-ink font-medium tracking-tight flex items-center gap-2">
              <span className="text-accent font-mono text-sm">05.</span>
              Data Retention & Your Deletion Rights
            </h2>
            <p>
              You maintain full sovereignty over your conversation history. You may delete individual chat sessions
              at any time directly from the RoleFlow sidebar interface, which purges them from active databases.
            </p>
            <p>
              To request a complete purge of your account, email records, and all associated project workspaces,
              contact our Data Protection Officer at{" "}
              <a href="mailto:support@roleflow.site" className="text-accent hover:underline">
                support@roleflow.site
              </a>
              . All deletion requests are executed within thirty (30) business days.
            </p>
          </section>

          {/* Section 6 */}
          <section className="space-y-3">
            <h2 className="text-xl font-display text-ink font-medium tracking-tight flex items-center gap-2">
              <span className="text-accent font-mono text-sm">06.</span>
              Data Security Standards
            </h2>
            <p>
              All transit communications are encrypted using modern Transport Layer Security (TLS 1.3).
              Databases, project caches, and message repositories are encrypted at rest with AES-256 standard encryption.
              Access to production cloud environments is governed by role-based access control (RBAC) and hardware multi-factor authentication.
            </p>
          </section>

          {/* Section 7 */}
          <section className="space-y-3 pb-8">
            <h2 className="text-xl font-display text-ink font-medium tracking-tight flex items-center gap-2">
              <span className="text-accent font-mono text-sm">07.</span>
              Contact Information
            </h2>
            <p>
              For privacy inquiries, regulatory compliance queries (GDPR, CCPA, CPRA), or data requests, please reach out to:
            </p>
            <div className="p-4 rounded-xl bg-app border border-line flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-ink">RoleFlow Privacy & Security</p>
                <p className="text-xs text-ink/75">Email: support@roleflow.site</p>
              </div>
              <a
                href="mailto:support@roleflow.site"
                className="text-xs px-3 py-1.5 rounded-lg bg-card hover:bg-card text-ink transition-colors border border-line"
              >
                Inquire via Email
              </a>
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
