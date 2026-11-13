import React from "react";
import Link from "next/link";
import { db, BlogPostRecord } from "@/lib/db";
import { BLOG_CATEGORIES, BlogCategory } from "@/lib/blog";
import { emailIconUrl } from "@/lib/email-icons";
import { BlogHeader } from "@/components/BlogHeader";
import { Footer } from "@/components/Footer";
import { FlowLine } from "@/components/FlowLine";
import { ArrowRight, Calendar, Clock, Tag, User } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Engineering Blog · RoleFlow",
  description:
    "Technical deep dives, systems architecture, and milestone updates from Founder & Lead Architect Jordan Daniels and the RoleFlow team.",
  openGraph: {
    title: "Engineering Blog · RoleFlow",
    description:
      "Technical deep dives, systems architecture, and milestone updates from Founder & Lead Architect Jordan Daniels and the RoleFlow team.",
    url: "https://roleflow.site/blog",
    siteName: "RoleFlow",
    type: "website",
  },
};

export default async function BlogIndexPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; q?: string }>;
}) {
  const { category, q } = await searchParams;
  const allPosts = await db.listBlogPosts(true);

  // Filter by category or search query if provided
  let filteredPosts = allPosts;
  if (category && category !== "all") {
    filteredPosts = filteredPosts.filter((p) => p.category === category);
  }
  if (q && q.trim()) {
    const query = q.toLowerCase().trim();
    filteredPosts = filteredPosts.filter(
      (p) =>
        p.title.toLowerCase().includes(query) ||
        p.summary.toLowerCase().includes(query) ||
        (p.tags || []).some((t) => t.toLowerCase().includes(query))
    );
  }

  const featured = filteredPosts[0];
  const gridPosts = filteredPosts.slice(1);

  return (
    <div className="min-h-screen flex flex-col bg-app text-ink">
      <BlogHeader currentCategory={category} />

      <main className="flex-1">
        {/* Blog Hero Section */}
        <section className="relative overflow-hidden border-b border-line/80 py-16 sm:py-20">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -top-24 left-1/2 h-72 w-[42rem] -translate-x-1/2 rounded-full opacity-40 blur-3xl"
            style={{
              background: "radial-gradient(closest-side, rgb(var(--c-accent) / 0.18), transparent)",
            }}
          />

          <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-3.5 py-1 text-xs font-medium text-accent mb-4">
              <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
              RoleFlow Technical Dispatches
            </div>
            <h1 className="font-display text-4xl sm:text-5xl font-semibold tracking-tight text-ink mb-4">
              Engineering & Architecture
            </h1>
            <p className="mx-auto max-w-2xl text-base text-muted sm:text-lg leading-relaxed">
              In-depth articles on neural cluster routing, sandboxed code execution, memory architecture,
              and our evolving developer experience. Authored by Jordan Daniels and the RoleFlow team.
            </p>

            {/* Category Filter Pills */}
            <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
              <Link
                href="/blog"
                className={`rounded-full px-4 py-1.5 text-xs font-medium transition-all ${
                  !category || category === "all"
                    ? "bg-accent text-on-accent shadow-sm"
                    : "border border-line bg-card text-muted hover:text-ink hover:border-line-hover"
                }`}
              >
                All Dispatches ({allPosts.length})
              </Link>
              {BLOG_CATEGORIES.map((c) => {
                const count = allPosts.filter((p) => p.category === c.id).length;
                if (count === 0 && category !== c.id) return null;
                const isSelected = category === c.id;
                return (
                  <Link
                    key={c.id}
                    href={`/blog?category=${c.id}`}
                    className={`rounded-full px-4 py-1.5 text-xs font-medium transition-all ${
                      isSelected
                        ? "bg-accent text-on-accent shadow-sm"
                        : "border border-line bg-card text-muted hover:text-ink hover:border-line-hover"
                    }`}
                  >
                    {c.label} ({count})
                  </Link>
                );
              })}
            </div>
          </div>
        </section>

        {/* Content Section */}
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16 space-y-12">
          {filteredPosts.length === 0 ? (
            <div className="rounded-2xl border border-line bg-card p-12 text-center">
              <h3 className="text-base font-semibold text-ink mb-2">No articles found</h3>
              <p className="text-sm text-muted mb-6">
                There are no published articles matching the chosen filter.
              </p>
              <Link
                href="/blog"
                className="inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2 text-sm font-medium text-on-accent"
              >
                View all articles
              </Link>
            </div>
          ) : (
            <>
              {/* Featured Post Card */}
              {featured && (
                <div className="group relative rounded-3xl border border-line bg-card/70 p-6 sm:p-10 backdrop-blur-sm transition-all duration-300 hover:border-accent/50 hover:shadow-2xl hover:shadow-accent/5">
                  <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
                    <div className="flex-1 space-y-4">
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="rounded-full border border-accent/40 bg-accent/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-accent">
                          Featured Dispatch · {featured.category}
                        </span>
                        <span className="flex items-center gap-1 text-xs text-muted">
                          <Calendar className="h-3.5 w-3.5" />
                          {new Date(featured.publishedAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </span>
                        <span className="flex items-center gap-1 text-xs text-muted">
                          <Clock className="h-3.5 w-3.5" />
                          {featured.readTime}
                        </span>
                      </div>

                      <h2 className="font-display text-2xl sm:text-3xl lg:text-4xl font-semibold text-ink leading-tight group-hover:text-accent transition-colors">
                        <Link href={`/blog/${featured.id}`}>{featured.title}</Link>
                      </h2>

                      <p className="text-sm sm:text-base text-muted leading-relaxed max-w-3xl">
                        {featured.summary}
                      </p>

                      <div className="flex flex-wrap items-center gap-4 pt-2">
                        <div className="flex items-center gap-2 text-xs font-medium text-ink">
                          <div className="h-7 w-7 rounded-full bg-accent/20 border border-accent/40 flex items-center justify-center text-accent font-semibold text-xs">
                            JD
                          </div>
                          <div>
                            <div>{featured.author}</div>
                            <div className="text-[10px] text-muted">{featured.authorRole || "Founder & Lead Architect"}</div>
                          </div>
                        </div>

                        {featured.tags && (
                          <div className="flex flex-wrap gap-1.5 ml-auto">
                            {featured.tags.map((tag) => (
                              <span
                                key={tag}
                                className="rounded-md border border-line bg-app px-2 py-0.5 text-[11px] text-muted"
                              >
                                #{tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="pt-2">
                        <Link
                          href={`/blog/${featured.id}`}
                          className="inline-flex items-center gap-2 text-sm font-semibold text-accent hover:underline"
                        >
                          Read full article
                          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                        </Link>
                      </div>
                    </div>

                    {/* Vector Icon Presentation Badge */}
                    <div className="shrink-0 self-center lg:self-auto">
                      <div className="h-28 w-28 sm:h-36 sm:w-36 rounded-3xl border border-line/80 bg-app/80 p-5 sm:p-7 flex items-center justify-center shadow-inner group-hover:border-accent/40 transition-colors">
                        <img
                          src={emailIconUrl(featured.icon)}
                          alt={featured.title}
                          className="h-full w-full object-contain filter drop-shadow-[0_4px_12px_rgba(245,158,11,0.25)]"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Decorative FlowLine Wave Divider */}
              <div className="py-2">
                <FlowLine className="opacity-70" />
              </div>

              {/* Grid of Remaining Articles */}
              {gridPosts.length > 0 && (
                <div>
                  <h3 className="text-xs font-medium uppercase tracking-[0.16em] text-muted mb-6">
                    Recent Technical Articles
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {gridPosts.map((post) => (
                      <Link
                        key={post.id}
                        href={`/blog/${post.id}`}
                        className="group flex flex-col justify-between rounded-2xl border border-line bg-card p-6 transition-all duration-200 hover:border-line-hover hover:-translate-y-0.5 hover:shadow-lg"
                      >
                        <div>
                          <div className="flex items-center justify-between gap-3 mb-4">
                            <div className="h-11 w-11 rounded-xl bg-app border border-line p-2 flex items-center justify-center">
                              <img
                                src={emailIconUrl(post.icon)}
                                alt={post.icon}
                                className="h-full w-full object-contain"
                              />
                            </div>
                            <span className="text-[11px] font-medium uppercase tracking-wider text-accent">
                              {post.category}
                            </span>
                          </div>

                          <h4 className="font-display text-lg font-semibold text-ink leading-snug group-hover:text-accent transition-colors line-clamp-2 mb-2">
                            {post.title}
                          </h4>

                          <p className="text-xs text-muted leading-relaxed line-clamp-3 mb-4">
                            {post.summary}
                          </p>
                        </div>

                        <div>
                          {post.tags && post.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mb-4">
                              {post.tags.slice(0, 3).map((tag) => (
                                <span
                                  key={tag}
                                  className="rounded bg-app border border-line px-1.5 py-0.5 text-[10px] text-muted"
                                >
                                  #{tag}
                                </span>
                              ))}
                            </div>
                          )}

                          <div className="flex items-center justify-between pt-3 border-t border-line/60 text-[11px] text-muted">
                            <span>{post.readTime}</span>
                            <span>
                              {new Date(post.publishedAt).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })}
                            </span>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
