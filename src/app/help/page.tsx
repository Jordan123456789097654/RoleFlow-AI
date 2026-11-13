"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Mail,
  Send,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  MessageSquare,
  Activity,
  Code2,
  Database,
  Key,
  ArrowRight,
  ShieldAlert,
  Sparkles,
} from "lucide-react";
import { BlogHeader } from "@/components/BlogHeader";
import { Footer } from "@/components/Footer";
import { FlowLine } from "@/components/FlowLine";

const CATEGORIES = [
  "General Support",
  "Bug Report / Edge Case",
  "Billing & Subscriptions",
  "Enterprise & Quota",
  "Product Feedback",
  "Security & Privacy",
] as const;

const QUICK_CARDS = [
  {
    icon: Activity,
    title: "System Status",
    desc: "Real-time telemetry, model uptime, and scheduled maintenance windows.",
    href: "https://status.roleflow.site",
    external: true,
  },
  {
    icon: Code2,
    title: "Interactive Artifacts",
    desc: "How live previews, sandboxed iframes, and one-click ZIP exports work.",
    href: "/blog/interactive-artifacts-deep-dive",
    external: false,
  },
  {
    icon: Database,
    title: "Memory & Workspaces",
    desc: "Managing context tiers, custom workspace instructions, and data privacy.",
    href: "/blog/persistent-workspace-memory",
    external: false,
  },
  {
    icon: Key,
    title: "API Keys & Routing",
    desc: "Generate keys, configure rate limits, and route to Apex and Flash tiers.",
    href: "/docs/api-keys",
    external: false,
  },
];

const FAQS = [
  {
    q: "Where does my message go when I submit this form?",
    a: "Your message is delivered immediately to staff@roleflow.site and assigned an inquiry ticket number. Our engineering and operations staff receive it directly with your email configured as the reply-to destination.",
  },
  {
    q: "How fast does the RoleFlow team respond?",
    a: "We review inquiries continuously. Critical service disruptions and account issues are addressed within a few hours; general questions and feature inquiries are typically resolved within 24 hours.",
  },
  {
    q: "Can I email you directly from my own email client?",
    a: "Yes! You can email staff@roleflow.site directly at any time from Gmail, Outlook, Apple Mail, or any client.",
  },
  {
    q: "How do I report a security vulnerability?",
    a: "Select 'Security & Privacy' in the category dropdown or email security@roleflow.site directly. We take all responsible disclosures seriously and investigate immediately.",
  },
];

