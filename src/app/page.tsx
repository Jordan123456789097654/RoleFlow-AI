"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/Logo";
import { Footer } from "@/components/Footer";
import { AuthModal } from "@/components/AuthModal";
import { UserProfile } from "@/types";
import { formatCleanName } from "@/lib/format";
import {
  Sparkles,
  ArrowRight,
  Code2,
  Cpu,
  Layers,
  Download,
  Play,
  Shield,
  Zap,
  Check,
  ChevronRight,
  Sliders,
  FolderKanban,
  FileCode2,
  Terminal,
  ExternalLink,
  ChevronDown,
  Lock,
  Globe,
  RefreshCw,
} from "lucide-react";

export default function MarketingLandingPage() {
  const router = useRouter();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [activeTab, setActiveTab] = useState<"preview" | "code">("preview");
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [effortLevel, setEffortLevel] = useState<"low" | "medium" | "high" | "max">("high");

  // Check saved user session
  useEffect(() => {
    const savedUser = localStorage.getItem("roleflow_user");
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        console.error("User parse error", e);
      }
    }
  }, []);

  const handleAuthSuccess = (authenticatedUser: UserProfile) => {
    setUser(authenticatedUser);
    localStorage.setItem("roleflow_user", JSON.stringify(authenticatedUser));
    setAuthModalOpen(false);
    router.push("/chat");
  };

  const sampleArtifactCode = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-[#121211] text-white flex items-center justify-center min-h-screen p-4">
  <div class="p-6 rounded-2xl bg-[#1c1b1a] border border-[#2e2d2b] shadow-2xl max-w-sm w-full">
    <div class="flex items-center justify-between mb-4">
      <span class="text-xs font-mono text-[#d97706] tracking-wide">ORBITFLOW ENGINE</span>
      <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
    </div>
    <h3 class="text-lg font-serif font-medium text-stone-100 mb-1">N-Body Gravitation</h3>
    <p class="text-xs text-stone-400 mb-4">Real-time Hamiltonian planetary physics simulation.</p>
    <div class="relative w-full h-44 rounded-xl bg-[#0a0a09] border border-[#262523] overflow-hidden flex items-center justify-center">
      <!-- Orbit rings -->
      <div class="absolute w-32 h-32 rounded-full border border-dashed border-[#d97706]/30 animate-spin" style="animation-duration: 12s"></div>
      <div class="absolute w-20 h-20 rounded-full border border-stone-800"></div>
      <div class="w-5 h-5 rounded-full bg-gradient-to-tr from-amber-500 to-orange-400 shadow-lg shadow-amber-500/50"></div>
      <div class="absolute w-2.5 h-2.5 rounded-full bg-sky-400 shadow-md shadow-sky-400/50 -top-1 left-16"></div>
    </div>
  </div>
</body>
</html>`;

  return (
    <div className="min-h-screen bg-[#141413] text-[#f4f4f0] selection:bg-[#d97706]/30 selection:text-[#fefefe] flex flex-col font-sans">
      {/* ─────────────────────────────────────────────────────────────
          1. NAVIGATION BAR
      ───────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 w-full bg-[#141413]/90 backdrop-blur-md border-b border-[#242321]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 hover:opacity-95 transition-opacity">
            <Logo size={28} />
          </Link>

          {/* Nav Links */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-[#9b9a97]">
            <a href="#features" className="hover:text-[#f4f4f0] transition-colors">
              Features
            </a>
            <a href="#artifacts" className="hover:text-[#f4f4f0] transition-colors">
              Artifacts
            </a>
            <a href="#models" className="hover:text-[#f4f4f0] transition-colors">
              Models
            </a>
            <a href="#pricing" className="hover:text-[#f4f4f0] transition-colors">
              Pricing
            </a>
            <a href="#faq" className="hover:text-[#f4f4f0] transition-colors">
              FAQ
            </a>
          </nav>

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            {user ? (
              <Link
                href="/chat"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#252422] text-[#f4f4f0] text-xs font-medium border border-[#383734] hover:bg-[#302f2d] transition-colors"
              >
                <span>Dashboard ({formatCleanName(user.name, user.email)})</span>
              </Link>
            ) : (
              <button
                type="button"
                onClick={() => setAuthModalOpen(true)}
                className="text-xs font-medium text-[#c5c4be] hover:text-[#f4f4f0] px-3 py-1.5 rounded-lg hover:bg-[#201f1e] transition-colors"
              >
                Sign In
              </button>
            )}

            <Link
              href="/chat"
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-[#d97706] to-[#ea580c] hover:from-[#f59e0b] hover:to-[#ea580c] text-white text-xs sm:text-sm font-medium shadow-lg shadow-amber-900/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <span>Launch RoleFlow</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* ─────────────────────────────────────────────────────────────
          2. HERO SECTION
      ───────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden pt-20 pb-24 lg:pt-28 lg:pb-32 claude-mesh-bg border-b border-[#222120]">
        {/* Ambient glow backgrounds */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-gradient-to-tr from-amber-500/10 via-orange-600/5 to-transparent blur-3xl pointer-events-none rounded-full" />

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          {/* Pill Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#1e1d1b] border border-[#33322f] shadow-sm mb-8 hover:border-[#4d4a44] transition-colors">
            <span className="flex h-2 w-2 rounded-full bg-[#d97706] animate-pulse" />
            <span className="text-xs font-medium text-[#f4f4f0]">
              ✨ RoleFlow Genesis 1.0 &amp; Flash 1.0 Now Live
            </span>
            <ChevronRight className="w-3.5 h-3.5 text-[#888782]" />
          </div>

          {/* Big Elegant Serif Headline */}
          <h1 className="font-serif text-4xl sm:text-6xl lg:text-7xl font-normal tracking-tight text-[#f4f4f0] leading-[1.12] mb-6">
            Next-generation intelligence for developers and builders.
          </h1>

          {/* Subtitle */}
          <p className="max-w-2xl mx-auto text-base sm:text-xl text-[#9b9a97] leading-relaxed mb-10 font-normal">
            An independent, high-precision AI assistant engineered for software architecture, coding,
            and intellectual inquiry.
          </p>

          {/* CTA Group */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-14">
            <Link
              href="/chat"
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-[#f4f4f0] hover:bg-white text-[#141413] text-sm sm:text-base font-semibold shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <span>Start Chatting Free</span>
              <ArrowRight className="w-4 h-4 text-[#141413]" />
            </Link>

            <a
              href="#features"
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-[#1c1b1a] hover:bg-[#252423] text-[#c5c4be] hover:text-[#f4f4f0] text-sm sm:text-base font-medium border border-[#2e2d2b] transition-colors"
            >
              <span>View Capabilities &amp; Docs</span>
            </a>
          </div>

          {/* Trust stats pill */}
          <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-10 text-xs text-[#807f7a] border-t border-[#222120] pt-8">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-400" />
              <span>Zero Model Training on Private Data</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-[#d97706]" />
              <span>Instant Client-Side Sandbox</span>
            </div>
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-sky-400" />
              <span>1-Click Production ZIP Export</span>
            </div>
          </div>
        </div>

        {/* ─────────────────────────────────────────────────────────────
            INTERACTIVE / VISUAL UI PREVIEW DASHBOARD
        ───────────────────────────────────────────────────────────── */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-14 relative z-10">
          <div className="rounded-2xl border border-[#2f2e2b] bg-[#171615] shadow-2xl shadow-black/80 overflow-hidden ring-1 ring-white/5">
            {/* Window Top Bar */}
            <div className="h-11 bg-[#1c1b1a] border-b border-[#282725] px-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[#ff5f56]/80" />
                <div className="w-3 h-3 rounded-full bg-[#ffbd2e]/80" />
                <div className="w-3 h-3 rounded-full bg-[#27c93f]/80" />
                <span className="ml-3 text-xs font-mono text-[#777672]">
                  roleflow.site/chat — Genesis 1.0 (Flagship 120B)
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-[#272624] text-[#d97706] border border-[#3b3a36]">
                  High Effort · Deep Reasoning
                </span>
                <span className="text-[11px] text-[#706f6b] hidden sm:inline">
                  Interactive Preview
                </span>
              </div>
            </div>

            {/* Split Screen Workspace: Left = Chat Flow, Right = Artifact Drawer */}
            <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[500px]">
              {/* Left Chat Flow (7 Cols) */}
              <div className="lg:col-span-7 p-6 border-b lg:border-b-0 lg:border-r border-[#262523] flex flex-col justify-between bg-[#141413]">
                <div className="space-y-5">
                  {/* User Message */}
                  <div className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-full bg-[#2a2927] border border-[#383734] flex items-center justify-center text-xs font-semibold text-[#f4f4f0] shrink-0 mt-0.5">
                      JD
                    </div>
                    <div className="space-y-1">
                      <div className="text-xs text-[#7d7c78] font-medium">Jordan Daniels</div>
                      <div className="text-sm text-[#e4e3de] bg-[#1e1d1b] border border-[#2b2a28] rounded-xl p-3.5 shadow-sm leading-relaxed">
                        Design an interactive N-Body Gravitation simulation with orbital velocity
                        vectors and real-time celestial particle collisions. Output as a complete
                        live artifact.
                      </div>
                    </div>
                  </div>

                  {/* Assistant Message with Reasoning Flow */}
                  <div className="flex items-start gap-3">
                    <div className="shrink-0 mt-0.5">
                      <Logo size={28} showText={false} />
                    </div>
                    <div className="space-y-3 w-full">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-[#d97706] font-medium">RoleFlow Genesis 1.0</span>
                        <span className="text-[10px] text-[#6d6c68]">• Thought for 3.4 seconds</span>
                      </div>

                      {/* Reasoning Process Block */}
                      <div className="p-3 rounded-lg bg-[#1a1918] border border-[#2a2927] text-xs text-[#9b9a97] space-y-1.5 font-mono">
                        <div className="flex items-center gap-1.5 text-emerald-400 text-[11px]">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                          <span>Physics Engine Breakdown:</span>
                        </div>
                        <p className="text-[11px] text-[#868580] leading-relaxed">
                          1. Formulating symplectic Euler integration for energy conservation.
                          <br />
                          2. Calculating gravitational vectors: F = G * (m1 * m2) / r^2.
                          <br />
                          3. Embedding canvas renderer with responsive sliders &amp; ZIP export.
                        </p>
                      </div>

                      <p className="text-sm text-[#cfcec9] leading-relaxed">
                        I have engineered the full gravitational sandbox inside an interactive
                        Artifact. You can test orbital stability, tune gravitational constants, and
                        download the complete codebase below.
                      </p>

                      {/* Artifact Card Trigger */}
                      <div className="p-3.5 rounded-xl bg-[#1d1c1a] border border-[#2f2e2b] flex items-center justify-between hover:border-[#d97706]/50 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-[#292825] text-[#d97706]">
                            <Code2 className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="text-xs font-semibold text-[#f4f4f0]">
                              OrbitFlow Gravitational Simulation
                            </div>
                            <div className="text-[11px] text-[#82817d]">
                              Interactive HTML5 / Tailwind Canvas Sandbox
                            </div>
                          </div>
                        </div>
                        <span className="text-xs px-2.5 py-1 rounded-md bg-[#2a2926] text-[#d97706] font-medium border border-[#3d3c38] flex items-center gap-1">
                          <Play className="w-3 h-3 fill-[#d97706]" />
                          Active
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Simulated Input Prompt */}
                <div className="mt-6 pt-4 border-t border-[#222120]">
                  <div className="p-3 rounded-xl bg-[#1b1a19] border border-[#2c2b29] flex items-center justify-between text-xs text-[#706f6b]">
                    <span>Ask a follow-up or command an architectural refactor...</span>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-[#252422] text-[#9b9a97] text-[10px]">
                        Return ↵
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Artifact Drawer (5 Cols) */}
              <div className="lg:col-span-5 bg-[#10100f] flex flex-col justify-between">
                {/* Drawer Tab Header */}
                <div className="h-11 px-4 border-b border-[#242321] flex items-center justify-between bg-[#151514]">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-[#d97706] font-medium">Artifact</span>
                    <span className="text-xs text-[#777672]">· orbitflow.html</span>
                  </div>

                  <div className="flex items-center gap-1 bg-[#1f1e1d] p-1 rounded-lg border border-[#2a2927]">
                    <button
                      type="button"
                      onClick={() => setActiveTab("preview")}
                      className={`px-2.5 py-0.5 rounded text-xs font-medium transition-colors ${
                        activeTab === "preview"
                          ? "bg-[#2d2c2a] text-[#f4f4f0]"
                          : "text-[#858480] hover:text-[#d0cfcb]"
                      }`}
                    >
                      Preview
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab("code")}
                      className={`px-2.5 py-0.5 rounded text-xs font-medium transition-colors ${
                        activeTab === "code"
                          ? "bg-[#2d2c2a] text-[#f4f4f0]"
                          : "text-[#858480] hover:text-[#d0cfcb]"
                      }`}
                    >
                      Code
                    </button>
                  </div>
                </div>

                {/* Tab Body */}
                <div className="flex-1 p-5 flex items-center justify-center overflow-hidden">
                  {activeTab === "preview" ? (
                    <div className="w-full max-w-xs space-y-4">
                      {/* Live Simulated Widget */}
                      <div className="p-5 rounded-2xl bg-[#191817] border border-[#2b2a28] shadow-xl text-center space-y-4">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-[11px] font-mono text-[#d97706] tracking-wide">
                            SIMULATION RUNNING
                          </span>
                          <span className="flex items-center gap-1 text-[10px] text-emerald-400">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                            60 FPS
                          </span>
                        </div>

                        {/* Visual Orbit Graphic */}
                        <div className="relative w-full h-40 rounded-xl bg-[#0b0b0a] border border-[#222120] flex items-center justify-center overflow-hidden">
                          {/* Pulsing Sun */}
                          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-500 to-orange-500 shadow-lg shadow-amber-500/50 flex items-center justify-center text-[10px] font-bold text-black z-10 animate-pulse">
                            ☀️
                          </div>
                          {/* Inner Orbit */}
                          <div
                            className="absolute w-24 h-24 rounded-full border border-[#d97706]/40 animate-spin"
                            style={{ animationDuration: "8s" }}
                          >
                            <div className="w-3 h-3 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400/50 -top-1.5 left-10" />
                          </div>
                          {/* Outer Orbit */}
                          <div
                            className="absolute w-36 h-36 rounded-full border border-dashed border-[#575652]/40 animate-spin"
                            style={{ animationDuration: "14s" }}
                          >
                            <div className="w-2.5 h-2.5 rounded-full bg-sky-400 shadow-sm shadow-sky-400/50 top-6 -left-1" />
                          </div>
                        </div>

                        {/* Interactive Sliders */}
                        <div className="space-y-2 pt-1 text-left">
                          <div className="flex justify-between text-[11px] text-[#9b9a97]">
                            <span>Solar Mass (G)</span>
                            <span className="font-mono text-[#f4f4f0]">1.989 × 10³⁰ kg</span>
                          </div>
                          <div className="w-full bg-[#272624] h-1.5 rounded-full overflow-hidden">
                            <div className="bg-[#d97706] h-full w-3/4 rounded-full" />
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* Code Tab */
                    <div className="w-full h-full max-h-72 overflow-y-auto rounded-xl bg-[#0c0c0b] p-3 text-left border border-[#222120] font-mono text-[11px] text-[#a6a5a0] leading-relaxed">
                      <pre>
                        <code>{sampleArtifactCode}</code>
                      </pre>
                    </div>
                  )}
                </div>

                {/* Artifact Action Bottom Bar */}
                <div className="p-3 bg-[#151514] border-t border-[#242321] flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 text-[#8c8b87]">
                    <Terminal className="w-3.5 h-3.5 text-[#d97706]" />
                    <span>Client Isolated Sandboxed iframe</span>
                  </div>
                  <Link
                    href="/chat"
                    className="flex items-center gap-1 px-3 py-1 rounded-md bg-[#252422] hover:bg-[#302f2d] text-[#f4f4f0] font-medium transition-colors border border-[#383734]"
                  >
                    <Download className="w-3 h-3 text-[#d97706]" />
                    <span>1-Click ZIP</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          3. FEATURE SHOWCASE
      ───────────────────────────────────────────────────────────── */}
      <section id="features" className="py-24 lg:py-32 border-b border-[#222120] relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <h2 className="text-xs uppercase tracking-widest text-[#d97706] font-semibold mb-3">
              Core Architecture
            </h2>
            <p className="font-serif text-3xl sm:text-5xl font-normal text-[#f4f4f0] tracking-tight mb-4">
              Designed for builders who value precision over noise.
            </p>
            <p className="text-sm sm:text-base text-[#9b9a97] leading-relaxed">
              Every detail of RoleFlow is meticulously engineered—from isolated client previews
              to deep effort controls and custom project memories.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1: Claude-Style Artifacts */}
            <div
              id="artifacts"
              className="p-8 rounded-2xl bg-[#171615] border border-[#282725] hover:border-[#3d3c38] transition-all group flex flex-col justify-between"
            >
              <div>
                <div className="w-12 h-12 rounded-xl bg-[#242321] border border-[#33322f] flex items-center justify-center text-[#d97706] mb-6 group-hover:scale-105 transition-transform">
                  <Code2 className="w-6 h-6" />
                </div>
                <h3 className="font-serif text-xl sm:text-2xl text-[#f4f4f0] mb-3">
                  Claude-Style Artifacts
                </h3>
                <p className="text-sm text-[#9b9a97] leading-relaxed mb-6">
                  Experience immediate, interactive HTML, JavaScript, CSS, and SVG sandboxes that render
                  live in an isolated preview pane alongside your conversation.
                </p>
              </div>
              <ul className="space-y-2.5 text-xs text-[#b8b7b2] border-t border-[#242321] pt-6">
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-[#d97706]" />
                  <span>Instant playable HTML/JS sandbox</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-[#d97706]" />
                  <span>1-click production ZIP download</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-[#d97706]" />
                  <span>Zero iframe leakage or cross-origin hazards</span>
                </li>
              </ul>
            </div>

            {/* Feature 2: Deep Reasoning & Effort Controls */}
            <div className="p-8 rounded-2xl bg-[#171615] border border-[#282725] hover:border-[#3d3c38] transition-all group flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-[#242321] border border-[#33322f] flex items-center justify-center text-[#d97706] mb-6 group-hover:scale-105 transition-transform">
                  <Sliders className="w-6 h-6" />
                </div>
                <h3 className="font-serif text-xl sm:text-2xl text-[#f4f4f0] mb-3">
                  Adaptive Effort Controls
                </h3>
                <p className="text-sm text-[#9b9a97] leading-relaxed mb-6">
                  Dial in your model&apos;s computational depth. Choose between Low, Medium, High, and
                  Max thinking effort to allocate exactly the reasoning tokens your problem demands.
                </p>
              </div>
              <div className="border-t border-[#242321] pt-6 space-y-3">
                <div className="grid grid-cols-4 gap-1.5 p-1 rounded-xl bg-[#1f1e1d] border border-[#2c2b29] text-[11px] text-center font-medium">
                  {(["low", "medium", "high", "max"] as const).map((lvl) => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => setEffortLevel(lvl)}
                      className={`py-1 rounded capitalize transition-all ${
                        effortLevel === lvl
                          ? "bg-[#d97706] text-white shadow-sm"
                          : "text-[#8a8985] hover:text-[#f4f4f0]"
                      }`}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
                <p className="text-[11px] text-[#787773] text-center">
                  {effortLevel === "low" && "⚡ Quick burst for minor fixes & syntax formatting"}
                  {effortLevel === "medium" && "⚖️ Balanced reasoning for everyday software engineering"}
                  {effortLevel === "high" && "🧠 Deep deductive analysis for distributed systems"}
                  {effortLevel === "max" && "🔬 Exhaustive proof verification & architecture audits"}
                </p>
              </div>
            </div>

            {/* Feature 3: Project Workspaces */}
            <div className="p-8 rounded-2xl bg-[#171615] border border-[#282725] hover:border-[#3d3c38] transition-all group flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-[#242321] border border-[#33322f] flex items-center justify-center text-[#d97706] mb-6 group-hover:scale-105 transition-transform">
                  <FolderKanban className="w-6 h-6" />
                </div>
                <h3 className="font-serif text-xl sm:text-2xl text-[#f4f4f0] mb-3">
                  Project Workspaces
                </h3>
                <p className="text-sm text-[#9b9a97] leading-relaxed mb-6">
                  Organize your inquiries into dedicated environments. Each workspace maintains custom
                  system instructions, architectural rules, and isolated chat histories.
                </p>
              </div>
              <ul className="space-y-2.5 text-xs text-[#b8b7b2] border-t border-[#242321] pt-6">
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-[#d97706]" />
                  <span>Custom instructions per repository or project</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-[#d97706]" />
                  <span>Isolated chat threads with pin and delete controls</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-[#d97706]" />
                  <span>Public read-only snapshot sharing for peers</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          4. MODEL FAMILY COMPARISON
      ───────────────────────────────────────────────────────────── */}
      <section id="models" className="py-24 lg:py-32 border-b border-[#222120] bg-[#111110]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-xs uppercase tracking-widest text-[#d97706] font-semibold mb-3">
              The RoleFlow Model Family
            </h2>
            <p className="font-serif text-3xl sm:text-5xl font-normal text-[#f4f4f0] tracking-tight mb-4">
              Two specialized engines. Zero compromises.
            </p>
            <p className="text-sm sm:text-base text-[#9b9a97] leading-relaxed">
              Choose Genesis 1.0 for deep intellectual inquiry and multi-step system design, or Flash 1.0
              for sub-second response times and real-time coding flow.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">
            {/* Model 1: RoleFlow Genesis 1.0 */}
            <div className="relative p-8 rounded-3xl bg-gradient-to-b from-[#1c1b19] to-[#151413] border-2 border-[#d97706]/40 shadow-2xl flex flex-col justify-between">
              <div className="absolute -top-3.5 right-8 px-3.5 py-1 rounded-full bg-[#d97706] text-white text-[11px] font-semibold uppercase tracking-wider shadow">
                Flagship Model
              </div>

              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-[#292824] flex items-center justify-center text-[#d97706]">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-serif text-2xl font-normal text-[#f4f4f0]">
                      RoleFlow Genesis 1.0
                    </h3>
                    <p className="text-xs text-[#8e8d89]">120B Frontier Mixture-of-Experts</p>
                  </div>
                </div>

                <p className="text-sm text-[#bfbeb9] leading-relaxed mb-6">
                  Engineered for software engineers, mathematicians, and architects tackling complex
                  problems. Excels at multi-file architecture, algorithmic proofs, and deep reasoning.
                </p>

                {/* Specs Grid */}
                <div className="grid grid-cols-3 gap-3 p-4 rounded-2xl bg-[#141413] border border-[#2b2a28] mb-6 text-center">
                  <div>
                    <span className="block text-[11px] text-[#73726e]">Parameters</span>
                    <span className="text-sm font-semibold text-[#f4f4f0]">120 Billion</span>
                  </div>
                  <div>
                    <span className="block text-[11px] text-[#73726e]">Context Window</span>
                    <span className="text-sm font-semibold text-[#f4f4f0]">128k Tokens</span>
                  </div>
                  <div>
                    <span className="block text-[11px] text-[#73726e]">Reasoning</span>
                    <span className="text-sm font-semibold text-[#d97706]">Exhaustive</span>
                  </div>
                </div>

                <div className="space-y-2.5 text-xs text-[#a3a29d] mb-6">
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-[#d97706]" />
                    <span>Multi-turn system refactorings and dependency graphs</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-[#d97706]" />
                    <span>Dynamic Claude-style Artifact creation with ZIP export</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-[#d97706]" />
                    <span>High and Max effort adaptive reasoning chains</span>
                  </div>
                </div>
              </div>

              <Link
                href="/chat"
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-[#d97706] hover:bg-[#b45309] text-white text-sm font-semibold transition-colors"
              >
                <span>Launch Genesis 1.0</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Model 2: RoleFlow Flash 1.0 */}
            <div className="p-8 rounded-3xl bg-[#171615] border border-[#282725] hover:border-[#383734] transition-all flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-[#242321] flex items-center justify-center text-sky-400">
                    <Zap className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-serif text-2xl font-normal text-[#f4f4f0]">
                      RoleFlow Flash 1.0
                    </h3>
                    <p className="text-xs text-[#8e8d89]">Ultra-Fast High-Efficiency Distillation</p>
                  </div>
                </div>

                <p className="text-sm text-[#bfbeb9] leading-relaxed mb-6">
                  Tuned for instant interactive workflows, rapid shell command generation, quick bug
                  fixes, and high-frequency code completions at near-zero latency.
                </p>

                {/* Specs Grid */}
                <div className="grid grid-cols-3 gap-3 p-4 rounded-2xl bg-[#121211] border border-[#222120] mb-6 text-center">
                  <div>
                    <span className="block text-[11px] text-[#73726e]">Latency</span>
                    <span className="text-sm font-semibold text-emerald-400">0.1s Burst</span>
                  </div>
                  <div>
                    <span className="block text-[11px] text-[#73726e]">Context Window</span>
                    <span className="text-sm font-semibold text-[#f4f4f0]">64k Tokens</span>
                  </div>
                  <div>
                    <span className="block text-[11px] text-[#73726e]">Speed</span>
                    <span className="text-sm font-semibold text-sky-400">180+ tok/s</span>
                  </div>
                </div>

                <div className="space-y-2.5 text-xs text-[#a3a29d] mb-6">
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-sky-400" />
                    <span>Near-instantaneous responses for rapid developer flow</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-sky-400" />
                    <span>Low and Medium reasoning effort optimization</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-sky-400" />
                    <span>Full compatibility with Project Workspaces</span>
                  </div>
                </div>
              </div>

              <Link
                href="/chat"
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-[#242321] hover:bg-[#2d2c29] text-[#f4f4f0] text-sm font-medium transition-colors border border-[#353431]"
              >
                <span>Launch Flash 1.0</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Model Comparison Matrix Table */}
          <div className="overflow-x-auto rounded-2xl border border-[#262523] bg-[#141413]">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-[#1a1918] text-[#8e8d89] uppercase tracking-wider text-[11px] border-b border-[#262523]">
                <tr>
                  <th className="py-4 px-6 font-medium">Capability</th>
                  <th className="py-4 px-6 font-medium text-[#d97706]">Genesis 1.0 (Flagship)</th>
                  <th className="py-4 px-6 font-medium text-sky-400">Flash 1.0 (Ultra-Fast)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#21201f] text-[#cfcec9]">
                <tr>
                  <td className="py-3.5 px-6 font-medium text-[#f4f4f0]">Primary Focus</td>
                  <td className="py-3.5 px-6">System Architecture &amp; Deep Inquiry</td>
                  <td className="py-3.5 px-6">Sub-second Speed &amp; Instant Fixes</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-6 font-medium text-[#f4f4f0]">Inference Speed</td>
                  <td className="py-3.5 px-6">~65 tokens/sec</td>
                  <td className="py-3.5 px-6 text-emerald-400 font-semibold">180+ tokens/sec</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-6 font-medium text-[#f4f4f0]">Effort Reasoning Levels</td>
                  <td className="py-3.5 px-6">Low, Medium, High, Max Thinking</td>
                  <td className="py-3.5 px-6">Low, Medium Adaptive</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-6 font-medium text-[#f4f4f0]">Artifacts Sandbox &amp; ZIP</td>
                  <td className="py-3.5 px-6">Supported (Full Sandbox)</td>
                  <td className="py-3.5 px-6">Supported (Full Sandbox)</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-6 font-medium text-[#f4f4f0]">Project Workspaces</td>
                  <td className="py-3.5 px-6">Unlimited contexts</td>
                  <td className="py-3.5 px-6">Unlimited contexts</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          5. PRICING & QUOTAS
      ───────────────────────────────────────────────────────────── */}
      <section id="pricing" className="py-24 lg:py-32 border-b border-[#222120]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <h2 className="text-xs uppercase tracking-widest text-[#d97706] font-semibold mb-3">
              Transparent Pricing
            </h2>
            <p className="font-serif text-3xl sm:text-5xl font-normal text-[#f4f4f0] tracking-tight mb-4">
              Predictable access for individuals and teams.
            </p>
            <p className="text-sm sm:text-base text-[#9b9a97] leading-relaxed">
              Start immediately with complimentary guest access. Authenticate via secure email OTP
              for unlimited persistent workflows.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Free Tier */}
            <div className="p-8 rounded-3xl bg-[#171615] border border-[#282725] flex flex-col justify-between">
              <div>
                <h3 className="text-lg font-medium text-[#f4f4f0] mb-1">Guest &amp; Starter</h3>
                <p className="text-xs text-[#8e8d89] mb-4">Try frontier AI without sign-up</p>
                <div className="mb-6">
                  <span className="font-serif text-4xl text-[#f4f4f0] font-normal">$0</span>
                  <span className="text-xs text-[#706f6b]"> / forever</span>
                </div>
                <ul className="space-y-3 text-xs text-[#a3a29d] mb-8">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span>5 complimentary guest messages</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span>Full access to Genesis 1.0 &amp; Flash 1.0</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span>Interactive Artifacts sandbox preview</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span>No credit card or setup required</span>
                  </li>
                </ul>
              </div>
              <Link
                href="/chat"
                className="w-full py-2.5 rounded-xl bg-[#252422] hover:bg-[#302f2d] text-[#f4f4f0] text-xs font-semibold text-center transition-colors border border-[#383734]"
              >
                Start Chatting Free
              </Link>
            </div>

            {/* Pro / Builder Tier */}
            <div className="relative p-8 rounded-3xl bg-gradient-to-b from-[#1c1b19] to-[#151413] border-2 border-[#d97706] shadow-2xl flex flex-col justify-between">
              <div className="absolute -top-3.5 right-8 px-3.5 py-1 rounded-full bg-[#d97706] text-white text-[11px] font-semibold uppercase tracking-wider">
                Most Popular
              </div>

              <div>
                <h3 className="text-lg font-medium text-[#f4f4f0] mb-1">Builder Pro</h3>
                <p className="text-xs text-[#8e8d89] mb-4">For active developers &amp; architects</p>
                <div className="mb-6">
                  <span className="font-serif text-4xl text-[#f4f4f0] font-normal">$20</span>
                  <span className="text-xs text-[#706f6b]"> / month</span>
                </div>
                <ul className="space-y-3 text-xs text-[#c5c4be] mb-8">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-[#d97706]" />
                    <span>Unlimited Genesis 1.0 &amp; Flash 1.0 chats</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-[#d97706]" />
                    <span>Max Effort deep reasoning allocation</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-[#d97706]" />
                    <span>Unlimited Project Workspaces &amp; memories</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-[#d97706]" />
                    <span>1-Click ZIP production artifact export</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-[#d97706]" />
                    <span>Priority cloud compute &amp; low latency</span>
                  </li>
                </ul>
              </div>
              <Link
                href="/chat"
                className="w-full py-2.5 rounded-xl bg-[#d97706] hover:bg-[#b45309] text-white text-xs font-semibold text-center transition-colors shadow-md"
              >
                Upgrade to Pro
              </Link>
            </div>

            {/* Enterprise Tier */}
            <div className="p-8 rounded-3xl bg-[#171615] border border-[#282725] flex flex-col justify-between">
              <div>
                <h3 className="text-lg font-medium text-[#f4f4f0] mb-1">Enterprise Cluster</h3>
                <p className="text-xs text-[#8e8d89] mb-4">Dedicated inference &amp; compliance</p>
                <div className="mb-6">
                  <span className="font-serif text-4xl text-[#f4f4f0] font-normal">Custom</span>
                </div>
                <ul className="space-y-3 text-xs text-[#a3a29d] mb-8">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span>Dedicated GPU cluster provisioning</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span>Zero Data Retention (ZDR) legal SLA</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span>Custom model fine-tuning on internal docs</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span>Dedicated enterprise engineering support</span>
                  </li>
                </ul>
              </div>
              <a
                href="mailto:support@roleflow.site?subject=Enterprise%20Cluster%20Inquiry"
                className="w-full py-2.5 rounded-xl bg-[#252422] hover:bg-[#302f2d] text-[#f4f4f0] text-xs font-semibold text-center transition-colors border border-[#383734]"
              >
                Contact Sales
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          6. FREQUENTLY ASKED QUESTIONS (FAQ)
      ───────────────────────────────────────────────────────────── */}
      <section id="faq" className="py-24 lg:py-32 border-b border-[#222120] bg-[#111110]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-xs uppercase tracking-widest text-[#d97706] font-semibold mb-3">
              Questions &amp; Answers
            </h2>
            <p className="font-serif text-3xl sm:text-4xl font-normal text-[#f4f4f0] tracking-tight">
              Everything you need to know about RoleFlow.
            </p>
          </div>

          <div className="space-y-4">
            {[
              {
                q: "What makes RoleFlow different from standard chat platforms?",
                a: "RoleFlow is built specifically for software engineers and intellectual inquiries. Unlike generic chatbots, RoleFlow features interactive Claude-style Artifacts (with live preview and 1-click ZIP export), adaptive reasoning effort controls (Low to Max), and project workspaces that retain dedicated custom instructions.",
              },
              {
                q: "How do Claude-Style Artifacts work?",
                a: "When RoleFlow generates web apps, games, UI components, or diagrams, it packages them into an interactive Artifact. You can run, test, and interact with the code in an isolated sandboxed iframe directly in your browser, or export a ready-to-deploy ZIP archive with a single click.",
              },
              {
                q: "Do you train foundational AI models on my code or conversations?",
                a: "No. RoleFlow operates under a strict privacy-first model: your prompts, uploaded files, and generated outputs are never used to train public or foundational models. Your intellectual property remains entirely yours.",
              },
              {
                q: "How does authentication work?",
                a: "We utilize modern passwordless authentication powered by Resend. Simply enter your email address to receive a secure 6-digit one-time passcode (OTP) or magic link. There are no vulnerable passwords stored on our servers.",
              },
              {
                q: "What are the Effort Levels (Low, Medium, High, Max)?",
                a: "Effort controls allocate reasoning computation. 'Low' produces rapid responses for quick syntax fixes; 'Medium' handles standard tasks; 'High' and 'Max' engage multi-step chain-of-thought verification for complex architectural design and mathematical proof analysis.",
              },
            ].map((faq, idx) => (
              <div
                key={idx}
                className="rounded-2xl bg-[#171615] border border-[#262523] overflow-hidden transition-colors"
              >
                <button
                  type="button"
                  onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
                  className="w-full p-5 text-left flex items-center justify-between text-sm sm:text-base font-medium text-[#f4f4f0] hover:text-[#d97706] transition-colors"
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-[#8a8985] transition-transform duration-200 ${
                      activeFaq === idx ? "rotate-180 text-[#d97706]" : ""
                    }`}
                  />
                </button>
                {activeFaq === idx && (
                  <div className="px-5 pb-5 text-xs sm:text-sm text-[#9b9a97] leading-relaxed border-t border-[#222120] pt-4">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          7. FINAL CALL-TO-ACTION BANNER
      ───────────────────────────────────────────────────────────── */}
      <section className="py-20 lg:py-28 relative overflow-hidden bg-gradient-to-b from-[#141413] via-[#1a1816] to-[#141413]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="inline-flex items-center gap-2 p-1.5 rounded-full bg-[#242320] border border-[#33322e] mb-6">
            <span className="w-2 h-2 rounded-full bg-[#d97706] animate-pulse" />
            <span className="text-xs text-[#d5d4ce] pr-2">Instant Guest Access Ready</span>
          </div>
          <h2 className="font-serif text-3xl sm:text-5xl font-normal text-[#f4f4f0] tracking-tight mb-6">
            Experience the future of code &amp; intelligence.
          </h2>
          <p className="text-sm sm:text-base text-[#9b9a97] max-w-xl mx-auto leading-relaxed mb-8">
            Launch RoleFlow in your browser right now. No setup, no credit card required.
            Build interactive artifacts in seconds.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/chat"
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl bg-[#d97706] hover:bg-[#b45309] text-white text-sm sm:text-base font-semibold shadow-lg shadow-amber-900/30 transition-all hover:scale-[1.02]"
            >
              <span>Launch RoleFlow Now</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          8. FOOTER
      ───────────────────────────────────────────────────────────── */}
      <Footer />

      {/* Auth Modal for Sign In */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onSuccess={handleAuthSuccess}
      />
    </div>
  );
}
