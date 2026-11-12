import React from "react";
import Link from "next/link";
import { Logo } from "./Logo";
import { Mail } from "lucide-react";

export const Footer: React.FC = () => {
  return (
    <footer className="w-full border-t border-line bg-app text-muted">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10 md:gap-8">
          <div className="col-span-2 space-y-4">
            <Link href="/" className="inline-block">
              <Logo size={28} />
            </Link>
            <p className="max-w-xs text-sm leading-relaxed">
              An AI assistant for questions, writing, and software engineering, with live previews for the code it writes.
            </p>
          </div>

          <div className="space-y-4">
            <h4 className="text-xs font-medium text-ink">Product</h4>
            <ul className="space-y-3 text-sm">
              <li>
                <Link href="/chat" className="inline-flex min-h-10 items-center hover:text-ink transition-colors">
                  Open RoleFlow
                </Link>
              </li>
              <li>
                <a href="/#features" className="inline-flex min-h-10 items-center hover:text-ink transition-colors">
                  Features
                </a>
              </li>
              <li>
                <a href="/#models" className="inline-flex min-h-10 items-center hover:text-ink transition-colors">
                  Models
                </a>
              </li>
              <li>
                <a href="/#faq" className="inline-flex min-h-10 items-center hover:text-ink transition-colors">
                  FAQ
                </a>
              </li>
            </ul>
          </div>

          <div className="space-y-4">
            <h4 className="text-xs font-medium text-ink">Legal</h4>
            <ul className="space-y-3 text-sm">
              <li>
                <Link href="/terms" className="inline-flex min-h-10 items-center hover:text-ink transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="inline-flex min-h-10 items-center hover:text-ink transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/acceptable-use" className="inline-flex min-h-10 items-center hover:text-ink transition-colors">
                  Acceptable Use
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col-reverse gap-4 border-t border-line pt-6 text-xs sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 RoleFlow, Inc. All rights reserved.</p>
          <a
            href="mailto:support@roleflow.site"
            className="inline-flex min-h-10 items-center gap-2 hover:text-ink transition-colors"
          >
            <Mail className="h-3.5 w-3.5" />
            support@roleflow.site
          </a>
        </div>
      </div>
    </footer>
  );
};
