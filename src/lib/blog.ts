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

/** Comprehensive, authoritative engineering blog posts authored by Founder & Lead Architect Jordan Daniels */
export const SEED_BLOG_POSTS: BlogPost[] = [
  {
    id: "introducing-roleflow-v5",
    title: "Introducing RoleFlow v5.0: The Engineering-First AI Assistant",
    summary:
      "A complete architectural walkthrough of our bespoke obsidian identity, FlowLine dual-wave geometry, scroll-driven motion engine, expanded reasoning token ceilings, and zero-flicker default dark mode.",
    category: "announcements",
    icon: "rocket",
    author: "Jordan Daniels",
    authorRole: "Founder & Lead Architect",
    readTime: "8 min read",
    publishedAt: "2026-11-13T10:00:00.000Z",
    isPublished: true,
    tags: ["Launch", "RoleFlow v5", "Design System", "Reasoning", "Architecture"],
    content: `
# Introducing RoleFlow v5.0: The Engineering-First AI Assistant

Today marks an inflection point in the journey of RoleFlow. We are officially releasing **RoleFlow v5.0**, a milestone release that codifies our permanent visual design language, establishes our serverless motion architecture, and significantly expands our multi-tier neural reasoning ceilings.

When we founded RoleFlow, our core thesis was clear: **software engineers do not need another chatbot that merely speaks text; builders need an assistant that builds, validates, sandboxes, and packages executable software.** 

Most general AI assistants produce fragmented code snippets trapped within standard chat bubbles. Developers are forced into an exhausting copy-paste feedback loop—moving snippets into local files, debugging terminal missing dependencies, and piecing together disjointed scripts. RoleFlow was engineered from the ground up to eliminate this friction entirely through **Interactive Artifacts**, continuous project workspaces, and multi-cluster neural routing.

---

## 1. The Obsidian & Molten Amber Visual Identity

With version 5.0, we have moved permanently away from generic off-the-shelf component libraries to a bespoke, command-center aesthetic tuned specifically for high-focus engineering environments.

### The Color Palette Hierarchy

| Surface / Token | Value | Semantic Purpose |
|---|---|---|
| \`--c-app\` | \`#0C0C0E\` (Obsidian) | Root application background; eliminates eye strain during late-night debugging. |
| \`--c-card\` | \`#141417\` (Basalt) | Component surface elevations with crisp border lines. |
| \`--c-line\` | \`#27272A\` (Zinc 800) | 1px hairline dividers defining clear workspace geometry. |
| \`--c-accent\` | \`#F59E0B\` (Molten Amber) | Primary focus indicators, active states, and radiant badges. |
| \`--c-flame\` | \`#EA580C\` (Ember Orange) | Secondary energy and dual-wave gradient transitions. |

### Typography Architecture

Typography in RoleFlow v5 is carefully tiered across three distinct typefaces:
- **Display & Headlines:** **Bricolage Grotesque** brings warmth, character, and high-impact editorial clarity to titles.
- **Interface & Reading:** **Geist** provides pristine geometric neutral legibility at all font sizes (from 10px status tags to 16px body prose).
- **Code & Telemetry:** **Martian Mono** guarantees razor-sharp alignment for code blocks, token counters, JSON payloads, and log streams.

---

## 2. The FlowLine Dual-Wave Mathematics

A core visual signature of RoleFlow v5 is **The FlowLine Wave**, a dual cubic-Bézier SVG wave divider tracing our logo's wave energy across section dividers.

\`\`\`svg
<svg viewBox="0 0 600 60" fill="none">
  <!-- Primary Crest Wave -->
  <path
    d="M4 30 C 90 4, 160 4, 230 30 S 370 56, 440 30 S 540 6, 596 30"
    stroke="url(#rf-flow-grad)"
    strokeWidth="3"
    strokeLinecap="round"
  />
  <!-- Secondary Harmonic Wave -->
  <path
    d="M10 39 C 90 20, 160 20, 230 39 S 370 58, 440 39 S 540 22, 590 39"
    stroke="url(#rf-flow-grad)"
    strokeWidth="1.5"
    strokeLinecap="round"
    opacity="0.5"
  />
</svg>
\`\`\`

The wave is rendered with stroke dasharray animations that draw smoothly upon section entry. For users with \`prefers-reduced-motion: reduce\` enabled, the animation automatically bypasses stroke drawing and renders statically to guarantee accessibility.

---

## 3. Zero-Flicker True Default Dark Mode

Many modern web apps suffer from the dreaded **"white flash of death"**—where an initial light mode HTML payload renders for 50-100ms before client-side JavaScript reads \`localStorage\` and adds a \`.dark\` class.

In RoleFlow v5, we solved this at the root:
1. The server renders \`<html class="dark">\` directly in the static document layout.
2. An inline head script executes synchronously before stylesheet evaluation, checking \`localStorage.getItem("rf_theme")\`.
3. If an explicit light preference exists, it switches immediately before the first paint cycle.

The result is absolute zero-flicker loading across all screen sizes and network connections.

---

## 4. Expanded Token Ceilings & Reasoning Budgets

Complex multi-file architectural tasks require ample reasoning capacity. In v5.0, we have expanded both input context and generation ceilings across our model cluster:

- **Input Prompt Token Budget:** Raised to **4,500 tokens**, ensuring long conversation turns, attached API documentation, and database schemas are preserved without aggressive truncations.
- **Output Token Ceiling:** Raised to **3,072 tokens**, preventing cut-offs when generating multi-file React components or complete backend endpoints.
- **Automatic Cooldown Backoffs:** Our serverless router tracks rate limit headers (\`x-ratelimit-remaining-tokens\`) in real time, automatically shifting incoming prompts across warm API keys to prevent 429 throttling.

---

## 5. Experience RoleFlow v5 Today

RoleFlow v5.0 is running live in production at [roleflow.site/chat](https://roleflow.site/chat). You can explore full features as a guest or sign in with your email to unlock persistent project workspaces.

We welcome your feedback. Dispatches and questions can be sent directly to our team via [roleflow.site/help](https://roleflow.site/help).

*— Jordan Daniels, Founder & Lead Architect*
    `.trim(),
  },
  {
    id: "interactive-artifacts-deep-dive",
    title: "How Interactive Artifacts Work: Live Previews & Instant ZIP Exports",
    summary:
      "A deep architectural look into how RoleFlow sandboxes and executes generated HTML, CSS, JavaScript, and multi-file projects right inside your browser window without server roundtrips.",
    category: "engineering",
    icon: "code",
    author: "Jordan Daniels",
    authorRole: "Founder & Lead Architect",
    readTime: "9 min read",
    publishedAt: "2026-11-13T08:30:00.000Z",
    isPublished: true,
    tags: ["Artifacts", "Sandboxing", "Live Preview", "JavaScript", "Security"],
    content: `
# How Interactive Artifacts Work: Live Previews & Instant ZIP Exports

One of the defining innovations of RoleFlow is **Interactive Artifacts**. When a builder asks RoleFlow to construct a financial dashboard, an audio visualizer, a retro canvas game, or a multi-page web tool, RoleFlow does not simply spit out a static code block.

Instead, RoleFlow opens a dedicated **Live Execution Pane** directly alongside the chat stream. Within milliseconds, that generated code is rendered into an interactive, running application that you can test, modify, and download as a production-ready ZIP archive with a single click.

In this deep dive, we walk through the three key architectural components powering this capability:
1. **The Sandbox Security Boundary**
2. **In-Memory Multi-File Synthesis**
3. **Client-Side Deflate ZIP Bundling**

---

## 1. The Sandbox Security Model

Executing dynamic AI-generated JavaScript directly in a browser demands rigorous isolation. If executed naively, generated code could inspect session cookies, read \`localStorage\` authentication tokens, or access parent window DOM hierarchies.

To guarantee zero-trust isolation, RoleFlow executes all artifacts inside an iframe configured with strict sandboxing and Content Security Policies (CSP):

\`\`\`html
<iframe
  sandbox="allow-scripts allow-modals"
  csp="default-src 'self' 'unsafe-inline' blob: data: https://cdn.jsdelivr.net https://cdnjs.cloudflare.com https://cdn.tailwindcss.com; img-src * data: blob:;"
  srcdoc="<!DOCTYPE html><html>...</html>"
/>
\`\`\`

### Why This Security Configuration Works:
- **Omission of \`allow-same-origin\`:** This is the most crucial constraint. By omitting this flag, the browser treats the iframe as having a unique, opaque origin (\`null\`). Even if the artifact attempts to access \`window.parent.localStorage\` or read cookies, the browser enforces a Cross-Origin Object Access Exception.
- **Scoped Scripting:** \`allow-scripts\` allows interactive event listeners, DOM updates, canvas renderings, and state mutations to run smoothly.
- **Tight CSP Allowlist:** Restricts network requests to trusted CDNs (such as Tailwind CSS, Lucide Icons, and KaTeX), preventing malicious exfiltration to arbitrary endpoints.

---

## 2. In-Memory Multi-File Synthesis

Many complex projects require multiple separate source files—for example, \`index.html\`, \`styles.css\`, and \`app.js\`.

RoleFlow uses a client-side bundler that parses the artifact manifest and synthesizes them into a single runnable document on the fly:

\`\`\`typescript
export function bundleArtifactFiles(files: Record<string, string>): string {
  const html = files["index.html"] || files["app.html"] || "<div id='app'></div>";
  const css = files["styles.css"] || files["style.css"] || "";
  const js = files["app.js"] || files["main.js"] || files["script.js"] || "";

  return \`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    \${css}
  </style>
</head>
<body class="bg-slate-950 text-slate-100">
  \${html}
  <script>
    try {
      \${js}
    } catch (err) {
      console.error("Artifact runtime error:", err);
    }
  </script>
</body>
</html>\`;
}
\`\`\`

Because this synthesis happens entirely within the browser's JavaScript memory space, there is **zero server roundtrip latency**. Previews update in real time as the AI model streams out file changes.

---

## 3. Instant One-Click Client-Side ZIP Packaging

When you are ready to take your artifact to production or run it locally in VS Code, you shouldn't have to copy-paste three files manually.

RoleFlow embeds a lightweight, in-browser ZIP compiler using **JSZip**:

\`\`\`typescript
import JSZip from "jszip";

export async function downloadArtifactZip(artifactTitle: string, files: Record<string, string>) {
  const zip = new JSZip();

  // Populate folder hierarchy
  for (const [filename, content] of Object.entries(files)) {
    zip.file(filename, content);
  }

  // Generate binary blob with Deflate compression
  const blob = await zip.generateAsync({
    type: "blob",
    compression: "DEFLATE",
    compressionOptions: { level: 6 },
  });

  // Trigger native browser download
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = \`\${artifactTitle.toLowerCase().replace(/\\s+/g, "-")}.zip\`;
  anchor.click();
  URL.revokeObjectURL(url);
}
\`\`\`

The user clicks **"Download ZIP"**, and their browser instantly prompts them to save a zipped archive containing the complete, organized repository.

---

## 4. Architectural Summary

| Dimension | Traditional Chatbots | RoleFlow Interactive Artifacts |
|---|---|---|
| **Code Execution** | Static Markdown snippet | Sandboxed live execution pane |
| **Origin Isolation** | N/A | \`null\` origin via restricted iframe sandbox |
| **Multi-File Context** | Single fragmented blocks | Manifest-based multi-file tab switching |
| **Local Export** | Manual copy-pasting | Instant in-browser ZIP download |

Try asking RoleFlow to *"build a solar system gravity simulator in HTML5 canvas"* to see this execution pipeline in action!

*— Jordan Daniels, Founder & Lead Architect*
    `.trim(),
  },
  {
    id: "persistent-workspace-memory",
    title: "Architecting Isolated Workspaces and Continuous Memory",
    summary:
      "How RoleFlow balances global user profile preferences with isolated project workspaces, sliding context token budgeting, and cryptographic privacy guarantees.",
    category: "architecture",
    icon: "database",
    author: "Jordan Daniels",
    authorRole: "Founder & Lead Architect",
    readTime: "7 min read",
    publishedAt: "2026-11-12T16:00:00.000Z",
    isPublished: true,
    tags: ["Memory", "Workspaces", "Context", "Architecture", "Privacy"],
    content: `
# Architecting Isolated Workspaces and Continuous Memory

Context pollution is one of the most persistent failure modes of modern AI tools. If you spend the morning building a Python FastAPI microservice with strict Pydantic v2 schemas, and then in the afternoon switch to writing a React 19 Next.js App Router front end, you do not want your AI assistant leaking Python conventions into your TypeScript components.

RoleFlow resolves this through a **Three-Tiered Memory Architecture** that guarantees strict project boundary isolation while preserving your overarching developer profile.

---

## The Three Tiers of Context

\`\`\`
┌────────────────────────────────────────────────────────┐
│ Tier 1: Global Developer Profile (Encrypted, Global)    │
│ Language Preferences, Formatting Rules, Coding Style    │
└──────────────────────────┬─────────────────────────────┘
                           │
┌──────────────────────────▼─────────────────────────────┐
│ Tier 2: Project Workspace Instructions (Scoped)         │
│ Project Tech Stack, Schemas, Custom Guidelines, Docs    │
└──────────────────────────┬─────────────────────────────┘
                           │
┌──────────────────────────▼─────────────────────────────┐
│ Tier 3: Session Working Memory (Sliding Context Window)│
│ Multi-Turn Dialog, Active Artifact State, Tool Turns   │
└────────────────────────────────────────────────────────┘
\`\`\`

### 1. Tier 1: Global Developer Profile
Your global profile stores fundamental preferences that you want applied universally:
- Preferred programming language (e.g. TypeScript over JavaScript, Go over Python).
- Styling guidelines (e.g. Tailwind CSS, CSS Modules, BEM).
- Tone preference: direct and concise vs. explanatory and detailed.

These preferences are loaded globally and prepended to system instructions.

### 2. Tier 2: Project Workspaces
Workspaces are isolated silos with their own custom system instructions and file attachments:
- You create a workspace called *"RoleFlow Backend"* configured with: *"Target Node.js 20, Next.js 14 App Router, PostgreSQL via @vercel/postgres, and strict TypeScript."*
- Every conversation initiated within that workspace automatically inherits those exact guidelines.
- Chats created in a separate *"Mobile App"* workspace will never cross-contaminate or see backend instructions.

### 3. Tier 3: Session Working Memory
During an active conversation, RoleFlow dynamically manages token budgets:
- When a dialog approaches our 4,500 prompt token limit, a semantic compaction algorithm summarizes earlier turns while preserving critical technical decisions, API keys, and artifact states.

---

## Complete User Ownership & Cryptographic Erasure

We believe that AI memory must never be an opaque black box. In RoleFlow's Settings modal, you have a dedicated **Memory Management** panel:

1. **Granular Inspection:** View every discrete memory item recorded by RoleFlow.
2. **Individual Editing & Deletion:** Edit or delete specific memory items with a single click.
3. **Deterministic Wiping:** Wiping your memory triggers an immediate database deletion (\`DELETE FROM roleflow_memories WHERE user_id = $1\`) with zero residual retention.

Your code and your data remain under your absolute control.

*— Jordan Daniels, Founder & Lead Architect*
    `.trim(),
  },
  {
    id: "multi-model-cluster-routing",
    title: "Benchmarking Our Model Suite: Apex 1.0, Omni 1.0, Genesis 1.5, and Flash 2.0",
    summary:
      "A rigorous technical evaluation of RoleFlow's four model tiers, latency profiles, TTFT benchmarks, and dynamic failover routing across Groq LPU clusters.",
    category: "product",
    icon: "cpu",
    author: "Jordan Daniels",
    authorRole: "Founder & Lead Architect",
    readTime: "8 min read",
    publishedAt: "2026-11-12T12:00:00.000Z",
    isPublished: true,
    tags: ["Models", "Apex", "Omni", "Genesis", "Flash", "Benchmarks", "Telemetry"],
    content: `
# Benchmarking Our Model Suite: Apex, Omni, Genesis, and Flash

Different engineering tasks place wildly different demands on an AI assistant. When you are writing a regex expression or fixing a CSS alignment typo, you need instantaneous response latency. When you are redesigning a distributed microservices architecture or verifying cryptographic proofs, you need deep, multi-step chain-of-thought reasoning.

To serve this entire spectrum without compromise, RoleFlow provides four specialized model tiers backed by our multi-cluster neural routing mesh.

---

## The Model Tier Benchmark Matrix

The following table summarizes our production benchmarks measured across thousands of real-world developer turns:

| Model Tier | Underpinning Architecture | Avg Time to First Token (TTFT) | Generation Speed | Primary Specialty |
|---|---|---|---|---|
| **RoleFlow Flash 2.0** | Llama 3.3 70B Versatile | **~240 ms** | **450+ tokens/sec** | Instant typo fixes, regex queries, CLI lookups |
| **RoleFlow Genesis 1.5** | Qwen 2.5 Coder 32B | **~480 ms** | **380+ tokens/sec** | Everyday frontend coding, code reviews, bug diagnosis |
| **RoleFlow Omni 1.0** | Llama 3.1 70B Speculative | **~720 ms** | **310+ tokens/sec** | Complex multi-file refactoring, database migrations |
| **RoleFlow Apex 1.0** | GPT-OSS-120B High-Density | **~1,100 ms** | **220+ tokens/sec** | Deep architectural auditing, system design, security audits |

---

## Dynamic Key Failover & Health Telemetry

Behind these model tiers sits our automated inference router. Operating high-throughput AI services requires resilience against upstream rate limits and transient provider degradation.

RoleFlow employs a three-stage failover mechanism:

1. **Key Pool Health Rotation:**
   Multiple API keys are pooled and monitored. If a key encounters a \`429 Rate Limit\`, it is temporarily placed in an automated cooldown queue for 60 seconds while incoming requests rotate seamlessly to warm standby keys.
2. **Provider Telemetry Monitoring:**
   Every 30 seconds, synthetic heartbeats test endpoint reachability. Real-time uptime telemetry is streamed to our public status page at [status.roleflow.site](https://status.roleflow.site).
3. **Graceful Tier Downgrade:**
   In the rare event that an apex tier cluster experiences regional provider outages, RoleFlow automatically falls back to an equivalent warm tier without aborting your chat stream.

---

## Choosing the Right Model For Your Workflow

- Use **Flash 2.0** when iterating rapidly on UI styles, writing bash scripts, or looking up syntax.
- Use **Genesis 1.5** as your everyday workhorse for feature implementation and unit testing.
- Use **Omni 1.0** when architecting state management across large React or Next.js applications.
- Use **Apex 1.0** for critical systems architecture, database normalization, and formal security audits.

*— Jordan Daniels, Founder & Lead Architect*
    `.trim(),
  },
];
