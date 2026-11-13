"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  Pause,
  Play,
  Sparkles,
  Laptop,
  Smartphone,
  Layers,
  Monitor,
  Zap,
  ArrowRight,
} from "lucide-react";

export interface CatalogItem {
  id: string;
  badge: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  subtitle: string;
  description: string;
  image: string;
  alt: string;
}

const CATALOG_ITEMS: CatalogItem[] = [
  {
    id: "suite",
    badge: "The Full Suite",
    icon: Sparkles,
    title: "Thinking, writing, building",
    subtitle: "Meet RoleFlow",
    description:
      "Powered by RoleFlow Apex 1.0, Omni 1.0, Genesis 1.5, and Flash 2.0 with instant code previews and multi-step reasoning.",
    image: "/assets/catalog-meet-roleflow.jpg",
    alt: "RoleFlow Suite on dark laptop mockup",
  },
  {
    id: "workspace",
    badge: "Workspaces",
    icon: Laptop,
    title: "All your projects. In one place.",
    subtitle: "Isolated Project Workspaces & Memory",
    description:
      "Keep custom instructions, persistent files, and independent chats neatly organized for each project.",
    image: "/assets/catalog-projects.jpg",
    alt: "RoleFlow Project Workspaces on laptop mockup",
  },
  {
    id: "mobile",
    badge: "Mobile",
    icon: Smartphone,
    title: "AI power, on the go.",
    subtitle: "Ultra-fast response with Flash 2.0",
    description:
      "Full reasoning and instant answers engineered for on-the-go productivity on iOS and Android.",
    image: "/assets/catalog-mobile.jpg",
    alt: "RoleFlow on mobile smartphone mockup",
  },
  {
    id: "ecosystem",
    badge: "Cross-Device",
    icon: Layers,
    title: "Workflow, reimagined.",
    subtitle: "Unified Tablet & Mobile Experience",
    description:
      "Effortlessly move across devices without losing chat context, session state, or generated artifacts.",
    image: "/assets/catalog-ecosystem.jpg",
    alt: "RoleFlow Multi-Device iPad and iPhone ecosystem mockup",
  },
  {
    id: "display",
    badge: "Studio Canvas",
    icon: Monitor,
    title: "Bigger ideas. On a grander scale.",
    subtitle: "Expansive Desktop Canvas",
    description:
      "Widescreen side-by-side live code executions, interactive terminals, and full architecture planning.",
    image: "/assets/catalog-display.jpg",
    alt: "RoleFlow on curved studio desktop monitor",
  },
  {
    id: "focus",
    badge: "Deep Work",
    icon: Zap,
    title: "Distraction-free focus.",
    subtitle: "Pure Flow State",
    description:
      "Sleek obsidian theme, warm amber lighting, and an uncluttered composer designed for midnight coding sessions.",
    image: "/assets/catalog-focus.jpg",
    alt: "RoleFlow minimal dark laptop interface",
  },
];

const ROTATION_INTERVAL_MS = 5000;

