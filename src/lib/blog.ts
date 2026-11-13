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
  { id: "announcements", label: "Announcements", description: "Product updates, launches, and company milestones." },
  { id: "engineering", label: "Engineering", description: "Deep dives into systems, performance, and code execution." },
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

/** Initial curated blog posts by Founder & Lead Architect Jordan Daniels */
export const SEED_BLOG_POSTS: BlogPost[] = [
  {
    id: "introducing-roleflow-v5",
    title: "Introducing RoleFlow v5.0: The Engineering-First AI Assistant",
    summary:
      "A complete walkthrough of our bespoke visual identity, scroll-driven motion engine, expanded reasoning token ceilings, and zero-flicker default dark mode.",
    category: "announcements",
    icon: "rocket",
    author: "Jordan Daniels",
    authorRole: "Founder & Lead Architect",
    readTime: "5 min read",
    publishedAt: "2026-11-13T10:00:00.000Z",
    isPublished: true,
    tags: ["Launch", "RoleFlow v5", "Design System", "Reasoning"],
    content: `
# Introducing RoleFlow v5.0

Today, we are thrilled to unveil **RoleFlow v5.0**, a milestone release that establishes our permanent visual identity and marks a significant leap in our software engineering reasoning capabilities.

When we set out to build RoleFlow, our conviction was simple: **modern builders need an assistant that doesn't just talk, but actually builds.** General chatbots give you fragmented code snippets and require endless copy-pasting. RoleFlow was designed from the ground up to render live, interactive software alongside your conversation.

---

## What’s New in Version 5.0

### 1. Bespoke Brand Identity & The FlowLine Wave
We have moved away from conventional chatbot aesthetics toward an **Obsidian & Molten Amber** palette inspired by high-performance developer command centers:
- **Typography:** Headlines now feature **Bricolage Grotesque**, paired with **Geist** for crisp, effortless readability and **Martian Mono** for precise code and telemetry.
- **The FlowLine Wave:** A custom SVG dual-wave divider that traces our signature wave across the platform with subtle amber-to-ember gradients.
- **True Default Dark Mode:** Pre-rendered directly on the server (\`<html class="dark">\`), ensuring instant dark mode loading with zero white flash on any device.

### 2. The v5 Motion System
Modern web software should feel tactile and responsive. RoleFlow v5 introduces a comprehensive, lightweight CSS motion system:
- **Scroll-driven section reveals** (\`.rf-reveal\`) that smoothly lift content as it enters the viewport.
- **Interactive tactile micro-interactions** on buttons (\`.rf-btn\`) and cards (\`.rf-card\`) with warm amber underglows.
- Full respect for user accessibility settings via \`prefers-reduced-motion\`.

### 3. Expanded Reasoning Token Budgets
Deep engineering problems require room for multi-step reasoning:
- **Prompt Token Budget:** Expanded to **4,500 tokens**, guaranteeing full multi-turn conversation context is preserved without premature drops.
- **Output Token Ceiling:** Raised to **3,072 tokens**, preventing cut-offs during complex multi-file code generation and architectural diagrams.
- **Automated Cooldown Tracking:** Intelligent serverless failover monitors rate limits and automatically rotates across active neural clusters.

---

## Experience RoleFlow v5 Today

RoleFlow v5.0 is live right now on [roleflow.site/chat](https://roleflow.site/chat). You can try it as a guest or sign in with your email to unlock persistent project workspaces.

We can't wait to see what you build.

*— Jordan Daniels, Founder & Lead Architect*
    `.trim(),
  },
  {
    id: "interactive-artifacts-deep-dive",
    title: "How Interactive Artifacts Work: Live Previews & Instant ZIP Exports",
    summary:
      "An architectural look at how RoleFlow sandboxes and executes generated HTML, CSS, JavaScript, and multi-file projects right inside your browser window.",
    category: "engineering",
    icon: "code",
    author: "Jordan Daniels",
    authorRole: "Founder & Lead Architect",
    readTime: "6 min read",
    publishedAt: "2026-11-13T08:30:00.000Z",
    isPublished: true,
    tags: ["Artifacts", "Sandboxing", "Live Preview", "JavaScript"],
    content: `
# How Interactive Artifacts Work

One of RoleFlow's foundational features is **Interactive Artifacts**. When you ask RoleFlow to build a countdown timer, a data dashboard, or a complete web application, it doesn't just output raw markdown code—it opens a dedicated, sandboxed execution pane beside your chat.

In this post, we'll explain how our sandboxing, multi-file bundling, and instant client-side ZIP packaging work under the hood.

---

## The Sandbox Architecture

Running user-generated or AI-generated JavaScript inside a browser window requires strict security boundaries. We isolate every artifact using an iframe configured with restricted capabilities:

\`\`\`html
<iframe
  sandbox="allow-scripts allow-modals"
  csp="default-src 'self' 'unsafe-inline' blob: data:;"
  srcdoc="..."
/>
\`\`\`

By omitting \`allow-same-origin\`, the artifact runs in an entirely unique origin:
1. It **cannot** access your localStorage, session tokens, or authentication cookies.
2. It **cannot** read your conversation history or parent window DOM.
3. It can execute responsive layouts, canvas animations, and interactive event listeners safely.

---

## Multi-File Project Bundling

When a project has multiple files (such as \`index.html\`, \`styles.css\`, and \`app.js\`), RoleFlow dynamically synthesizes them in memory:
- Stylesheets are compiled into scoped \`<style>\` tags.
- Scripts are injected with module wrapper boundaries.
- External dependencies (like Tailwind CSS, KaTeX, or Lucide icons) can be referenced via vetted CDNs.

---

## Instant One-Click ZIP Download

You shouldn't have to copy-paste three different files to run a project locally. RoleFlow includes an in-browser ZIP compiler using JSZip:
- Every file in the artifact is assembled into a clean directory structure.
- A single click on the download button bundles the files into a \`.zip\` archive instantly in memory.
- You extract and open \`index.html\` directly on your desktop.

Try asking RoleFlow to *"build an interactive retro snake game in HTML5"* to see it in action!
    `.trim(),
  },
  {
    id: "persistent-workspace-memory",
    title: "Architecting Isolated Workspaces and Continuous Memory",
    summary:
      "How RoleFlow balances global user profile preferences with isolated project workspaces and granular memory management.",
    category: "architecture",
    icon: "database",
    author: "Jordan Daniels",
    authorRole: "Founder & Lead Architect",
    readTime: "4 min read",
    publishedAt: "2026-11-12T16:00:00.000Z",
    isPublished: true,
    tags: ["Memory", "Workspaces", "Context", "Architecture"],
    content: `
# Architecting Isolated Workspaces and Continuous Memory

Context switching is the biggest friction in software engineering. When you switch from debugging a Python backend service to writing a React landing page, you don't want your AI assistant conflating the dependencies or guidelines of the two codebases.

RoleFlow solves this with **Isolated Project Workspaces** combined with **Explicit Memory Tiers**.

---

## The Three Tiers of Context

RoleFlow structures context into three distinct layers:

1. **Global Persona & User Preferences:**
   - Your preferred programming languages, indentation styles, and communication tone (concise vs. detailed).
   - Stored in your encrypted profile and included across all conversations.
2. **Project Workspace Context:**
   - Dedicated workspace folders with their own custom instructions and file attachments.
   - Chats created inside a workspace inherit that project's specific conventions (e.g. Next.js 14 App Router, PostgreSQL schemas, strict TypeScript).
3. **Session-Level Working Memory:**
   - Live multi-turn message history managed with token budgeting and automatic context deduplication.

---

## Complete User Ownership of Memory

We believe AI memory should never be an invisible black box. In RoleFlow's Settings modal, you have a dedicated **Memory Management** tab:
- Review every fact or preference RoleFlow has saved.
- Edit or delete specific memories with a single click.
- Completely wipe memory at any time with cryptographic certainty.

Your data stays yours. Always.
    `.trim(),
  },
  {
    id: "multi-model-cluster-routing",
    title: "Benchmarking Our Model Suite: Apex 1.0, Omni 1.0, Genesis 1.5, and Flash 2.0",
    summary:
      "A technical comparison of RoleFlow's four model tiers, latency profiles, and when to use each for optimal development flow.",
    category: "product",
    icon: "cpu",
    author: "Jordan Daniels",
    authorRole: "Founder & Lead Architect",
    readTime: "5 min read",
    publishedAt: "2026-11-12T12:00:00.000Z",
    isPublished: true,
    tags: ["Models", "Apex", "Omni", "Genesis", "Flash", "Benchmarks"],
    content: `
# Benchmarking Our Model Suite

Every engineering task has different demands. Sometimes you need a lightning-fast typo fix or regex query; other times you need a 10-minute deep architectural audit of a microservices topology.

To handle this spectrum, RoleFlow offers four tailored model tiers:

---

## The RoleFlow Model Roster

| Model Tier | Primary Strength | Latency Profile | Best Use Case |
|---|---|---|---|
| **RoleFlow Flash 2.0** | Ultra-low latency | ~250ms TTFT (500+ tok/s) | Quick fixes, syntax lookups, mobile queries |
| **RoleFlow Genesis 1.5** | Balanced reasoning | ~600ms TTFT (350+ tok/s) | Everyday coding, code reviews, writing |
| **RoleFlow Omni 1.0** | Complex multi-step reasoning | ~900ms TTFT (280+ tok/s) | Refactoring, debugging subtle edge cases |
| **RoleFlow Apex 1.0** | Maximum architectural depth | High-density reasoning | Microservice architecture, formal proofs |

---

## Dynamic Key Failover & Health Telemetry

Behind these tiers sits our multi-cluster neural routing system:
- Real-time telemetry monitoring via Better Stack checks health every 30 seconds.
- If a provider cluster experiences rate limits or elevated latency, RoleFlow transparently fails over to warm reserve pools without dropping your stream.
- Live system status is publicly viewable at [status.roleflow.site](https://status.roleflow.site).
    `.trim(),
  },
];
