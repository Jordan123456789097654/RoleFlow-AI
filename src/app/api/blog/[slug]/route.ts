import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * Public Blog API: Retrieves a single published blog post by slug.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    if (!slug) {
      return NextResponse.json({ error: "Slug is required." }, { status: 400 });
    }

    const post = await db.getBlogPost(slug);
    if (!post || !post.isPublished) {
      return NextResponse.json({ error: "Article not found." }, { status: 404 });
    }

    return NextResponse.json({ success: true, post });
  } catch (error: any) {
    console.error("Public blog get error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to load article." },
      { status: 500 }
    );
  }
}
