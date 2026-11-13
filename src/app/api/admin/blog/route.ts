import { NextRequest, NextResponse } from "next/server";
import { db, BlogPostRecord } from "@/lib/db";
import { getSessionFromRequest } from "@/lib/auth";
import { isEmailIcon } from "@/lib/email-icons";
import { BLOG_CATEGORIES } from "@/lib/blog";

export const dynamic = "force-dynamic";

function unauthorized() {
  return NextResponse.json({ error: "Administrative privileges required." }, { status: 403 });
}

function clean(value: unknown, max: number): string {
  return typeof value === "string" ? value.replace(/\r\n/g, "\n").trim().slice(0, max) : "";
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 100)
    .replace(/^-+|-+$/g, "");
}

/** Admin only. Lists all blog posts (published & drafts). */
export async function GET(req: NextRequest) {
  const session = getSessionFromRequest(req);
  if (!session?.isAdmin) return unauthorized();

  try {
    const posts = await db.listBlogPosts(false);
    return NextResponse.json({ success: true, posts });
  } catch (error: any) {
    console.error("Admin blog list error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to load blog posts." },
      { status: 500 }
    );
  }
}

/**
 * Admin only. Creates or updates a blog post.
 * NOTE: Blog posts publish strictly to the web and DO NOT send broadcast or transactional emails.
 */
export async function POST(req: NextRequest) {
  const session = getSessionFromRequest(req);
  if (!session?.isAdmin) return unauthorized();

  let raw: any;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ error: "Request body must be JSON." }, { status: 400 });
  }

  const title = clean(raw?.title, 200);
  const summary = clean(raw?.summary, 600);
  const content = clean(raw?.content, 100000);
  const category = clean(raw?.category, 60);
  const icon = typeof raw?.icon === "string" ? raw.icon : "sparkle";
  const author = clean(raw?.author, 100) || "Jordan Daniels";
  const authorRole = clean(raw?.authorRole, 100) || "Founder & Lead Architect";
  const isPublished = Boolean(raw?.isPublished);
  const tags = Array.isArray(raw?.tags)
    ? raw.tags.map((t: unknown) => clean(t, 40)).filter(Boolean)
    : [];

  if (!title) return NextResponse.json({ error: "Title is required." }, { status: 400 });
  if (title.length < 3) return NextResponse.json({ error: "Title must be at least 3 characters." }, { status: 400 });
  if (!summary) return NextResponse.json({ error: "Summary is required." }, { status: 400 });
  if (content.length < 20) return NextResponse.json({ error: "Content must be at least 20 characters." }, { status: 400 });
  if (!isEmailIcon(icon)) return NextResponse.json({ error: "Invalid vector icon chosen." }, { status: 400 });

  const validCategories = BLOG_CATEGORIES.map((c) => c.id);
  const safeCategory = validCategories.includes(category as any) ? category : "announcements";

  let slug = clean(raw?.id || raw?.slug, 120);
  if (!slug) {
    slug = slugify(title);
  } else {
    slug = slugify(slug);
  }

  if (!slug) {
    slug = `post-${Date.now().toString(36)}`;
  }

  // Calculate read time
  const wordCount = content.split(/\s+/).filter(Boolean).length;
  const readMinutes = Math.max(1, Math.ceil(wordCount / 200));
  const readTime = `${readMinutes} min read`;

  const now = new Date().toISOString();
  const publishedAt = clean(raw?.publishedAt, 40) || now;

  const postRecord: BlogPostRecord = {
    id: slug,
    title,
    summary,
    content,
    category: safeCategory,
    icon,
    author,
    authorRole,
    readTime,
    publishedAt,
    isPublished,
    tags,
    updatedAt: now,
  };

  try {
    const saved = await db.upsertBlogPost(postRecord);
    return NextResponse.json({ success: true, post: saved });
  } catch (error: any) {
    console.error("Admin blog upsert error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to save blog post." },
      { status: 500 }
    );
  }
}

/** Admin only. Deletes a blog post: DELETE /api/admin/blog?id=... */
export async function DELETE(req: NextRequest) {
  const session = getSessionFromRequest(req);
  if (!session?.isAdmin) return unauthorized();

  const id = req.nextUrl.searchParams.get("id") || "";
  if (!id) {
    return NextResponse.json({ error: "Blog post ID is required." }, { status: 400 });
  }

  try {
    const deleted = await db.deleteBlogPost(id);
    return NextResponse.json({ success: deleted });
  } catch (error: any) {
    console.error("Admin blog delete error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to delete blog post." },
      { status: 500 }
    );
  }
}
