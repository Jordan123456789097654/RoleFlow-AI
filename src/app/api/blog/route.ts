import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * Public Blog API: Lists all published blog posts.
 * Optional query parameter: ?category=<category_id>
 */
export async function GET(req: NextRequest) {
  try {
    const category = req.nextUrl.searchParams.get("category");
    let posts = await db.listBlogPosts(true);

    if (category && category !== "all") {
      posts = posts.filter((p) => p.category === category);
    }

    return NextResponse.json({ success: true, posts });
  } catch (error: any) {
    console.error("Public blog list error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to load blog posts." },
      { status: 500 }
    );
  }
}