export default function HelpPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [category, setCategory] = useState<string>(CATEGORIES[0]);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [honeypot, setHoneypot] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successRef, setSuccessRef] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !subject.trim() || !message.trim()) {
      setError("Please fill out all required fields.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/help/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          category,
          subject: subject.trim(),
          message: message.trim(),
          website_hp: honeypot,
        }),
      });

      const data = await res.json();
      if (!res.ok || data?.error) {
        throw new Error(data?.error || "Failed to deliver contact message.");
      }

      setSuccessRef(data.ref || "RF-SUCCESS");
      setName("");
      setEmail("");
      setSubject("");
      setMessage("");
    } catch (err: any) {
      setError(err?.message || "Could not send message. Please try emailing staff@roleflow.site directly.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-app text-ink">
      <BlogHeader />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden border-b border-line/80 py-16 sm:py-20">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -top-24 left-1/2 h-72 w-[42rem] -translate-x-1/2 rounded-full opacity-40 blur-3xl"
            style={{
              background: "radial-gradient(closest-side, rgb(var(--c-accent) / 0.18), transparent)",
            }}
          />

          <div className="relative mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-3.5 py-1 text-xs font-medium text-accent mb-4">
              <Mail className="h-3.5 w-3.5" />
              RoleFlow Help & Contact Desk
            </div>
            <h1 className="font-display text-4xl sm:text-5xl font-semibold tracking-tight text-ink mb-4">
              How Can We Help You?
            </h1>
            <p className="mx-auto max-w-2xl text-base text-muted sm:text-lg leading-relaxed">
              Have questions about RoleFlow v5, need technical assistance with artifacts, or want to report an
              edge-case bug? Dispatch a direct message to our staff team at{" "}
              <strong className="text-ink">staff@roleflow.site</strong>.
            </p>
          </div>
        </section>

        {/* Quick Links Section */}
        <section className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {QUICK_CARDS.map((card) => {
              const Icon = card.icon;
              const content = (
                <div className="group h-full rounded-2xl border border-line bg-card p-5 transition-all duration-200 hover:border-accent/40 hover:-translate-y-0.5 hover:shadow-lg flex flex-col justify-between">
                  <div>
                    <div className="h-10 w-10 rounded-xl bg-app border border-line flex items-center justify-center text-accent mb-3 group-hover:scale-105 transition-transform">
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="font-display text-sm font-semibold text-ink group-hover:text-accent transition-colors mb-1">
                      {card.title}
                    </h3>
                    <p className="text-xs text-muted leading-relaxed">
                      {card.desc}
                    </p>
                  </div>
                  <div className="pt-3 mt-3 border-t border-line/60 flex items-center gap-1 text-[11px] font-medium text-accent">
                    Learn more <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
                  </div>
                </div>
              );

              return card.external ? (
                <a key={card.title} href={card.href} target="_blank" rel="noopener noreferrer">
                  {content}
                </a>
              ) : (
                <Link key={card.title} href={card.href}>
                  {content}
                </Link>
              );
            })}
          </div>
        </section>

        {/* Wave Divider */}
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-2">
          <FlowLine className="opacity-70" />
        </div>

        {/* Contact Form Section */}
        <section className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-12">
          <div className="rounded-3xl border border-line bg-card/80 p-6 sm:p-10 backdrop-blur-sm shadow-xl">
            <div className="mb-8">
              <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-accent mb-2">
                <Send className="h-3.5 w-3.5" />
                Direct Staff Dispatch
              </div>
              <h2 className="font-display text-2xl sm:text-3xl font-semibold text-ink mb-2">
                Send a Message to Staff
              </h2>
              <p className="text-xs sm:text-sm text-muted">
                Messages submitted here are routed straight to{" "}
                <span className="font-mono text-accent">staff@roleflow.site</span>. We will respond directly to
                the email address you provide below.
              </p>
            </div>

            {successRef ? (
              <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-8 text-center space-y-4">
                <div className="mx-auto h-12 w-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
                <h3 className="font-display text-xl font-semibold text-ink">
                  Inquiry Dispatched Successfully!
                </h3>
                <p className="text-sm text-muted max-w-md mx-auto">
                  Your message has been assigned reference ticket{" "}
                  <code className="rounded bg-app border border-line px-2 py-0.5 font-mono text-ink font-semibold">
                    {successRef}
                  </code>{" "}
                  and forwarded directly to <strong className="text-ink">staff@roleflow.site</strong>.
                </p>
                <p className="text-xs text-muted">
                  We've also dispatched a receipt to your email. Our team will follow up with you shortly.
                </p>
                <div className="pt-4">
                  <button
                    type="button"
                    onClick={() => setSuccessRef(null)}
                    className="inline-flex items-center gap-2 rounded-xl bg-accent px-5 py-2 text-xs font-semibold text-on-accent hover:bg-accent-hover transition-colors"
                  >
                    Send another message
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                {error && (
                  <div className="flex items-center gap-2 rounded-xl border border-danger/30 bg-danger/10 p-3.5 text-xs text-danger">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                {/* Honeypot for bots (hidden) */}
                <input
                  type="text"
                  name="website_hp"
                  value={honeypot}
                  onChange={(e) => setHoneypot(e.target.value)}
                  className="hidden"
                  tabIndex={-1}
                  autoComplete="off"
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-muted">
                      Your Name <span className="text-accent">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Jane Doe"
                      className="w-full rounded-xl border border-line bg-app px-3.5 py-2.5 text-sm text-ink placeholder:text-muted/60 focus:border-accent/60 focus:outline-none transition-colors"
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-muted">
                      Your Email <span className="text-accent">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="jane@example.com"
                      className="w-full rounded-xl border border-line bg-app px-3.5 py-2.5 text-sm text-ink placeholder:text-muted/60 focus:border-accent/60 focus:outline-none transition-colors"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-muted">
                      Category
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full rounded-xl border border-line bg-app px-3.5 py-2.5 text-sm text-ink focus:border-accent/60 focus:outline-none transition-colors"
                    >
                      {CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-muted">
                      Subject <span className="text-accent">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      placeholder="e.g. Question about live artifact iframe sandboxing"
                      className="w-full rounded-xl border border-line bg-app px-3.5 py-2.5 text-sm text-ink placeholder:text-muted/60 focus:border-accent/60 focus:outline-none transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-muted">
                    Your Message <span className="text-accent">*</span>
                  </label>
                  <textarea
                    required
                    rows={6}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Describe your question, issue, or feedback in detail..."
                    className="w-full rounded-xl border border-line bg-app px-3.5 py-2.5 text-sm text-ink placeholder:text-muted/60 focus:border-accent/60 focus:outline-none transition-colors"
                  />
                </div>

                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-2">
                  <div className="text-[11px] text-muted">
                    Delivers to <strong className="text-ink">staff@roleflow.site</strong>. By submitting, you agree to our Terms.
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="inline-flex items-center gap-2 rounded-xl bg-accent px-6 py-2.5 text-sm font-semibold text-on-accent hover:bg-accent-hover transition-colors disabled:opacity-50"
                  >
                    {loading ? (
                      <>
                        <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4" />
                        Send to Staff
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </section>

        {/* FAQs */}
        <section className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-12 border-t border-line/60">
          <h3 className="font-display text-xl font-semibold text-ink mb-6 text-center">
            Frequently Asked Questions
          </h3>

          <div className="space-y-4">
            {FAQS.map((faq, i) => (
              <div key={i} className="rounded-2xl border border-line bg-card p-5">
                <h4 className="font-semibold text-sm text-ink mb-1.5 flex items-center gap-2">
                  <HelpCircle className="h-4 w-4 text-accent shrink-0" />
                  {faq.q}
                </h4>
                <p className="text-xs sm:text-sm text-muted leading-relaxed pl-6">
                  {faq.a}
                </p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
