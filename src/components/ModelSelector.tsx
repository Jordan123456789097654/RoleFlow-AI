"use client";

import React, { useState, useRef, useEffect, useLayoutEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { Brain, ChevronDown, Crown, Lock, Sparkles, Zap, Check } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { ModelId } from "@/types";
import { DEFAULT_MODEL, MODEL_IDS, getModelSpec, isGuestAllowedModel } from "@/lib/models";

interface ModelSelectorProps {
  currentModel: ModelId;
  onSelect: (model: ModelId) => void;
  /** Where the menu opens when there is room. "down" for the header, "up" for the composer. */
  placement?: "up" | "down";
  /** Signed-out users can pick only the guest model. Other models show a lock. */
  guest?: boolean;
  /** Called when a guest picks a locked model. The chat page opens the sign-in modal here. */
  onRequireAccount?: () => void;
}

const MODEL_ICONS: Record<ModelId, LucideIcon> = {
  "roleflow-apex-1": Crown,
  "roleflow-omni-1": Brain,
  "roleflow-genesis-1": Sparkles,
  "roleflow-flash-2": Zap,
};

// Ordered top tier first: Apex, Omni, Genesis (balanced flagship), Flash (ultra-fast).
const MODELS = MODEL_IDS.map((id) => {
  const spec = getModelSpec(id);
  return {
    id,
    name: spec.name,
    badge: spec.badge,
    description: spec.description,
    icon: MODEL_ICONS[id],
  };
});

/** Space the menu wants before it flips to the other side of the trigger. */
const PREFERRED_MENU_HEIGHT = 240;
const TRIGGER_GAP = 8;
/** Keeps the menu clear of the app header (h-14 = 56px) when it opens upward. */
const TOP_LIMIT = 64;
const VIEWPORT_MARGIN = 12;
const MENU_WIDTH = 320;

interface MenuPosition {
  left: number;
  width: number;
  maxHeight: number;
  top?: number;
  bottom?: number;
}

export const ModelSelector: React.FC<ModelSelectorProps> = ({
  currentModel,
  onSelect,
  placement = "down",
  guest = false,
  onRequireAccount,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [menuPos, setMenuPos] = useState<MenuPosition | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // The menu is portaled to <body> so no ancestor with overflow:hidden can clip it.
  // Its position is measured from the trigger, and it scrolls when the space is short.
  const computePosition = useCallback(() => {
    const trigger = triggerRef.current;
    if (!trigger) return;
    const r = trigger.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    const width = Math.min(MENU_WIDTH, vw - 32);
    const left = Math.min(Math.max(16, r.left), vw - width - 16);

    const spaceAbove = r.top - TRIGGER_GAP - TOP_LIMIT;
    const spaceBelow = vh - r.bottom - TRIGGER_GAP - VIEWPORT_MARGIN;

    const preferUp = placement === "up";
    const preferredSpace = preferUp ? spaceAbove : spaceBelow;
    const openUp = preferredSpace >= PREFERRED_MENU_HEIGHT ? preferUp : spaceAbove >= spaceBelow;
    const maxHeight = Math.max(120, openUp ? spaceAbove : spaceBelow);

    setMenuPos(
      openUp
        ? { left, width, maxHeight, bottom: vh - r.top + TRIGGER_GAP }
        : { left, width, maxHeight, top: r.bottom + TRIGGER_GAP }
    );
  }, [placement]);

  // Measure before paint when opening, and re-measure if the page moves or resizes.
  useLayoutEffect(() => {
    if (!isOpen) return;
    computePosition();
    window.addEventListener("resize", computePosition);
    window.addEventListener("scroll", computePosition, true);
    return () => {
      window.removeEventListener("resize", computePosition);
      window.removeEventListener("scroll", computePosition, true);
    };
  }, [isOpen, computePosition]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (wrapperRef.current?.contains(target) || menuRef.current?.contains(target)) return;
      setIsOpen(false);
    }
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setIsOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  const activeModel = MODELS.find((m) => m.id === currentModel) || MODELS.find((m) => m.id === DEFAULT_MODEL)!;

  return (
    <div className="relative inline-block text-left" ref={wrapperRef}>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className="flex items-center gap-1 min-h-[36px] px-2.5 rounded-lg text-sm font-medium text-ink hover:bg-hover transition-colors duration-150 outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
      >
        <span className="truncate max-w-[180px] sm:max-w-none">{activeModel.name}</span>
        <ChevronDown className="w-4 h-4 text-muted" strokeWidth={1.75} />
      </button>

      {isOpen &&
        menuPos &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            ref={menuRef}
            role="listbox"
            style={{
              position: "fixed",
              left: menuPos.left,
              width: menuPos.width,
              maxHeight: menuPos.maxHeight,
              top: menuPos.top,
              bottom: menuPos.bottom,
            }}
            className="overflow-y-auto overscroll-contain rounded-xl bg-card shadow-menu p-1.5 z-[60] animate-message"
          >
            {MODELS.map((model) => {
              const Icon = model.icon;
              const isSelected = model.id === currentModel;
              const locked = guest && !isGuestAllowedModel(model.id);
              return (
                <button
                  key={model.id}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  aria-disabled={locked || undefined}
                  onClick={() => {
                    setIsOpen(false);
                    if (locked) {
                      onRequireAccount?.();
                      return;
                    }
                    onSelect(model.id);
                  }}
                  className={`w-full flex items-start gap-3 p-2.5 rounded-lg text-left transition-colors duration-150 hover:bg-hover ${
                    locked ? "opacity-70" : ""
                  }`}
                >
                  <Icon className="w-[18px] h-[18px] mt-0.5 shrink-0 text-accent" strokeWidth={1.75} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-ink">{model.name}</span>
                      <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-hover text-muted font-semibold">
                        {model.badge}
                      </span>
                    </div>
                    <p className="text-xs text-muted mt-0.5 leading-relaxed">
                      {locked ? "Sign in to use this model." : model.description}
                    </p>
                  </div>
                  {locked && <Lock className="w-4 h-4 text-muted shrink-0 mt-1" strokeWidth={1.75} />}
                  {!locked && isSelected && <Check className="w-4 h-4 text-accent shrink-0 mt-1" strokeWidth={2} />}
                </button>
              );
            })}
            <p className="px-2.5 pt-2 pb-1 mt-1 border-t border-line text-[11px] text-muted leading-relaxed">
              {guest
                ? "Guests get 5 free messages on Flash. Sign in for 25 messages a day on every model."
                : "Free accounts get 25 messages a day across all four models."}
            </p>
          </div>,
          document.body
        )}
    </div>
  );
};
