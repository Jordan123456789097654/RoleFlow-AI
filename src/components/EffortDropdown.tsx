"use client";

import React, { useState, useRef, useEffect } from "react";
import { Check, AlertTriangle, ChevronDown } from "lucide-react";
import { EffortLevel } from "@/types";

interface EffortDropdownProps {
  effort: EffortLevel;
  onChange: (effort: EffortLevel) => void;
  /** Where the menu opens. "up" for the composer, "down" for the header. */
  placement?: "up" | "down";
}

const EFFORT_LABELS: Record<EffortLevel, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  extra: "Extra",
  max: "Max",
};

const OPTIONS: { value: EffortLevel; label: string; note?: "recommended" | "usage" }[] = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium", note: "recommended" },
  { value: "high", label: "High" },
  { value: "extra", label: "Extra" },
  { value: "max", label: "Max", note: "usage" },
];

export const EffortDropdown: React.FC<EffortDropdownProps> = ({
  effort,
  onChange,
  placement = "up",
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

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className="flex items-center gap-1 min-h-[36px] px-2.5 rounded-lg text-sm text-muted hover:text-ink hover:bg-hover transition-colors duration-150 outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
      >
        <span>{EFFORT_LABELS[effort]}</span>
        <ChevronDown className="w-4 h-4" strokeWidth={1.75} />
      </button>

      {isOpen && (
        <div
          role="listbox"
          className={`absolute right-0 w-[min(18rem,calc(100vw-2rem))] rounded-xl bg-card shadow-menu p-3 z-50 animate-message ${
            placement === "up" ? "bottom-full mb-2" : "top-full mt-2"
          }`}
        >
          <p className="text-xs leading-relaxed text-muted pb-2.5 mb-2 border-b border-line">
            Higher effort gives more thorough answers, but takes longer and uses your limits faster.
          </p>

          <div className="space-y-0.5">
            {OPTIONS.map((opt) => {
              const selected = effort === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  role="option"
                  aria-selected={selected}
                  onClick={() => {
                    onChange(opt.value);
                    setIsOpen(false);
                  }}
                  className="w-full flex items-center justify-between gap-2 px-2.5 py-2 rounded-lg text-sm text-ink hover:bg-hover transition-colors duration-150 text-left"
                >
                  <div className="flex items-center gap-2 flex-wrap">
                    <span>{opt.label}</span>
                    {opt.note === "recommended" && (
                      <span className="text-[11px] px-2 py-0.5 rounded-full border border-line text-muted">
                        Recommended
                      </span>
                    )}
                    {opt.note === "usage" && (
                      <span className="flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-accent-soft text-accent">
                        <AlertTriangle className="w-3 h-3" strokeWidth={1.75} />
                        <span>8× or more usage</span>
                      </span>
                    )}
                  </div>
                  {selected && <Check className="w-4 h-4 text-accent shrink-0" strokeWidth={2} />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
