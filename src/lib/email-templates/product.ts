import type { EmailTemplate } from "./types";

/** Product Releases & AI Models (15 templates) */
export const PRODUCT_TEMPLATES: EmailTemplate[] = [
  {
    id: "prod-apex-ga",
    title: "Apex 1.0 General Availability",
    category: "product",
    subject: "Apex 1.0 is now generally available",
    tags: ["apex", "model", "launch", "general availability", "ga"],
    emoji: "⚡",
    body: `Hi {{name}},

Apex 1.0 is now generally available on RoleFlow. Apex is our most capable model for complex reasoning, long-form writing, and multi-step analysis, and it is now available to every account in the model picker.

What is new: stronger instruction following, more reliable structured output, and better handling of long documents. Apex is the default choice when quality matters most.

Try it on a question you have been saving for a rainy day, then compare it with your usual workflow. We would love to hear what you find.`,
    ctaText: "Try Apex 1.0",
    ctaUrl: "{{app_url}}",
  },
  {
    id: "prod-omni-multimodal",
    title: "Omni 1.0 multimodal release",
    category: "product",
    subject: "Omni 1.0 brings multimodal reasoning to RoleFlow",
    tags: ["omni", "multimodal", "model", "release"],
    emoji: "🌐",
    body: `Hi {{name}},

Omni 1.0 is now available in RoleFlow. Omni is built for tasks that combine text with structured inputs and reasoning across different kinds of content, and it sits between Apex and Flash in our model lineup.

Use Omni when you need a balance of depth and speed, for example when you are comparing options, summarizing mixed material, or working through a plan with many moving parts.

You can select Omni 1.0 in the model picker today.`,
    ctaText: "Open the model picker",
    ctaUrl: "{{app_url}}",
  },
  {
    id: "prod-genesis-update",
    title: "Genesis 1.5 update",
    category: "product",
    subject: "Genesis 1.5 is here: faster, more accurate, and more consistent",
    tags: ["genesis", "update", "model", "upgrade"],
    emoji: "🧬",
    body: `Hi {{name}},

Genesis 1.5 is now live. This update improves accuracy on technical writing, reduces repeated phrasing in long answers, and makes responses more consistent when you ask follow-up questions.

Genesis 1.5 replaces Genesis 1.0 as the default in the model picker. Your existing chats keep their history, and you can switch models at any time.

Let us know how it performs for your work.`,
    ctaText: "Try Genesis 1.5",
    ctaUrl: "{{app_url}}",
  },
  {
    id: "prod-flash-inference",
    title: "Flash 2.0 inference drop",
    category: "product",
    subject: "Flash 2.0: faster answers for quick questions",
    tags: ["flash", "speed", "inference", "model", "latency"],
    emoji: "💨",
    body: `Hi {{name}},

Flash 2.0 is now available. Flash is our fastest model, designed for quick questions, rewrites, brainstorming and everyday tasks where a fast answer matters more than maximum depth.

In internal testing, Flash 2.0 starts responding noticeably sooner than its predecessor, and it streams text as it is generated so you can start reading right away.

Flash is available to all plans. Select it in the model picker to try it.`,
    ctaText: "Try Flash 2.0",
    ctaUrl: "{{app_url}}",
  },
  {
    id: "prod-office-extraction",
    title: "Office document extraction live",
    category: "product",
    subject: "RoleFlow can now read .docx and .xlsx files",
    tags: ["office", "docx", "xlsx", "extraction", "documents"],
    emoji: "📄",
    body: `Hi {{name}},

You can now attach Word (.docx) and Excel (.xlsx) files to your RoleFlow chats. RoleFlow reads the text, tables and sheet structure so you can ask questions, summarize, or request changes.

Tips for best results: keep tables tidy, use clear headings in documents, and tell RoleFlow which sheet or section matters most. Large files may be summarized rather than read in full.

Your files are processed for your conversation and are handled under our Privacy Policy.`,
    ctaText: "Attach a document",
    ctaUrl: "{{app_url}}",
  },
  {
    id: "prod-grounded-search",
    title: "Grounded web search announcement",
    category: "product",
    subject: "Answers with live web sources, now in RoleFlow",
    tags: ["search", "web", "grounding", "sources", "announcement"],
    emoji: "🔎",
    body: `Hi {{name}},

RoleFlow can now search the web when a question needs current information. When it uses search, it shows the sources it relied on, so you can check them yourself.

Search runs when your question needs recent facts, such as prices, news or product details. You do not need a separate key or setup to use it.

If a search cannot be completed, RoleFlow will say so instead of guessing.`,
    ctaText: "Ask a question with sources",
    ctaUrl: "{{app_url}}",
  },
  {
    id: "prod-sse-streaming",
    title: "Real-time streaming launch",
    category: "product",
    subject: "Watch answers appear as they are written",
    tags: ["streaming", "sse", "realtime", "launch", "performance"],
    emoji: "✨",
    body: `Hi {{name}},

Responses in RoleFlow now stream in real time. Instead of waiting for a complete answer, you see text appear as the model writes it, and you can stop a response at any point.

Streaming also applies to the developer API. Set the stream option on your chat completion requests to receive server-sent events as tokens are generated.

Give it a try in your next chat.`,
    ctaText: "Start a chat",
    ctaUrl: "{{app_url}}",
  },
  {
    id: "prod-custom-instructions-memory",
    title: "Custom Instructions and Memory are live",
    category: "product",
    subject: "Custom Instructions and Memory are now available",
    tags: ["custom instructions", "memory", "personalization", "feature"],
    emoji: "🧠",
    body: `Hi {{name}},

Custom Instructions and Memory are now live. Custom Instructions let you tell RoleFlow about your role, your preferences and how you like answers formatted. Memory lets RoleFlow remember useful details across chats when you want it to.

You stay in control. You can review, edit or delete any memory at any time, and you can turn Memory off altogether.

Find both settings in your account menu.`,
    ctaText: "Open settings",
    ctaUrl: "{{action_url}}",
  },
  {
    id: "prod-api-keys-launch",
    title: "Developer API keys platform launch",
    category: "product",
    subject: "Developer API keys are here",
    tags: ["api", "keys", "developers", "launch", "platform"],
    emoji: "🔑",
    body: `Hi {{name}},

You can now create RoleFlow API keys from your account to build with our models in your own applications. Each key has its own name, request limits and optional model restrictions, and you can revoke a key at any time.

Keep keys secret. Do not put them in client-side code or public repositories. Our documentation covers authentication, rate limits and example requests.

Your first key takes less than a minute to create.`,
    ctaText: "Create an API key",
    ctaUrl: "{{action_url}}",
  },
  {
    id: "prod-projects-launch",
    title: "Projects launch",
    category: "product",
    subject: "Organize your work with Projects",
    tags: ["projects", "organization", "feature", "launch"],
    emoji: "🗂️",
    body: `Hi {{name}},

Projects are now available in RoleFlow. Group related chats together, add project instructions that apply to every chat inside, and keep your work in one place.

Projects are a good fit for ongoing work such as a product launch, a research topic or a course you are taking.

Create your first project from the sidebar.`,
    ctaText: "Create a project",
    ctaUrl: "{{app_url}}",
  },
  {
    id: "prod-chat-sharing",
    title: "Shareable chat links",
    category: "product",
    subject: "Share a RoleFlow conversation with a link",
    tags: ["share", "links", "feature", "collaboration"],
    emoji: "🔗",
    body: `Hi {{name}},

You can now share a RoleFlow conversation with a link. Anyone with the link can read the conversation, but they cannot change it or see your other chats.

You choose when to share and can stop sharing at any time from the share menu. Please avoid sharing conversations that contain personal or confidential information.`,
    ctaText: "Open your chats",
    ctaUrl: "{{app_url}}",
  },
  {
    id: "prod-model-selector-effort",
    title: "Model selector and effort levels",
    category: "product",
    subject: "Choose the right model and effort for each task",
    tags: ["model selector", "effort", "settings", "feature"],
    emoji: "🎚️",
    body: `Hi {{name}},

The RoleFlow model picker now includes effort levels. Higher effort gives the model more room to reason before it answers, which helps with difficult questions. Lower effort returns answers faster.

Quick guide: use Flash for quick tasks, Omni for balanced work, Genesis for technical writing, and Apex when quality matters most. Effort can be changed for each message.`,
    ctaText: "Open the model picker",
    ctaUrl: "{{app_url}}",
  },
  {
    id: "prod-pdf-support",
    title: "PDF and document attachments",
    category: "product",
    subject: "Attach PDFs and text documents to your chats",
    tags: ["pdf", "attachments", "documents", "feature"],
    emoji: "📎",
    body: `Hi {{name}},

You can now attach PDF files and plain text documents to your RoleFlow chats. RoleFlow extracts the text and uses it to answer your questions, summarize sections, or compare documents.

For scanned PDFs without a text layer, results may be limited. Keep files under the size limit shown in the attachment dialog.`,
    ctaText: "Attach a file",
    ctaUrl: "{{app_url}}",
  },
  {
    id: "prod-image-roadmap",
    title: "Image uploads: roadmap update",
    category: "product",
    subject: "An update on image uploads in RoleFlow",
    tags: ["images", "roadmap", "update", "uploads"],
    emoji: "🗺️",
    body: `Hi {{name}},

Many of you have asked about image uploads. We are not yet ready to turn them on for all accounts. We are working on the safety, storage and moderation work needed to offer them responsibly.

We will announce availability in the product and here, once it is ready. Until then, you can describe the image in text, or attach a PDF or document instead.

Thank you for your patience and feedback.`,
  },
  {
    id: "prod-mobile-web-release",
    title: "Faster web app and new layout",
    category: "product",
    subject: "A faster RoleFlow web app with a refreshed layout",
    tags: ["web", "layout", "performance", "design", "release"],
    emoji: "🖥️",
    body: `Hi {{name}},

The RoleFlow web app has been refreshed. Pages load faster, the sidebar is easier to navigate on small screens, and message controls are clearer.

Nothing about your chats or settings has changed. If something looks off in your browser, try a hard refresh and let us know if the issue persists.`,
    ctaText: "Open RoleFlow",
    ctaUrl: "{{app_url}}",
  },
];
