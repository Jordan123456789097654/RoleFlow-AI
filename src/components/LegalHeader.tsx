import React from "react";
import Link from "next/link";
import { Logo } from "./Logo";
import { ArrowLeft } from "lucide-react";

interface LegalHeaderProps {
  currentPage?: "terms" | "privacy" | "acceptable-use";
}

const LEGAL_LINKS = [
  { href: "/terms", label: "Terms", key: "terms" },
  { href: "/privacy", label: "Privacy", key: "privacy" },
  { href: "/acceptable-use", label: "Acceptable Use", key: "acceptable-use" },
] as const;

export const LegalHeader: React.FC<LegalHeaderProps> = ({ currentPage }) => {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-line bg-app/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            aria-label="Back to home"
            className="inline-flex min-h-10 min-w-10 items-center justify-center rounded-lg text-muted transition-colors hover:bg-hover hover:text-ink"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <Link href="/" className="inline-flex items-center">
            <Logo size={24} />
          </Link>
        </div>

        <nav className="hidden items-center gap-1 md:flex">
          {LEGAL_LINKS.map((item) => (
            <Link
              key={item.key}
              href={item.href}
              aria-current={currentPage === item.key ? "page" : undefined}
              className={`rounded-lg px-3 py-2 text-sm transition-colors ${
                currentPage === item.key ? "bg-hover text-ink" : "text-muted hover:text-ink"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <Link
          href="/chat"
          className="inline-flex min-h-10 items-center rounded-lg bg-accent px-4 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
        >
          Open RoleFlow
        </Link>
      </div>
    </header>
  );
};
