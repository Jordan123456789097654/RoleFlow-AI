import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import { groqChatCompletion, ModelMessage } from "@/lib/ai-engine";
import { EMAIL_ICONS, isEmailIcon, type EmailIconId } from "@/lib/email-icons";
import { BLOG_CATEGORIES, BlogCategory } from "@/lib/blog";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const AI_BLOG_MODEL = "openai/gpt-oss-120b";

function buildSystemPrompt(preferredCategory?: string): string {
  const categoriesList = BLOG_CATEGORIES.map((c) => `"${c.id}" (${c.label})`).join(", ");
  const iconsList = EMAIL_ICONS.map((i) => i.id).join(", ");

  return `You are Jordan Daniels, Founder & Lead Architect of RoleFlow, an engineering-first AI assistant with live interactive artifacts and multi-tier neural models.

You write technical, authentic, authoritative, and inspiring engineering blog posts for roleflow.site/blog.

Output rules:
- Reply with ONLY a JSON object, no commentary, no code fences, adhering strictly to this schema:
  {
    "title": "...",
    "slug": "...",
    "summary": "...",
    "content": "...",
    "category": "...",
    "icon": "...",
    "tags": ["...", "..."]
  }
- "title": Compelling technical title (under 90 chars).
- "slug": URL slug in kebab-case (e.g. "understanding-neural-routing").
- "summary": 1-2 sentence hook explaining the key takeaways (under 200 chars).
- "content": Full, rich markdown article (400 to 1200 words). Use clean headers (##, ###), bullet points, architectural explanations, code snippets or tables where relevant, and a genuine developer-centric voice. Sign off at the end with "— Jordan Daniels, Founder & Lead Architect".
- "category": Exactly one of: ${categoriesList}.${preferredCategory ? ` Preferred category: "${preferredCategory}".` : ""}
- "icon": Exactly one vector icon ID from: ${iconsList}. Pick the one that most specifically matches the article topic (e.g. "terminal", "rocket", "cpu", "code", "database", "server", "flame", "star", "pen", "shield", "bolt").
- "tags": Array of 3-5 concise topic tags.`;
}

function parseBlogJson(text: string): {
  title: string;
  slug: string;
  summary: string;
  content: string;
  category: BlogCategory;
  icon: EmailIconId;
  tags: string[];
} | null {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end <= start) return null;

  try {
    const obj = JSON.parse(text.slice(start, end + 1));
    if (typeof obj?.title !== "string" || typeof obj?.content !== "string") return null;

    const title = obj.title.trim().slice(0, 200);
    const content = obj.content.replace(/\r\n/g, "\n").trim().slice(0, 100000);
    const summary = typeof obj?.summary === "string" ? obj.summary.trim().slice(0, 600) : title;
    let slug = typeof obj?.slug === "string" ? obj.slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, "") : "";
    if (!slug) {
      slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
    }

    const categoryCandidate = typeof obj?.category === "string" ? obj.category : "announcements";
    const category: BlogCategory = BLOG_CATEGORIES.some((c) => c.id === categoryCandidate)
      ? (categoryCandidate as BlogCategory)
      : "announcements";

    const icon: EmailIconId = isEmailIcon(obj?.icon) ? obj.icon : "sparkle";
    const tags = Array.isArray(obj?.tags)
      ? obj.tags.map((t: unknown) => String(t).trim()).filter(Boolean).slice(0, 6)
      : ["Engineering", "RoleFlow"];

    if (!title || content.length < 50) return null;

    return { title, slug, summary, content, category, icon, tags };
  } catch {
    return null;
  }
}

/**
 * Admin only. Generates a drafted blog post using the AI engine.
 * Body: { prompt: string, category?: string }
 */
export async function POST(req: NextRequest) {
  const session = getSessionFromRequest(req);
  if (!session?.isAdmin) {
    return NextResponse.json({ error: "Administrative privileges required." }, { status: 403 });
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Request body must be JSON." }, { status: 400 });
  }

  const prompt = typeof body?.prompt === "string" ? body.prompt.trim() : "";
  if (prompt.length < 5 || prompt.length > 3000) {
    return NextResponse.json(
      { error: "Provide a blog article brief between 5 and 3000 characters." },
      { status: 400 }
    );
  }

  const preferredCategory = typeof body?.category === "string" ? body.category : undefined;

  const messages: ModelMessage[] = [
    { role: "system", content: buildSystemPrompt(preferredCategory) },
    { role: "user", content: `Write a high-quality technical blog post for this topic:\n\n${prompt}` },
  ];

  const reply = await groqChatCompletion({
    model: AI_BLOG_MODEL,
    messages,
    temperature: 0.5,
    maxTokens: 2500,
  });

  if (!reply) {
    return NextResponse.json(
      { error: "AI drafting is unavailable right now. Check the inference pool and try again." },
      { status: 503 }
    );
  }

  const draft = parseBlogJson(reply);
  if (!draft) {
    return NextResponse.json(
      { error: "The AI response could not be parsed as a structured blog post. Please try again." },
      { status: 502 }
    );
  }

  const wordCount = draft.content.split(/\s+/).filter(Boolean).length;
  const readMinutes = Math.max(1, Math.ceil(wordCount / 200));
  const readTime = `${readMinutes} min read`;

  return NextResponse.json({
    success: true,
    draft: {
      ...draft,
      author: "Jordan Daniels",
      authorRole: "Founder & Lead Architect",
      readTime,
      isPublished: true,
    },
  });
}
