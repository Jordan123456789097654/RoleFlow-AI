import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { emailIconUrl } from "@/lib/email-icons";
import { BlogHeader } from "@/components/BlogHeader";
import { Footer } from "@/components/Footer";
import { FlowLine } from "@/components/FlowLine";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  ArrowLeft,
  ArrowRight,
  Calendar,
  Clock,
  Share2,
  Tag,
  User,
  Sparkles,
  BookOpen,
} from "lucide-react";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await db.getBlogPost(slug);

  if (!post || !post.isPublished) {
    return {
      title: "Article Not Found · RoleFlow Blog",
    };
  }

  return {
    title: `${post.title} · RoleFlow Engineering`,
    description: post.summary,
    authors: [{ name: post.author || "Jordan Daniels" }],
    openGraph: {
      title: post.title,
      description: post.summary,
      url: `https://roleflow.site/blog/${post.id}`,
      siteName: "RoleFlow",
      type: "article",
      publishedTime: post.publishedAt,
      authors: [post.author || "Jordan Daniels"],
      tags: post.tags,
      images: [
        {
          url: emailIconUrl(post.icon),
          width: 192,
          height: 192,
          alt: post.title,
        },
      ],
    },
    twitter: {
      card: "summary",
      title: post.title,
      description: post.summary,
      images: [emailIconUrl(post.icon)],
    },
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await db.getBlogPost(slug);

  if (!post || !post.isPublished) {
    notFound();
  }

  // Related articles
  const allPosts = await db.listBlogPosts(true);
  const relatedPosts = allPosts.filter((p) => p.id !== post.id).slice(0, 3);

  // Structured Data (JSON-LD) for Search Engines
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.summary,
    datePublished: post.publishedAt,
    dateModified: post.updatedAt || post.publishedAt,
    author: {
      "@type": "Person",
      name: post.author || "Jordan Daniels",
      jobTitle: post.authorRole || "Founder & Lead Architect",
    },
    publisher: {
      "@type": "Organization",
      name: "RoleFlow",
      url: "https://roleflow.site",
      logo: {
        "@type": "ImageObject",
        url: "https://roleflow.site/email/icon-rocket.png",
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `https://roleflow.site/blog/${post.id}`,
    },
  };

  return (
    <div className="min-h-screen flex flex-col bg-app text-ink">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <BlogHeader isArticle={true} />

      <main className="flex-1">
        {/* Article Header Container */}
        <header className="relative border-b border-line/80 py-12 sm:py-16">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -top-24 left-1/2 h-72 w-[42rem] -translate-x-1/2 rounded-full opacity-35 blur-3xl"
            style={{
              background: "radial-gradient(closest-side, rgb(var(--c-accent) / 0.16), transparent)",
            }}
          />

          <div className="relative mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            {/* Back link */}
            <div className="mb-8">
              <Link
                href="/blog"
                className="inline-flex items-center gap-2 text-xs font-medium text-muted hover:text-ink transition-colors"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Back to all dispatches
              </Link>
            </div>

            {/* Icon + Category Pill */}
            <div className="flex items-center gap-3 mb-6">
              <div className="h-12 w-12 rounded-2xl bg-card border border-line p-2.5 flex items-center justify-center shadow-sm">
                <img
                  src={emailIconUrl(post.icon)}
                  alt={post.icon}
                  className="h-full w-full object-contain"
                />
              </div>
              <div>
                <span className="rounded-full border border-accent/40 bg-accent/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-accent">
                  {post.category}
                </span>
              </div>
            </div>

            {/* Article Headline */}
            <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight text-ink leading-[1.15] mb-6">
              {post.title}
            </h1>

            {/* Summary Box */}
            <div className="rounded-2xl border-l-4 border-l-accent border-line/80 bg-card/60 p-4.5 sm:p-5 text-sm sm:text-base text-muted leading-relaxed mb-8 backdrop-blur-sm">
              {post.summary}
            </div>

            {/* Author & Meta Bar */}
            <div className="flex flex-wrap items-center justify-between gap-4 py-4 border-y border-line/60 text-xs text-muted">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-accent/20 border border-accent/40 flex items-center justify-center text-accent font-semibold text-xs">
                  JD
                </div>
                <div>
                  <div className="font-semibold text-ink">{post.author}</div>
                  <div className="text-[11px] text-muted">
                    {post.authorRole || "Founder & Lead Architect"}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4 text-xs">
                <span className="flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5" />
                  {new Date(post.publishedAt).toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5" />
                  {post.readTime}
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Article Body */}
        <article className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <div className="article-body text-ink text-base leading-relaxed [&_h1]:font-display [&_h1]:text-3xl [&_h1]:font-semibold [&_h1]:text-ink [&_h1]:mb-6 [&_h1]:mt-10 [&_h2]:mt-12 [&_h2]:mb-4 [&_h2]:font-display [&_h2]:text-2xl [&_h2]:font-semibold [&_h2]:text-ink [&_h2]:border-b [&_h2]:border-line/60 [&_h2]:pb-2.5 [&_h3]:mt-8 [&_h3]:mb-3 [&_h3]:font-display [&_h3]:text-xl [&_h3]:font-semibold [&_h3]:text-ink [&_p]:my-4 [&_p]:leading-relaxed [&_p]:text-ink/90 [&_ul]:my-5 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:space-y-2 [&_ul]:text-ink/90 [&_ol]:my-5 [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:space-y-2 [&_ol]:text-ink/90 [&_li]:my-1 [&_a]:text-accent [&_a]:underline [&_a]:underline-offset-4 [&_a]:hover:text-accent-hover [&_strong]:font-semibold [&_strong]:text-ink [&_code]:rounded-md [&_code]:bg-card [&_code]:border [&_code]:border-line [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-xs [&_code]:text-amber-300 [&_pre]:my-6 [&_pre]:rounded-2xl [&_pre]:border [&_pre]:border-line [&_pre]:bg-card [&_pre]:p-5 [&_pre]:overflow-x-auto [&_pre_code]:bg-transparent [&_pre_code]:border-0 [&_pre_code]:p-0 [&_pre_code]:text-ink/90 [&_blockquote]:my-6 [&_blockquote]:border-l-2 [&_blockquote]:border-accent [&_blockquote]:pl-5 [&_blockquote]:italic [&_blockquote]:text-muted [&_table]:my-6 [&_table]:w-full [&_table]:overflow-x-auto [&_table]:border-collapse [&_th]:border [&_th]:border-line [&_th]:bg-card [&_th]:px-4 [&_th]:py-2.5 [&_th]:text-left [&_th]:text-xs [&_th]:font-semibold [&_th]:text-ink [&_td]:border [&_td]:border-line [&_td]:px-4 [&_td]:py-2.5 [&_td]:text-xs [&_td]:text-ink/80 [&_hr]:my-10 [&_hr]:border-line/80">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{post.content}</ReactMarkdown>
          </div>

          {/* Tags */}
          {post.tags && post.tags.length > 0 && (
            <div className="mt-12 pt-6 border-t border-line/60">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-medium text-muted uppercase tracking-wider flex items-center gap-1.5 mr-2">
                  <Tag className="h-3.5 w-3.5" />
                  Filed Under:
                </span>
                {post.tags.map((tag) => (
                  <Link
                    key={tag}
                    href={`/blog?q=${encodeURIComponent(tag)}`}
                    className="rounded-lg border border-line bg-card px-2.5 py-1 text-xs text-muted hover:text-ink hover:border-line-hover transition-colors"
                  >
                    #{tag}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Author Card Footer */}
          <div className="mt-12 rounded-3xl border border-line bg-card/80 p-6 sm:p-8 backdrop-blur-sm">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 rounded-2xl bg-accent/20 border border-accent/40 flex items-center justify-center text-accent font-semibold text-lg shrink-0">
                  JD
                </div>
                <div>
                  <h3 className="font-display text-lg font-semibold text-ink">
                    {post.author || "Jordan Daniels"}
                  </h3>
                  <p className="text-xs text-accent font-medium">
                    {post.authorRole || "Founder & Lead Architect"} · RoleFlow
                  </p>
                  <p className="text-xs text-muted mt-1 max-w-md">
                    Building an engineering-first AI assistant designed for software builders, live code
                    sandboxing, and deep technical reasoning.
                  </p>
                </div>
              </div>

              <div className="shrink-0">
                <Link
                  href="/chat"
                  className="rf-btn rf-btn-primary inline-flex min-h-10 items-center gap-2 rounded-xl bg-accent px-4 text-xs font-semibold text-on-accent"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  Try RoleFlow v5
                </Link>
              </div>
            </div>
          </div>
        </article>

        {/* Decorative Wave Divider */}
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-4">
          <FlowLine className="opacity-70" />
        </div>

        {/* Related Articles Section */}
        {relatedPosts.length > 0 && (
          <section className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-12">
            <h3 className="text-xs font-medium uppercase tracking-[0.16em] text-muted mb-6">
              More From The Engineering Blog
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {relatedPosts.map((related) => (
                <Link
                  key={related.id}
                  href={`/blog/${related.id}`}
                  className="group flex flex-col justify-between rounded-2xl border border-line bg-card p-6 transition-all duration-200 hover:border-line-hover hover:-translate-y-0.5 hover:shadow-lg"
                >
                  <div>
                    <div className="flex items-center justify-between gap-3 mb-3">
                      <div className="h-9 w-9 rounded-xl bg-app border border-line p-1.5 flex items-center justify-center">
                        <img
                          src={emailIconUrl(related.icon)}
                          alt={related.icon}
                          className="h-full w-full object-contain"
                        />
                      </div>
                      <span className="text-[10px] font-medium uppercase tracking-wider text-accent">
                        {related.category}
                      </span>
                    </div>

                    <h4 className="font-display text-base font-semibold text-ink line-clamp-2 group-hover:text-accent transition-colors mb-2">
                      {related.title}
                    </h4>

                    <p className="text-xs text-muted line-clamp-2 mb-4">
                      {related.summary}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-line/60 text-[11px] text-muted">
                    <span>{related.readTime}</span>
                    <span className="group-hover:text-accent flex items-center gap-1 transition-colors">
                      Read article <ArrowRight className="h-3 w-3" />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>

      <Footer />
    </div>
  );
}
