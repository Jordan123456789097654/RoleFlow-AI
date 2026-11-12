"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/Logo";
import { Footer } from "@/components/Footer";
import { AuthModal } from "@/components/AuthModal";
import { UserProfile } from "@/types";
import {
  ArrowRight,
  Brain,
  Check,
  ChevronDown,
  Code2,
  Download,
  FolderKanban,
  Share2,
  Sliders,
  Crown,
  Sparkles,
  Zap,
} from "lucide-react";

type EffortChoice = "low" | "medium" | "high" | "max";

const EFFORT_COPY: Record<EffortChoice, string> = {
  low: "Quick answers for small fixes and formatting.",
  medium: "Balanced reasoning for everyday work.",
  high: "Deeper analysis for complex problems.",
  max: "The most thorough reasoning. Responses take longer.",
};

const FAQS = [
  {
    q: "What makes RoleFlow different from a general chatbot?",
    a: "RoleFlow is built for software work and careful inquiry. Code it writes can run in a live preview next to the conversation, you can download it as a ZIP, and project workspaces keep their own instructions and chats apart.",
  },
  {
    q: "How do Interactive Artifacts work?",
    a: "When RoleFlow writes a web page, script, or small app, it opens as an artifact. Run it in an isolated preview pane, switch between its files, and download each file or the whole project as a ZIP.",
  },
  {
    q: "How does sign-in work?",
    a: "There are no passwords. Enter your email and RoleFlow sends a sign-in link and a 6-digit code. Enter the code to sign in.",
  },
  {
    q: "What do the effort levels do?",
    a: "Effort sets how much reasoning RoleFlow spends on a reply. Low is fastest and suits small tasks. Medium is the default. High and Max are for hard architecture, debugging, and proofs, and they take longer.",
  },
  {
    q: "Is RoleFlow free?",
    a: "You can try RoleFlow without an account, with a small number of guest messages. Signing in unlocks a daily message allowance. See the Terms of Service for current limits.",
  },
];

const FEATURES = [
  {
    icon: Code2,
    title: "Interactive artifacts",
    body: "Generated web pages, scripts, and small apps open in a sandboxed preview beside the chat, so you can try them right away.",
  },
  {
    icon: Sliders,
    title: "Effort controls",
    body: "Choose how much reasoning each reply gets, from quick answers to the deepest analysis.",
  },
  {
    icon: FolderKanban,
    title: "Project workspaces",
    body: "Keep related chats together with their own custom instructions, so each project starts with the right context.",
  },
  {
    icon: Share2,
    title: "Shareable conversations",
    body: "Share a read-only link to any conversation, without giving anyone access to your account.",
  },
];

const STEPS = [
  {
    n: "1",
    title: "Sign in with your email",
    body: "No password. Use the code or link we send you.",
  },
  {
    n: "2",
    title: "Ask, or attach a file",
    body: "Write a question or request, or add a document, image, or code file for context.",
  },
  {
    n: "3",
    title: "Preview and download",
    body: "Run generated code in the preview, make changes, and download the files you need.",
  },
];

