import React from "react";
import Link from "next/link";
import { Logo } from "./Logo";
import { ArrowLeft, ArrowRight, Shield } from "lucide-react";

interface LegalHeaderProps {
  currentPage?: "terms" | "privacy" | "acceptable-use";
}

export const LegalHeader: React.FC<LegalHeaderProps> = ({ currentPage }) => {
  return (
    <header className="sticky top-0 z-50 w-full bg-[#141413]/90 backdrop-blur-md border-b border-[#242321]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link
            href="/"
            className="flex items-center gap-2 text-xs font-medium text-[#9b9a97] hover:text-[#f4f4f0] transition-colors py-1 px-2.5 rounded-lg hover:bg-[#1f1e1d] border border-transparent hover:border-[#2d2c2a]"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Home</span>
          </Link>

          <div className="h-4 w-px bg-[#2b2a28] hidden sm:block" />

          <Link href="/" className="flex items-center gap-2 hover:opacity-90 transition-opacity">
            <Logo size={24} />
          </Link>
        </div>

        {/* Center navigation among legal docs */}
        <nav className="hidden md:flex items-center gap-1 bg-[#1a1918] p-1 rounded-xl border border-[#2b2a28] text-xs">
          <Link
            href="/terms"
            className={`px-3 py-1.5 rounded-lg transition-colors font-medium ${
              currentPage === "terms"
                ? "bg-[#282725] text-[#f4f4f0] shadow-sm"
                : "text-[#8e8d89] hover:text-[#d4d3ce]"
            }`}
          >
            Terms of Service
          </Link>
          <Link
            href="/privacy"
            className={`px-3 py-1.5 rounded-lg transition-colors font-medium ${
              currentPage === "privacy"
                ? "bg-[#282725] text-[#f4f4f0] shadow-sm"
                : "text-[#8e8d89] hover:text-[#d4d3ce]"
            }`}
          >
            Privacy Policy
          </Link>
          <Link
            href="/acceptable-use"
            className={`px-3 py-1.5 rounded-lg transition-colors font-medium ${
              currentPage === "acceptable-use"
                ? "bg-[#282725] text-[#f4f4f0] shadow-sm"
                : "text-[#8e8d89] hover:text-[#d4d3ce]"
            }`}
          >
            Acceptable Use
          </Link>
        </nav>

        {/* Right CTA */}
        <div className="flex items-center gap-3">
          <Link
            href="/chat"
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#d97706] hover:bg-[#b45309] text-white text-xs font-medium transition-colors shadow-sm"
          >
            <span>Launch RoleFlow</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </header>
  );
};
