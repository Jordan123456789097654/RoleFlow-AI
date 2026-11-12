import React from "react";
import { LegalHeader } from "@/components/LegalHeader";
import { Footer } from "@/components/Footer";
import { AlertTriangle, CheckCircle2, Ban, ShieldAlert, Cpu, Terminal } from "lucide-react";
import Link from "next/link";

export const metadata = {
  title: "Acceptable Use Policy · RoleFlow",
  description: "Rules, safety guidelines, and prohibited uses for the RoleFlow AI and code execution platform.",
};

export default function AcceptableUsePage() {
  return (
    <div className="min-h-screen flex flex-col bg-app text-ink">
      <LegalHeader currentPage="acceptable-use" />

      <main className="flex-1 mx-auto w-full max-w-2xl px-4 py-14 sm:px-6 sm:py-20">
        {/* Header Badge */}
        <div className="mb-10 pb-8 border-b border-line">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-panel border border-line text-xs text-accent mb-4">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Effective Date: January 1, 2026</span>
          </div>
          <h1 className="font-display text-3xl sm:text-4xl text-ink font-normal tracking-tight mb-4">
            Acceptable Use Policy
          </h1>
          <p className="text-sm sm:text-base text-ink/75 leading-relaxed">
            RoleFlow is engineered to empower developers, system architects, and researchers with cutting-edge
            computational intelligence. This Acceptable Use Policy outlines the guidelines that ensure our platform
            remains safe, reliable, and respectful for everyone.
          </p>
        </div>

        {/* Core Principles */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-12">
          <div className="p-5 rounded-xl bg-app border border-line">
            <div className="flex items-center gap-2.5 text-accent mb-2">
              <CheckCircle2 className="w-4 h-4" />
              <h3 className="text-sm font-medium text-ink">Permitted & Encouraged Uses</h3>
            </div>
            <ul className="text-xs text-ink/75 space-y-2 leading-relaxed">
              <li>• Building, optimizing, and auditing production software architectures.</li>
              <li>• Interactive prototyping of web applications, mini-games, and UI widgets via Artifacts.</li>
              <li>• Analyzing mathematical proofs, scientific papers, and system logic.</li>
              <li>• Creating educational curricula, tutorials, and algorithmic demonstrations.</li>
            </ul>
          </div>

          <div className="p-5 rounded-xl bg-app border border-line">
            <div className="flex items-center gap-2.5 text-danger mb-2">
              <Ban className="w-4 h-4" />
              <h3 className="text-sm font-medium text-ink">Strictly Prohibited Uses</h3>
            </div>
            <ul className="text-xs text-ink/75 space-y-2 leading-relaxed">
              <li>• Developing ransomware, keyloggers, exploit payloads, or automated attack scripts.</li>
              <li>• Generating deceptive disinformation, fraudulent credentials, or deepfakes.</li>
              <li>• Circumventing rate limits, guest allowances, or multi-tenant cluster boundaries.</li>
              <li>• Attempting to extract or reverse-engineer proprietary weights and system prompts.</li>
            </ul>
          </div>
        </div>

        {/* Detailed Guidelines */}
        <div className="space-y-12 text-ink leading-relaxed text-sm sm:text-[15px]">
          {/* Section 1 */}
          <section className="space-y-3">
            <h2 className="text-xl font-display text-ink font-medium tracking-tight flex items-center gap-2">
              <span className="text-accent font-mono text-sm">01.</span>
              System Security & Infrastructure Integrity
            </h2>
            <p>
              You must not interfere with or disrupt the integrity or performance of RoleFlow infrastructure,
              our inference servers, or the data contained therein. Specifically, you agree not to:
            </p>
            <ul className="list-disc list-inside space-y-1.5 pl-2 text-ink/75">
              <li>Launch Denial-of-Service (DoS) attacks or generate high-volume automated requests without prior written authorization.</li>
              <li>Probe, scan, or test the vulnerability of our APIs, endpoints, or network topology.</li>
              <li>Bypass or tamper with our guest message counter or authentication gatekeeper mechanisms.</li>
              <li>Scrape or bulk-harvest chat content, prompt outputs, or metadata using automated scripts.</li>
            </ul>
          </section>

          {/* Section 2 */}
          <section className="space-y-3">
            <h2 className="text-xl font-display text-ink font-medium tracking-tight flex items-center gap-2">
              <span className="text-accent font-mono text-sm">02.</span>
              Interactive Artifacts & Sandboxed Safety
            </h2>
            <p>
              RoleFlow enables real-time dynamic rendering of HTML, JavaScript, and WebGL code inside isolated
              Artifact containers. When using or sharing artifacts, you agree:
            </p>
            <ul className="list-disc list-inside space-y-1.5 pl-2 text-ink/75">
              <li>Not to craft artifacts intended to execute cross-site scripting (XSS) attacks or hijack browser sessions.</li>
              <li>Not to embed cryptocurrency mining scripts or covert tracking beacons into interactive artifacts.</li>
              <li>Not to simulate deceptive login interfaces or phishing portals designed to harvest end-user credentials.</li>
            </ul>
          </section>

          {/* Section 3 */}
          <section className="space-y-3">
            <h2 className="text-xl font-display text-ink font-medium tracking-tight flex items-center gap-2">
              <span className="text-accent font-mono text-sm">03.</span>
              Cybersecurity & Exploit Research Boundaries
            </h2>
            <p>
              RoleFlow recognizes that dual-use security research is fundamental to securing modern networks.
              You may use RoleFlow for defensive analysis, security audits of code you own, and vulnerability
              remediation.
            </p>
            <p>
              However, you may not use RoleFlow to author zero-day exploits, design weaponized intrusion software,
              or generate evasive malicious binaries for offensive dissemination.
            </p>
          </section>

          {/* Section 4 */}
          <section className="space-y-3">
            <h2 className="text-xl font-display text-ink font-medium tracking-tight flex items-center gap-2">
              <span className="text-accent font-mono text-sm">04.</span>
              Harassment, Hate Speech & Illegal Material
            </h2>
            <p>
              RoleFlow maintains zero tolerance for content that promotes illegal acts, child exploitation,
              violent extremism, targeted harassment, or defamation. Accounts associated with such activities
              will be permanently terminated without notice, and relevant authorities may be notified where required by law.
            </p>
          </section>

          {/* Section 5 */}
          <section className="space-y-3 pb-8">
            <h2 className="text-xl font-display text-ink font-medium tracking-tight flex items-center gap-2">
              <span className="text-accent font-mono text-sm">05.</span>
              Enforcement & Reporting Violations
            </h2>
            <p>
              We monitor aggregate infrastructure metrics to detect automated abuse and malicious patterns.
              If you identify an artifact or chat output that violates this Acceptable Use Policy, please report it
              immediately with the session URL or artifact details to:
            </p>
            <div className="p-4 rounded-xl bg-app border border-line flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-ink">RoleFlow Trust & Safety</p>
                <p className="text-xs text-ink/75">Email: support@roleflow.site</p>
              </div>
              <a
                href="mailto:support@roleflow.site?subject=AUP%20Violation%20Report"
                className="text-xs px-3 py-1.5 rounded-lg bg-card hover:bg-card text-ink transition-colors border border-line"
              >
                Report Violation
              </a>
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