export default function MarketingLandingPage() {
  const router = useRouter();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [effortLevel, setEffortLevel] = useState<EffortChoice>("high");

  // Check saved user session
  useEffect(() => {
    try {
      const savedUser = localStorage.getItem("roleflow_user");
      if (savedUser) {
        setUser(JSON.parse(savedUser));
      }
    } catch (e) {
      console.error("User parse error", e);
    }
  }, []);

  const handleAuthSuccess = (authenticatedUser: UserProfile) => {
    setUser(authenticatedUser);
    localStorage.setItem("roleflow_user", JSON.stringify(authenticatedUser));
    setAuthModalOpen(false);
    router.push("/chat");
  };

  return (
    <div className="flex min-h-screen flex-col bg-app text-ink">
      {/* Navigation */}
      <header className="sticky top-0 z-50 w-full border-b border-line/70 bg-app/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <Link href="/" className="inline-flex items-center">
            <Logo size={28} />
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            <a href="#features" className="inline-flex min-h-10 items-center rounded-lg px-3 text-sm text-muted transition-colors hover:text-ink">
              Features
            </a>
            <a href="#models" className="inline-flex min-h-10 items-center rounded-lg px-3 text-sm text-muted transition-colors hover:text-ink">
              Models
            </a>
            <a href="#faq" className="inline-flex min-h-10 items-center rounded-lg px-3 text-sm text-muted transition-colors hover:text-ink">
              FAQ
            </a>
          </nav>

          <div className="flex items-center gap-2">
            {user ? (
              <Link
                href="/chat"
                className="inline-flex min-h-10 items-center rounded-lg border border-line bg-card px-4 text-sm font-medium text-ink transition-colors hover:bg-hover"
              >
                Open chat
              </Link>
            ) : (
              <button
                type="button"
                onClick={() => setAuthModalOpen(true)}
                className="inline-flex min-h-10 items-center rounded-lg px-3.5 text-sm font-medium text-ink transition-colors hover:bg-hover"
              >
                Log in
              </button>
            )}
            <Link
              href="/chat"
              className="inline-flex min-h-10 items-center gap-1.5 rounded-lg bg-accent px-4 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
            >
              <span>Try free</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero */}
        <section className="px-4 pb-20 pt-16 text-center sm:px-6 sm:pt-24 lg:pb-28">
          <div className="mx-auto max-w-3xl">
            <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-line bg-card px-3.5 py-1.5 text-xs text-muted">
              <Sparkles className="h-3.5 w-3.5 text-accent" />
              <span>RoleFlow Apex 1.0, Omni 1.0, Genesis 1.5, and Flash 2.0</span>
            </div>

            <h1 className="font-display text-4xl font-normal leading-[1.12] tracking-tight text-ink sm:text-5xl lg:text-6xl">
              An assistant for thinking, writing, and building
            </h1>

            <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-muted sm:text-lg">
              Ask questions, draft documents, and write code. Anything RoleFlow builds can be previewed and downloaded.
            </p>

            <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href="/chat"
                className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-accent px-6 text-base font-medium text-white transition-colors hover:bg-accent-hover sm:w-auto"
              >
                <span>Start chatting</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
              <a
                href="#features"
                className="inline-flex min-h-12 w-full items-center justify-center rounded-lg border border-line bg-card px-6 text-base font-medium text-ink transition-colors hover:bg-hover sm:w-auto"
              >
                See what it does
              </a>
            </div>
          </div>

          {/* Static product preview */}
          <div className="mx-auto mt-16 max-w-2xl rounded-2xl border border-line bg-card p-5 text-left shadow-composer sm:p-6">
            <div className="flex justify-end">
              <div className="max-w-[85%] rounded-2xl bg-hover px-4 py-2.5 text-sm text-ink">
                Make a one-page countdown timer I can share with my team.
              </div>
            </div>
            <div className="mt-5 space-y-3">
              <p className="text-sm leading-relaxed text-ink">
                Here&apos;s a single HTML file. It has a date picker, a live countdown, and a reset button.
              </p>
              <div className="flex items-center justify-between rounded-lg border border-line bg-app px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent-soft text-accent">
                    <Code2 className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-ink">Countdown timer</p>
                    <p className="text-xs text-muted">index.html · Preview ready</p>
                  </div>
                </div>
                <Download className="h-4 w-4 text-muted" />
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="border-t border-line/70 px-4 py-20 sm:px-6 lg:py-28">
          <div className="mx-auto max-w-6xl">
            <div className="mx-auto mb-14 max-w-2xl text-center">
              <h2 className="font-display text-3xl font-normal tracking-tight text-ink sm:text-4xl">
                Built for doing the work, not just answering
              </h2>
              <p className="mt-4 text-base leading-relaxed text-muted">
                Everything here is available in the chat. Nothing needs to be set up first.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              {FEATURES.map((f) => {
                const Icon = f.icon;
                return (
                  <div key={f.title} className="rounded-2xl border border-line bg-card p-6 sm:p-7">
                    <div className="mb-5 flex h-10 w-10 items-center justify-center rounded-full bg-accent-soft text-accent">
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="font-display text-xl text-ink">{f.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted">{f.body}</p>

                    {f.title === "Effort controls" && (
                      <div className="mt-6 space-y-3 border-t border-line pt-5">
                        <div className="grid grid-cols-4 gap-1 rounded-lg bg-app p-1">
                          {(["low", "medium", "high", "max"] as const).map((lvl) => (
                            <button
                              key={lvl}
                              type="button"
                              onClick={() => setEffortLevel(lvl)}
                              aria-pressed={effortLevel === lvl}
                              className={`min-h-9 rounded-md text-xs font-medium capitalize transition-colors ${
                                effortLevel === lvl ? "bg-card text-ink shadow-sm" : "text-muted hover:text-ink"
                              }`}
                            >
                              {lvl}
                            </button>
                          ))}
                        </div>
                        <p className="min-h-[2.5rem] text-xs leading-relaxed text-muted">{EFFORT_COPY[effortLevel]}</p>
                      </div>
                    )}

                    {f.title === "Interactive artifacts" && (
                      <ul className="mt-6 space-y-2.5 border-t border-line pt-5 text-sm text-muted">
                        <li className="flex items-center gap-2.5">
                          <Check className="h-4 w-4 shrink-0 text-accent" />
                          <span>Live preview for HTML, CSS, and JavaScript</span>
                        </li>
                        <li className="flex items-center gap-2.5">
                          <Check className="h-4 w-4 shrink-0 text-accent" />
                          <span>Download single files or the whole project as a ZIP</span>
                        </li>
                      </ul>
                    )}

                    {f.title === "Project workspaces" && (
                      <ul className="mt-6 space-y-2.5 border-t border-line pt-5 text-sm text-muted">
                        <li className="flex items-center gap-2.5">
                          <Check className="h-4 w-4 shrink-0 text-accent" />
                          <span>Custom instructions for each project</span>
                        </li>
                        <li className="flex items-center gap-2.5">
                          <Check className="h-4 w-4 shrink-0 text-accent" />
                          <span>Chats grouped by project, with pin and delete</span>
                        </li>
                      </ul>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Models */}
        <section id="models" className="border-t border-line/70 bg-panel px-4 py-20 sm:px-6 lg:py-28">
          <div className="mx-auto max-w-6xl">
            <div className="mx-auto mb-14 max-w-2xl text-center">
              <h2 className="font-display text-3xl font-normal tracking-tight text-ink sm:text-4xl">
                Four models, one chat
              </h2>
              <p className="mt-4 text-base leading-relaxed text-muted">
                Pick the model in the chat. Switch at any time.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
              <div className="flex flex-col justify-between rounded-2xl border border-line bg-card p-7 sm:p-8">
                <div>
                  <div className="mb-5 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-ink text-app">
                      <Crown className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-display text-xl text-ink">RoleFlow Apex 1.0</h3>
                      <p className="text-xs text-muted">Our highest-intelligence model</p>
                    </div>
                  </div>
                  <p className="text-sm leading-relaxed text-muted">
                    Built for the most demanding work: deep multi-step reasoning, advanced mathematical proofs, complex systems architecture, and exhaustive code reviews.
                  </p>
                </div>
                <Link
                  href="/chat"
                  className="mt-8 inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-line bg-app text-sm font-medium text-ink transition-colors hover:bg-hover"
                >
                  <span>Use Apex 1.0</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>

              <div className="flex flex-col justify-between rounded-2xl border border-line bg-card p-7 sm:p-8">
                <div>
                  <div className="mb-5 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-ink text-app">
                      <Brain className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-display text-xl text-ink">RoleFlow Omni 1.0</h3>
                      <p className="text-xs text-muted">Our frontier reasoning model</p>
                    </div>
                  </div>
                  <p className="text-sm leading-relaxed text-muted">
                    Use it for the hardest problems: deep multi-step reasoning, advanced math, and enterprise-grade software engineering. It takes longer, and it checks its work.
                  </p>
                </div>
                <Link
                  href="/chat"
                  className="mt-8 inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-line bg-app text-sm font-medium text-ink transition-colors hover:bg-hover"
                >
                  <span>Use Omni 1.0</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>

              <div className="flex flex-col justify-between rounded-2xl border border-line bg-card p-7 sm:p-8">
                <div>
                  <div className="mb-5 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent-soft text-accent">
                      <Sparkles className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-display text-xl text-ink">RoleFlow Genesis 1.5</h3>
                      <p className="text-xs text-muted">Our balanced flagship</p>
                    </div>
                  </div>
                  <p className="text-sm leading-relaxed text-muted">
                    Use it for general questions, system architecture, and creative writing. It supports the full range of effort levels.
                  </p>
                </div>
                <Link
                  href="/chat"
                  className="mt-8 inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-accent text-sm font-medium text-white transition-colors hover:bg-accent-hover"
                >
                  <span>Use Genesis 1.5</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>

              <div className="flex flex-col justify-between rounded-2xl border border-line bg-card p-7 sm:p-8">
                <div>
                  <div className="mb-5 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-hover text-ink">
                      <Zap className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-display text-xl text-ink">RoleFlow Flash 2.0</h3>
                      <p className="text-xs text-muted">Built for speed</p>
                    </div>
                  </div>
                  <p className="text-sm leading-relaxed text-muted">
                    Our fastest model for quick questions, small fixes, and rapid coding, with stronger reasoning than before. Low and Medium effort work best.
                  </p>
                </div>
                <Link
                  href="/chat"
                  className="mt-8 inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-line bg-app text-sm font-medium text-ink transition-colors hover:bg-hover"
                >
                  <span>Use Flash 2.0</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>

            <div className="mt-12 overflow-x-auto rounded-2xl border border-line bg-card">
              <table className="w-full min-w-[520px] text-left text-sm">
                <thead className="border-b border-line text-xs text-muted">
                  <tr>
                    <th scope="col" className="px-6 py-4 font-medium">Capability</th>
                    <th scope="col" className="px-6 py-4 font-medium text-ink">Apex 1.0</th>
                    <th scope="col" className="px-6 py-4 font-medium text-ink">Omni 1.0</th>
                    <th scope="col" className="px-6 py-4 font-medium text-ink">Genesis 1.5</th>
                    <th scope="col" className="px-6 py-4 font-medium text-ink">Flash 2.0</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line text-muted">
                  <tr>
                    <td className="px-6 py-4 font-medium text-ink">Best for</td>
                    <td className="px-6 py-4">Proofs, systems architecture, and exhaustive reviews</td>
                    <td className="px-6 py-4">Deep reasoning, advanced math, and hard engineering</td>
                    <td className="px-6 py-4">General intelligence, architecture, and writing</td>
                    <td className="px-6 py-4">Quick questions and fast iteration</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 font-medium text-ink">Effort levels</td>
                    <td className="px-6 py-4">Low, Medium, High, Extra, Max. Medium and above recommended</td>
                    <td className="px-6 py-4">Low, Medium, High, Extra, Max. Medium and above recommended</td>
                    <td className="px-6 py-4">Low, Medium, High, Extra, Max</td>
                    <td className="px-6 py-4">Low and Medium recommended</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 font-medium text-ink">Artifacts and ZIP download</td>
                    <td className="px-6 py-4">Yes</td>
                    <td className="px-6 py-4">Yes</td>
                    <td className="px-6 py-4">Yes</td>
                    <td className="px-6 py-4">Yes</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 font-medium text-ink">Project workspaces</td>
                    <td className="px-6 py-4">Yes</td>
                    <td className="px-6 py-4">Yes</td>
                    <td className="px-6 py-4">Yes</td>
                    <td className="px-6 py-4">Yes</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="border-t border-line/70 px-4 py-20 sm:px-6 lg:py-28">
          <div className="mx-auto max-w-5xl">
            <h2 className="mb-14 text-center font-display text-3xl font-normal tracking-tight text-ink sm:text-4xl">
              How it works
            </h2>
            <ol className="grid grid-cols-1 gap-10 md:grid-cols-3 md:gap-8">
              {STEPS.map((s) => (
                <li key={s.n} className="space-y-3">
                  <span className="font-display text-2xl text-accent">{s.n}</span>
                  <h3 className="text-base font-medium text-ink">{s.title}</h3>
                  <p className="text-sm leading-relaxed text-muted">{s.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="border-t border-line/70 bg-panel px-4 py-20 sm:px-6 lg:py-28">
          <div className="mx-auto max-w-3xl">
            <h2 className="mb-12 text-center font-display text-3xl font-normal tracking-tight text-ink sm:text-4xl">
              Frequently asked questions
            </h2>

            <div className="divide-y divide-line rounded-2xl border border-line bg-card">
              {FAQS.map((faq, idx) => {
                const open = activeFaq === idx;
                return (
                  <div key={faq.q}>
                    <button
                      type="button"
                      onClick={() => setActiveFaq(open ? null : idx)}
                      aria-expanded={open}
                      className="flex min-h-14 w-full items-center justify-between gap-4 px-5 py-4 text-left text-[15px] font-medium text-ink transition-colors hover:text-accent sm:px-6"
                    >
                      <span>{faq.q}</span>
                      <ChevronDown
                        className={`h-4 w-4 shrink-0 text-muted transition-transform duration-200 ${open ? "rotate-180" : ""}`}
                      />
                    </button>
                    {open && (
                      <div className="px-5 pb-5 text-sm leading-relaxed text-muted sm:px-6">{faq.a}</div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Closing CTA */}
        <section className="border-t border-line/70 px-4 py-20 text-center sm:px-6 lg:py-24">
          <div className="mx-auto max-w-2xl">
            <h2 className="font-display text-3xl font-normal tracking-tight text-ink sm:text-4xl">
              Start with a question
            </h2>
            <p className="mx-auto mt-4 max-w-md text-base leading-relaxed text-muted">
              No setup required. Try it in your browser and see what it builds.
            </p>
            <Link
              href="/chat"
              className="mt-8 inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-accent px-7 text-base font-medium text-white transition-colors hover:bg-accent-hover"
            >
              <span>Start chatting</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      </main>

      <Footer />

      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onSuccess={handleAuthSuccess}
      />
    </div>
  );
}
