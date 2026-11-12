"use client";

import React, { useState, useRef, useEffect } from "react";
import { Brain, ChevronDown, Crown, Sparkles, Zap, Check } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { ModelId } from "@/types";
import { DEFAULT_MODEL, MODEL_IDS, getModelSpec } from "@/lib/models";

interface ModelSelectorProps {
  currentModel: ModelId;
  onSelect: (model: ModelId) => void;
  /** Where the menu opens. "down" for the header, "up" for the composer. */
  placement?: "up" | "down";
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

export const ModelSelector: React.FC<ModelSelectorProps> = ({
  currentModel,
  onSelect,
  placement = "down",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
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
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className="flex items-center gap-1 min-h-[36px] px-2.5 rounded-lg text-sm font-medium text-ink hover:bg-hover transition-colors duration-150 outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
      >
        <span className="truncate max-w-[180px] sm:max-w-none">{activeModel.name}</span>
        <ChevronDown className="w-4 h-4 text-muted" strokeWidth={1.75} />
      </button>

      {isOpen && (
        <div
          role="listbox"
          className={`absolute left-0 w-[min(20rem,calc(100vw-2rem))] rounded-xl bg-card shadow-menu p-1.5 z-50 animate-message ${
            placement === "up" ? "bottom-full mb-2" : "top-full mt-2"
          }`}
        >
          {MODELS.map((model) => {
            const Icon = model.icon;
            const isSelected = model.id === currentModel;
            return (
              <button
                key={model.id}
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => {
                  onSelect(model.id);
                  setIsOpen(false);
                }}
                className="w-full flex items-start gap-3 p-2.5 rounded-lg text-left hover:bg-hover transition-colors duration-150"
              >
                <Icon className="w-[18px] h-[18px] mt-0.5 shrink-0 text-accent" strokeWidth={1.75} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-ink">{model.name}</span>
                    <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-hover text-muted font-semibold">
                      {model.badge}
                    </span>
                  </div>
                  <p className="text-xs text-muted mt-0.5 leading-relaxed">{model.description}</p>
                </div>
                {isSelected && <Check className="w-4 h-4 text-accent shrink-0 mt-1" strokeWidth={2} />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
