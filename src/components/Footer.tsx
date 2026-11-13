import React from "react";
import Link from "next/link";
import { Logo } from "./Logo";
import { ArrowRight, ArrowUp, Mail } from "lucide-react";

type FooterLink = { label: string; href: string; external?: boolean };

const PRODUCT_LINKS: FooterLink[] = [
  { label: "Open RoleFlow", href: "/chat" },
  { label: "Features", href: "/#features" },
  { label: "Models", href: "/#models" },
  { label: "Blog", href: "/blog" },
  { label: "FAQ", href: "/#faq" },
  { label: "System status", href: "https://status.roleflow.site", external: true },
];

const DEVELOPER_LINKS: FooterLink[] = [{ label: "API keys", href: "/docs/api-keys" }];

const LEGAL_LINKS: FooterLink[] = [
  { label: "Terms of Service", href: "/terms" },
  { label: "Privacy Policy", href: "/privacy" },
  { label: "Acceptable Use", href: "/acceptable-use" },
  { label: "AI Output Policy", href: "/ai-output" },
  { label: "Cookie Policy", href: "/cookies" },
  { label: "Moderation & appeals", href: "/moderation" },
  { label: "Law enforcement", href: "/law-enforcement" },
];

const linkClass =
  "rf-link inline-flex min-h-9 items-center text-sm text-muted transition-colors duration-200 hover:text-ink focus-visible:outline-none focus-visible:text-ink";

function FooterLinkItem({ link }: { link: FooterLink }) {
  if (link.external) {
    return (
      <a href={link.href} target="_blank" rel="noopener noreferrer" className={linkClass}>
        {link.label}
      </a>
    );
  }
  if (link.href.startsWith("/#")) {
    return (
      <a href={link.href} className={linkClass}>
        {link.label}
      </a>
    );
  }
  return (
    <Link href={link.href} className={linkClass}>
      {link.label}
    </Link>
  );
}

function FooterColumn({ title, links }: { title: string; links: FooterLink[] }) {
  return (
    <nav aria-label={title} className="space-y-3">
      <h4 className="text-xs font-medium uppercase tracking-[0.14em] text-ink/80">{title}</h4>
      <ul className="space-y-1">
        {links.map((link) => (
          <li key={link.label}>
            <FooterLinkItem link={link} />
          </li>
        ))}
      </ul>
    </nav>
  );
}

export const Footer: React.FC = () => {
  return (
    <footer className="relative w-full overflow-hidden border-t border-line bg-app text-muted">
      {/* Ember glow behind the footer, drifting slowly */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-40 left-1/2 h-80 w-[46rem] -translate-x-1/2 rounded-full opacity-60 blur-3xl"
        style={{
          background: "radial-gradient(closest-side, rgb(var(--c-accent) / 0.16), transparent)",
          animation: "rf-drift 14s ease-in-out infinite alternate",
        }}
      />

      <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* Call to action band */}
        <div className="flex flex-col items-start justify-between gap-6 border-b border-line py-12 sm:flex-row sm:items-center">
          <div className="max-w-md">
            <p className="font-display text-2xl font-normal tracking-tight text-ink sm:text-3xl">
              Start with a question. Finish with a file.
            </p>
            <p className="mt-2 text-sm leading-relaxed">
              Chat, write, and build in one place. Every page of code it writes can be previewed and downloaded.
            </p>
          </div>
          <Link
            href="/chat"
            className="rf-btn rf-btn-primary inline-flex min-h-11 items-center gap-2 rounded-lg bg-accent px-5 text-sm font-semibold text-on-accent"
          >
            <span>Start chatting</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {/* Link grid */}
        <div className="grid grid-cols-2 gap-x-8 gap-y-10 py-12 md:grid-cols-5 md:gap-8">
          <div className="col-span-2 space-y-5">
            <Link href="/" className="inline-block" aria-label="RoleFlow home">
              <Logo size={28} />
            </Link>
            <p className="max-w-xs text-sm leading-relaxed">
              An AI assistant for questions, writing, and software engineering, with live previews for the code it writes.
            </p>
            <a
              href="mailto:support@roleflow.site"
              className="rf-link inline-flex min-h-9 items-center gap-2 text-sm text-muted transition-colors hover:text-ink"
            >
              <Mail className="h-3.5 w-3.5" aria-hidden="true" />
              support@roleflow.site
            </a>
          </div>

          <FooterColumn title="Product" links={PRODUCT_LINKS} />
          <FooterColumn title="Developers" links={DEVELOPER_LINKS} />
          <FooterColumn title="Legal" links={LEGAL_LINKS} />
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col-reverse gap-4 border-t border-line py-6 text-xs sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 RoleFlow, Inc. All rights reserved.</p>

          <div className="flex items-center gap-5">
            <a
              href="https://status.roleflow.site"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-9 items-center gap-2 rounded-full border border-line bg-card px-3 transition-colors hover:text-ink"
            >
              <span className="rf-live-dot relative inline-flex h-1.5 w-1.5 text-emerald-500">
                <span className="relative block h-1.5 w-1.5 rounded-full bg-current" />
              </span>
              <span>System status</span>
            </a>

            <a
              href="#top"
              aria-label="Back to top"
              className="rf-btn inline-flex h-9 w-9 items-center justify-center rounded-full border border-line bg-card text-muted hover:text-ink"
            >
              <ArrowUp className="h-3.5 w-3.5" aria-hidden="true" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};
