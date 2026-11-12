import React from "react";
import { LegalHeader } from "@/components/LegalHeader";
import { Footer } from "@/components/Footer";
import { FileText, Shield, Scale, HelpCircle } from "lucide-react";
import Link from "next/link";

export const metadata = {
  title: "Terms of Service · RoleFlow",
  description: "Terms and conditions governing your use of RoleFlow AI and its interactive artifacts platform.",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen flex flex-col bg-app text-ink">
      <LegalHeader currentPage="terms" />

      <main className="flex-1 mx-auto w-full max-w-2xl px-4 py-14 sm:px-6 sm:py-20">
        {/* Header Badge */}
        <div className="mb-10 pb-8 border-b border-line">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-panel border border-line text-xs text-accent mb-4">
            <Scale className="w-3.5 h-3.5" />
            <span>Effective Date: January 1, 2026</span>
          </div>
          <h1 className="font-display text-3xl sm:text-4xl text-ink font-normal tracking-tight mb-4">
            Terms of Service
          </h1>
          <p className="text-sm sm:text-base text-ink/75 leading-relaxed">
            Please read these Terms of Service carefully before accessing or using RoleFlow. By accessing,
            browsing, or interacting with our services, you agree to be legally bound by these terms.
          </p>
        </div>

        {/* Legal Document Content */}
        <div className="space-y-12 text-ink leading-relaxed text-sm sm:text-[15px]">
          {/* Section 1 */}
          <section className="space-y-3">
            <h2 className="text-xl font-display text-ink font-medium tracking-tight flex items-center gap-2">
              <span className="text-accent font-mono text-sm">01.</span>
              Acceptance of Terms
            </h2>
            <p>
              These Terms of Service (&ldquo;Terms&rdquo;) govern your access to and use of the RoleFlow
              web application, services, application programming interfaces (APIs), and interactive software
              environments provided by RoleFlow, Inc. (&ldquo;RoleFlow,&rdquo; &ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;).
              By creating an account, authenticating via email, or utilizing guest access, you acknowledge that
              you have read, understood, and agreed to be bound by these Terms and our{" "}
              <Link href="/privacy" className="text-accent hover:underline">
                Privacy Policy
              </Link>
              . If you do not agree, you must immediately discontinue use of the service.
            </p>
          </section>

          {/* Section 2 */}
          <section className="space-y-3">
            <h2 className="text-xl font-display text-ink font-medium tracking-tight flex items-center gap-2">
              <span className="text-accent font-mono text-sm">02.</span>
              RoleFlow Services & Architecture
            </h2>
            <p>
              RoleFlow provides high-precision conversational artificial intelligence models (including
              RoleFlow Genesis 1.0 and RoleFlow Flash 1.0), interactive runtime preview sandboxes
              (&ldquo;Artifacts&rdquo;), project workspaces, and deep reasoning effort controls.
            </p>
            <p>
              RoleFlow continuously improves and updates its computational models and infrastructure. We reserve
              the right to modify, enhance, or discontinue any feature, endpoint, or model parameter at any time
              with reasonable notice where feasible.
            </p>
          </section>

          {/* Section 3 */}
          <section className="space-y-3">
            <h2 className="text-xl font-display text-ink font-medium tracking-tight flex items-center gap-2">
              <span className="text-accent font-mono text-sm">03.</span>
              Accounts & Passwordless Authentication
            </h2>
            <p>
              RoleFlow utilizes passwordless magic link and one-time passcode (OTP) authentication powered by
              Resend. To access persistent features, you must provide a valid email address. You are responsible
              for maintaining the confidentiality of your credentials and email inbox access. You agree to notify
              RoleFlow immediately at{" "}
              <a href="mailto:support@roleflow.site" className="text-accent hover:underline">
                support@roleflow.site
              </a>{" "}
              if you discover any unauthorized access or security breach involving your account.
            </p>
            <div className="p-4 rounded-xl bg-panel border border-line text-xs text-ink/75 flex items-start gap-3">
              <Shield className="w-4 h-4 text-accent shrink-0 mt-0.5" />
              <div>
                <strong className="text-ink block mb-1">Guest Sessions</strong>
                Unauthenticated visitors receive up to five (5) complimentary messages stored in browser local storage.
                To preserve your chats across devices, prevent accidental data loss, and access higher limits, authentication
                is required.
              </div>
            </div>
          </section>

          {/* Section 4 */}
          <section className="space-y-3">
            <h2 className="text-xl font-display text-ink font-medium tracking-tight flex items-center gap-2">
              <span className="text-accent font-mono text-sm">04.</span>
              Content Ownership & Intellectual Property
            </h2>
            <p>
              <strong className="text-ink">Your Input:</strong> You retain all ownership, rights, and title to
              the prompts, code, text, files, and attachments you input into RoleFlow (&ldquo;Input&rdquo;).
            </p>
            <p>
              <strong className="text-ink">Generated Output:</strong> As between you and RoleFlow, and to the
              extent permitted by applicable law, you own all rights, title, and interest in the outputs, code
              snippets, and interactive artifacts generated by RoleFlow in response to your input (&ldquo;Output&rdquo;).
              RoleFlow does not assert copyright ownership over the code or literature you create through our platform.
            </p>
            <p>
              <strong className="text-ink">Platform Rights:</strong> All intellectual property rights in the
              RoleFlow interface, brand, trademarks, model architecture, algorithms, and infrastructure remain the
              exclusive property of RoleFlow, Inc.
            </p>
          </section>

          {/* Section 5 */}
          <section className="space-y-3">
            <h2 className="text-xl font-display text-ink font-medium tracking-tight flex items-center gap-2">
              <span className="text-accent font-mono text-sm">05.</span>
              Interactive Artifacts & Sandboxed Code Execution
            </h2>
            <p>
              RoleFlow allows users to view and interact with real-time HTML, JavaScript, CSS, SVG, and React
              artifacts directly inside sandboxed browser iframes. You acknowledge that:
            </p>
            <ul className="list-disc list-inside space-y-1.5 pl-2 text-ink/75">
              <li>Artifact execution occurs client-side inside an isolated browser environment.</li>
              <li>You are responsible for reviewing and testing any code before using it in production systems.</li>
              <li>You must not execute or share malicious scripts, cross-site exploits, or unauthorized phishing components.</li>
            </ul>
          </section>

          {/* Section 6 */}
          <section className="space-y-3">
            <h2 className="text-xl font-display text-ink font-medium tracking-tight flex items-center gap-2">
              <span className="text-accent font-mono text-sm">06.</span>
              User Conduct & Prohibited Uses
            </h2>
            <p>
              You agree not to misuse RoleFlow services. Specific prohibitions are set forth in our{" "}
              <Link href="/acceptable-use" className="text-accent hover:underline">
                Acceptable Use Policy
              </Link>
              , including attempting to reverse engineer model weights, generating malware or offensive materials,
              violating third-party privacy, or circumventing system rate limits and guest allowances.
            </p>
          </section>

          {/* Section 7 */}
          <section className="space-y-3">
            <h2 className="text-xl font-display text-ink font-medium tracking-tight flex items-center gap-2">
              <span className="text-accent font-mono text-sm">07.</span>
              Warranty Disclaimers & Nature of AI
            </h2>
            <p className="uppercase text-xs text-ink/75 tracking-wider font-mono">
              Disclaimer of Warranties
            </p>
            <p>
              ROLEFLOW IS PROVIDED ON AN &ldquo;AS IS&rdquo; AND &ldquo;AS AVAILABLE&rdquo; BASIS WITHOUT WARRANTIES
              OF ANY KIND, WHETHER EXPRESS, IMPLIED, STATUTORY, OR OTHERWISE. ARTIFICIAL INTELLIGENCE MODELS MAY
              OCCASIONALLY PRODUCE INACCURATE, FACTUALLY ERRONEOUS, OR INCOMPLETE OUTPUTS (&ldquo;HALLUCINATIONS&rdquo;).
              YOU MUST INDEPENDENTLY VERIFY ALL ARCHITECTURAL RECOMMENDATIONS, MATHEMATICAL CALCULATIONS, AND CODE
              BEFORE RELYING ON THEM FOR CRITICAL OR COMMERCIAL APPLICATIONS.
            </p>
          </section>

          {/* Section 8 */}
          <section className="space-y-3">
            <h2 className="text-xl font-display text-ink font-medium tracking-tight flex items-center gap-2">
              <span className="text-accent font-mono text-sm">08.</span>
              Limitation of Liability
            </h2>
            <p>
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, IN NO EVENT SHALL ROLEFLOW, INC., ITS DIRECTORS, EMPLOYEES,
              PARTNERS, OR SUPPLIERS BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE
              DAMAGES, INCLUDING LOSS OF PROFITS, DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES, RESULTING FROM
              YOUR ACCESS TO OR USE OF OR INABILITY TO ACCESS OR USE THE SERVICE.
            </p>
          </section>

          {/* Section 9 */}
          <section className="space-y-3">
            <h2 className="text-xl font-display text-ink font-medium tracking-tight flex items-center gap-2">
              <span className="text-accent font-mono text-sm">09.</span>
              Termination & Account Suspension
            </h2>
            <p>
              We reserve the right to suspend or terminate your account or access to the service at our sole discretion,
              without prior notice, if you violate these Terms or our Acceptable Use Policy, or if required by law or
              security necessity.
            </p>
          </section>

          {/* Section 10 */}
          <section className="space-y-3 pb-8">
            <h2 className="text-xl font-display text-ink font-medium tracking-tight flex items-center gap-2">
              <span className="text-accent font-mono text-sm">10.</span>
              Governing Law & Inquiries
            </h2>
            <p>
              These Terms shall be governed by and construed in accordance with the laws of the State of Delaware,
              without regard to conflict of law principles.
            </p>
            <p>
              If you have any questions concerning these Terms, please contact RoleFlow Legal at:
            </p>
            <div className="p-4 rounded-xl bg-app border border-line flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-ink">RoleFlow Legal & Support</p>
                <p className="text-xs text-ink/75">Email: support@roleflow.site</p>
              </div>
              <a
                href="mailto:support@roleflow.site"
                className="text-xs px-3 py-1.5 rounded-lg bg-card hover:bg-card text-ink transition-colors border border-line"
              >
                Contact Support
              </a>
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
