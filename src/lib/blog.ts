import { EmailIconId } from "@/lib/email-icons";

export type BlogCategory =
  | "announcements"
  | "engineering"
  | "architecture"
  | "product"
  | "tutorials"
  | "security";

export interface BlogCategoryMeta {
  id: BlogCategory;
  label: string;
  description: string;
}

export const BLOG_CATEGORIES: BlogCategoryMeta[] = [
  { id: "announcements", label: "Announcements", description: "Product updates, major releases, and company milestones." },
  { id: "engineering", label: "Engineering", description: "Deep dives into systems, runtime sandboxing, and execution." },
  { id: "architecture", label: "Architecture", description: "How we design neural routing, memory, and telemetry." },
  { id: "product", label: "Product & Design", description: "Crafting obsidian interfaces, motion systems, and developer UX." },
  { id: "tutorials", label: "Tutorials & Guides", description: "Practical guides to building with RoleFlow artifacts and APIs." },
  { id: "security", label: "Trust & Security", description: "Our protocols for privacy, zero-data retention, and compliance." },
];

export interface BlogPost {
  id: string; // URL slug, e.g. "introducing-roleflow-v5"
  title: string;
  summary: string;
  content: string; // Markdown text
  category: BlogCategory;
  icon: EmailIconId;
  author: string;
  authorRole?: string;
  readTime: string;
  publishedAt: string; // ISO date or display string
  isPublished: boolean;
  tags: string[];
  updatedAt?: string;
}

/** Curated blog posts. Kept empty by default for custom dispatches. */
export const SEED_BLOG_POSTS: BlogPost[] = [];
