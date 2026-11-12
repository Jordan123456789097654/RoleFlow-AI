import React from "react";
import Link from "next/link";
import { Logo } from "./Logo";
import { ArrowUpRight, Mail, ShieldCheck, Sparkles, Terminal } from "lucide-react";

export const Footer: React.FC = () => {
  return (
    <footer className="w-full bg-[#0e0e0d] border-t border-[#222120] text-[#9b9a97] transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 lg:gap-8 mb-16">
          {/* Brand Info */}
          <div className="lg:col-span-2 space-y-5">
            <Link href="/" className="inline-block hover:opacity-90 transition-opacity">
              <Logo size={32} />
            </Link>
            <p className="text-sm leading-relaxed text-[#8a8984] max-w-sm">
              RoleFlow is an independent, high-precision artificial intelligence platform
              engineered for software architecture, intellectual exploration, and instant
              interactive artifact creation.
            </p>
            <div className="flex items-center gap-3 pt-2">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#171615] border border-[#262523] text-xs text-[#a3a29d]">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Frontier Cluster: Operational</span>
              </div>
            </div>
          </div>

          {/* Column 1: Product */}
          <div className="space-y-4">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[#d5d4ce]">
              Product
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link href="/chat" className="hover:text-[#f4f4f0] transition-colors flex items-center gap-1">
                  Launch RoleFlow
                  <ArrowUpRight className="w-3 h-3 text-[#d97706]" />
                </Link>
              </li>
              <li>
                <a href="/#features" className="hover:text-[#f4f4f0] transition-colors">
                  Claude Artifacts
                </a>
              </li>
              <li>
                <a href="/#models" className="hover:text-[#f4f4f0] transition-colors">
                  Genesis 1.0 (Flagship 120B)
                </a>
              </li>
              <li>
                <a href="/#models" className="hover:text-[#f4f4f0] transition-colors">
                  Flash 1.0 (Ultra-Fast)
                </a>
              </li>
              <li>
                <a href="/#pricing" className="hover:text-[#f4f4f0] transition-colors">
                  Pricing & Quotas
                </a>
              </li>
              <li>
                <a href="/#features" className="hover:text-[#f4f4f0] transition-colors">
                  Project Workspaces
                </a>
              </li>
            </ul>
          </div>

          {/* Column 2: Legal */}
          <div className="space-y-4">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[#d5d4ce]">
              Legal & Trust
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link href="/terms" className="hover:text-[#f4f4f0] transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-[#f4f4f0] transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/acceptable-use" className="hover:text-[#f4f4f0] transition-colors">
                  Acceptable Use Policy
                </Link>
              </li>
              <li>
                <span className="inline-flex items-center gap-1.5 text-xs text-[#706f6b]">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500/80" />
                  Zero Training on Private Chats
                </span>
              </li>
              <li>
                <span className="inline-flex items-center gap-1.5 text-xs text-[#706f6b]">
                  <Terminal className="w-3.5 h-3.5 text-[#d97706]/80" />
                  Client Sandboxed Sandbox
                </span>
              </li>
            </ul>
          </div>

          {/* Column 3: Company & Contact */}
          <div className="space-y-4">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[#d5d4ce]">
              Company & Help
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <a
                  href="mailto:support@roleflow.site"
                  className="hover:text-[#f4f4f0] transition-colors flex items-center gap-1.5"
                >
                  <Mail className="w-3.5 h-3.5 text-[#d97706]" />
                  <span>support@roleflow.site</span>
                </a>
              </li>
              <li>
                <a href="/#models" className="hover:text-[#f4f4f0] transition-colors">
                  Model Architecture
                </a>
              </li>
              <li>
                <a href="/#faq" className="hover:text-[#f4f4f0] transition-colors">
                  Frequently Asked Questions
                </a>
              </li>
              <li>
                <a
                  href="https://resend.com"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-[#f4f4f0] transition-colors flex items-center gap-1 text-xs text-[#7d7c78]"
                >
                  Secured with Resend OTP
                  <ArrowUpRight className="w-3 h-3" />
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-[#1e1d1c] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#757470]">
          <div className="flex flex-wrap items-center gap-6">
            <p>© 2026 RoleFlow, Inc. All rights reserved.</p>
            <div className="flex items-center gap-4">
              <Link href="/terms" className="hover:text-[#bbb9b3] transition-colors">
                Terms
              </Link>
              <span className="text-[#3a3937]">•</span>
              <Link href="/privacy" className="hover:text-[#bbb9b3] transition-colors">
                Privacy
              </Link>
              <span className="text-[#3a3937]">•</span>
              <Link href="/acceptable-use" className="hover:text-[#bbb9b3] transition-colors">
                Acceptable Use
              </Link>
            </div>
          </div>
          <div className="flex items-center gap-2 text-[#686763]">
            <span>Engineered with high-precision neural weights</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