export function ShowcaseCatalog() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [progress, setProgress] = useState(0);

  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  const nextSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % CATALOG_ITEMS.length);
    setProgress(0);
  }, []);

  const prevSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + CATALOG_ITEMS.length) % CATALOG_ITEMS.length);
    setProgress(0);
  }, []);

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
    setProgress(0);
  };

  // Auto-rotation and progress tick
  useEffect(() => {
    if (isPaused || isHovered) return;

    const tickInterval = 50; // update progress bar every 50ms
    const step = (tickInterval / ROTATION_INTERVAL_MS) * 100;

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          nextSlide();
          return 0;
        }
        return prev + step;
      });
    }, tickInterval);

    return () => clearInterval(interval);
  }, [isPaused, isHovered, nextSlide]);

  // Touch gesture handlers for mobile swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (touchStartX.current !== null && touchEndX.current !== null) {
      const diff = touchStartX.current - touchEndX.current;
      if (diff > 50) {
        nextSlide();
      } else if (diff < -50) {
        prevSlide();
      }
    }
    touchStartX.current = null;
    touchEndX.current = null;
  };

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowLeft") {
      prevSlide();
    } else if (e.key === "ArrowRight") {
      nextSlide();
    }
  };

  const activeItem = CATALOG_ITEMS[currentIndex];

  return (
    <div
      className="relative mx-auto w-full max-w-5xl"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      aria-label="RoleFlow Product Showcase Catalog"
    >
      {/* Ambient warm amber glow behind the catalog */}
      <div
        className="pointer-events-none absolute -inset-4 sm:-inset-8 -z-10 rounded-3xl bg-gradient-to-r from-amber-500/15 via-orange-500/20 to-amber-600/15 blur-2xl sm:blur-3xl transition-opacity duration-1000"
        style={{ opacity: isHovered ? 0.9 : 0.65 }}
        aria-hidden="true"
      />

      {/* Pill Navigation Bar */}
      <div className="mb-4 flex items-center justify-between gap-2 px-1">
        <div className="flex flex-1 items-center gap-1.5 overflow-x-auto pb-1.5 pt-1 scrollbar-none sm:justify-center">
          {CATALOG_ITEMS.map((item, index) => {
            const Icon = item.icon;
            const isActive = index === currentIndex;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => goToSlide(index)}
                className={`group relative flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium transition-all duration-200 ${
                  isActive
                    ? "bg-card text-ink shadow-sm border border-line"
                    : "text-muted hover:text-ink hover:bg-hover/60 border border-transparent"
                }`}
              >
                <Icon
                  className={`h-3.5 w-3.5 transition-colors ${
                    isActive ? "text-accent" : "text-muted group-hover:text-ink"
                  }`}
                />
                <span>{item.badge}</span>

                {/* Progress bar line under active pill */}
                {isActive && (
                  <span
                    className="absolute inset-x-2 -bottom-1 h-0.5 rounded-full bg-accent/70 transition-all duration-75"
                    style={{
                      width: isPaused ? "100%" : `${progress}%`,
                    }}
                    aria-hidden="true"
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* Play / Pause Toggle Button */}
        <button
          type="button"
          onClick={() => setIsPaused((prev) => !prev)}
          className="hidden sm:inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-line bg-card text-muted hover:text-ink transition-colors"
          title={isPaused ? "Resume auto-rotation" : "Pause auto-rotation"}
          aria-label={isPaused ? "Resume auto-rotation" : "Pause auto-rotation"}
        >
          {isPaused ? <Play className="h-3.5 w-3.5 fill-current" /> : <Pause className="h-3.5 w-3.5" />}
        </button>
      </div>

      {/* Main Showcase Frame */}
      <div
        className="relative overflow-hidden rounded-2xl sm:rounded-3xl border border-line bg-card shadow-2xl transition-all"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Aspect Ratio 16:9 Image Display Container */}
        <div className="relative aspect-[16/9] w-full overflow-hidden bg-[#0c0c0b]">
          {CATALOG_ITEMS.map((item, index) => {
            const isVisible = index === currentIndex;
            return (
              <div
                key={item.id}
                className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
                  isVisible ? "opacity-100 z-10 pointer-events-auto" : "opacity-0 z-0 pointer-events-none"
                }`}
                aria-hidden={!isVisible}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.image}
                  alt={item.alt}
                  loading={index === 0 ? "eager" : "lazy"}
                  className="h-full w-full object-cover select-none"
                />
              </div>
            );
          })}

          {/* Floating Left / Right Navigation Chevrons */}
          <button
            type="button"
            onClick={prevSlide}
            aria-label="Previous showcase slide"
            className="group absolute left-3 top-1/2 z-20 -translate-y-1/2 flex h-9 w-9 sm:h-11 sm:w-11 items-center justify-center rounded-full bg-black/45 backdrop-blur-md border border-white/15 text-white/85 shadow-lg transition-all hover:bg-black/75 hover:text-white hover:scale-105 active:scale-95"
          >
            <ChevronLeft className="h-5 w-5 sm:h-6 sm:w-6 transition-transform group-hover:-translate-x-0.5" />
          </button>

          <button
            type="button"
            onClick={nextSlide}
            aria-label="Next showcase slide"
            className="group absolute right-3 top-1/2 z-20 -translate-y-1/2 flex h-9 w-9 sm:h-11 sm:w-11 items-center justify-center rounded-full bg-black/45 backdrop-blur-md border border-white/15 text-white/85 shadow-lg transition-all hover:bg-black/75 hover:text-white hover:scale-105 active:scale-95"
          >
            <ChevronRight className="h-5 w-5 sm:h-6 sm:w-6 transition-transform group-hover:translate-x-0.5" />
          </button>

          {/* Slide Indicator Badge */}
          <div className="absolute right-4 top-4 z-20 flex items-center gap-1.5 rounded-full bg-black/55 backdrop-blur-md border border-white/10 px-2.5 py-1 text-[11px] font-mono tracking-wider text-white/80">
            <span>{String(currentIndex + 1).padStart(2, "0")}</span>
            <span className="text-white/40">/</span>
            <span className="text-white/50">{String(CATALOG_ITEMS.length).padStart(2, "0")}</span>
          </div>
        </div>

        {/* Caption & Quick CTA Footer */}
        <div className="flex flex-col gap-3 border-t border-line/80 bg-card/95 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <div className="space-y-0.5 text-left">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-accent">
                {activeItem.badge}
              </span>
              <span className="text-muted/40">·</span>
              <h3 className="font-display text-base font-normal text-ink sm:text-lg">
                {activeItem.title}
              </h3>
            </div>
            <p className="text-xs sm:text-sm text-muted line-clamp-1 sm:line-clamp-none">
              {activeItem.description}
            </p>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center">
            <Link
              href="/chat"
              className="inline-flex min-h-9 items-center gap-1.5 rounded-lg bg-accent px-3.5 text-xs font-medium text-white transition-colors hover:bg-accent-hover"
            >
              <span>Try in chat</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
