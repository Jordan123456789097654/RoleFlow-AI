# RoleFlow · Custom AI Platform

An independent, fully custom AI assistant platform engineered with a clean, intellectual design and built for general inquiry and high-precision software engineering.

## ✨ Features

- **Brand Identity**: Dual harmonic "Flow Wave" logo with warm terracotta/amber accents and deep charcoal dark mode (`#18181b`).
- **RoleFlow Architecture**:
  - Time-of-day greeting (`"Afternoon, Jordan Daniels"`) on a minimalist home dashboard.
  - Four-tier model selector: **RoleFlow Apex 1.0** (highest-intelligence frontier), **RoleFlow Omni 1.0** (frontier reasoning), **RoleFlow Genesis 1.5** (balanced flagship), & **RoleFlow Flash 2.0** (ultra-fast). `roleflow-flash-1` requests resolve to Flash 2.0. Genesis 1.5 keeps the `roleflow-genesis-1` ID.
  - Exact Effort Dropdown (`Low`, `Medium [Recommended]`, `High`, `Extra`, `Max [⚠️ 8× or more usage]`).
  - Action row under every assistant answer: **Copy**, **Thumbs Up**, **Thumbs Down**, and **Regenerate**.
  - Simple user message editing with inline re-generation.
- **Interactive Artifacts (Slideout Panel)**:
  - Multi-file tab support.
  - Live interactive sandboxed iframe preview for HTML/CSS/JS web applications.
  - 1-click **Download File** (`.html`, `.py`, `.js`, etc.).
  - 1-click **Download .ZIP** bundling all files in the project.
- **Email Authentication (Secure OTP)**:
  - Powered by **Resend** using `noreply@roleflow.site`.
  - Sends a clean sign-in email with waving hand graphic (`👋`), magic link button, and 6-digit OTP code.
  - Guest mode with free message limit before sign-in prompt.
- **Workspaces & Projects**:
  - `Project ⌵` workspace switcher in the prompt bar.
  - Custom instructions per project and persistent global custom instructions in settings.
- **Database & Storage**:
  - Vercel Postgres / Neon integration ready.
  - Automatic zero-config local storage fallback for offline development.
- **Chat Tools**:
  - Stop a reply mid-stream (button or Esc), rename chats, export a chat as Markdown, and branch a new chat from any assistant reply.
  - Dictation (browser speech recognition), read-aloud for replies, and toast notifications.
  - Word (.docx) and Excel (.xlsx) attachments, plus previews of text attachments.
  - Generation stats under each reply (tokens, latency, tokens per second).
  - Chat compacting: long chats keep a running summary of older turns, so the model keeps context without resending the whole history.
  - Keyboard shortcuts: Ctrl/Cmd+Shift+O new chat, Ctrl/Cmd+K search chats, Ctrl/Cmd+/ focus the composer.
- **Public Chat Sharing**:
  - Instant read-only shareable links (`/share/[id]`).

---

## 🚀 Getting Started

### 1. Run Locally
```bash
npm install
npm run dev
```

### 2. Environment Variables (`.env.local`)
```env
SESSION_SECRET=   # required in production; at least 32 chars, e.g. `openssl rand -hex 32`
RESEND_API_KEY=your_resend_api_key
RESEND_FROM_EMAIL=RoleFlow <noreply@roleflow.site>
NEXT_PUBLIC_APP_URL=https://roleflow.site
GROQ_API_KEYS=key1,key2,key3,key4,key5
# Optional. Enables reading uploaded images. Check Groq's current model list first.
# GROQ_VISION_MODEL=qwen/qwen3.8-27b   # PREVIEW tier: Groq may discontinue it at short notice.
#   When it's gone, images fail closed (held for review) until you set a new model.

# Optional. Second Groq model, used only when every key fails on the tier's primary model.
# GROQ_FALLBACK_MODEL=openai/gpt-oss-20b

# Optional. Web search for replies. Get a key from the Brave Search API. Without it, search stays off.
# BRAVE_SEARCH_API_KEY=
# Set to "true" to show the Web search toggle in the composer (needs BRAVE_SEARCH_API_KEY on the server).
# NEXT_PUBLIC_WEB_SEARCH_ENABLED=true

# When deployed to Vercel, link Vercel Postgres to automatically populate:
# POSTGRES_URL=
```

---

## 🌐 Deploy to Vercel with Custom Domain (`roleflow.site`)

1. Push this project to GitHub.
2. Import the repository into [Vercel](https://vercel.com).
3. In **Project Settings** → **Domains**, add `roleflow.site`.
4. In **Storage**, create a **Postgres** database and link it to your project. Production refuses to store data without one.
5. In **Environment Variables**, add:
   - `SESSION_SECRET` (at least 32 characters; the app refuses to start sessions without it)
   - `RESEND_API_KEY`
   - `RESEND_FROM_EMAIL` = `RoleFlow <noreply@roleflow.site>`
   - `NEXT_PUBLIC_APP_URL` = `https://roleflow.site`
   - `GROQ_API_KEYS`
6. Click **Deploy**!
