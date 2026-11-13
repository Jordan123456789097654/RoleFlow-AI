import React from "react";
import Link from "next/link";
import { Logo } from "./Logo";
import { ArrowLeft, BookOpen } from "lucide-react";

interface BlogHeaderProps {
  currentCategory?: string;
  isArticle?: boolean;
}

export const BlogHeader: React.FC<BlogHeaderProps> = ({ currentCategory, isArticle = false }) => {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-line bg-app/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <Link
            href={isArticle ? "/blog" : "/"}
            aria-label={isArticle ? "Back to blog" : "Back to home"}
            className="inline-flex min-h-10 min-w-10 items-center justify-center rounded-lg text-muted transition-colors hover:bg-hover hover:text-ink"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <Link href="/" className="inline-flex items-center gap-2.5">
            <Logo size={24} />
            <span className="hidden sm:inline-block text-xs font-semibold uppercase tracking-wider text-muted font-mono">
              / blog
            </span>
          </Link>
        </div>

        <nav className="hidden items-center gap-1 md:flex">
          <Link
            href="/blog"
            className={`rounded-lg px-3 py-2 text-sm transition-colors ${
              !currentCategory ? "bg-hover text-ink" : "text-muted hover:text-ink"
            }`}
          >
            All Articles
          </Link>
          <Link
            href="/blog?category=announcements"
            className={`rounded-lg px-3 py-2 text-sm transition-colors ${
              currentCategory === "announcements" ? "bg-hover text-ink" : "text-muted hover:text-ink"
            }`}
          >
            Announcements
          </Link>
          <Link
            href="/blog?category=engineering"
            className={`rounded-lg px-3 py-2 text-sm transition-colors ${
              currentCategory === "engineering" ? "bg-hover text-ink" : "text-muted hover:text-ink"
            }`}
          >
            Engineering
          </Link>
          <Link
            href="/blog?category=architecture"
            className={`rounded-lg px-3 py-2 text-sm transition-colors ${
              currentCategory === "architecture" ? "bg-hover text-ink" : "text-muted hover:text-ink"
            }`}
          >
            Architecture
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href="/chat"
            className="rf-btn rf-btn-primary inline-flex min-h-10 items-center rounded-lg bg-accent px-4 text-sm font-semibold text-on-accent"
          >
            Open RoleFlow
          </Link>
        </div>
      </div>
    </header>
  );
};
