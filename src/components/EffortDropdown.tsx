"use client";

import React, { useState, useRef, useEffect } from "react";
import { Check, AlertTriangle } from "lucide-react";
import { EffortLevel } from "@/types";

interface EffortDropdownProps {
  effort: EffortLevel;
  onChange: (effort: EffortLevel) => void;
}

export const EffortDropdown: React.FC<EffortDropdownProps> = ({ effort, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const effortLabels: Record<EffortLevel, string> = {
    low: "Low",
    medium: "Medium",
    high: "High",
    extra: "Extra",
    max: "Max",
  };

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="text-xs text-[#9b9a97] hover:text-[#f3f3ee] transition-colors py-1 px-2 rounded hover:bg-[#2b2a28] flex items-center gap-1.5"
      >
        <span>{effortLabels[effort]}</span>
        {effort === "medium" && (
          <span className="text-[10px] px-1 py-0.2 bg-[#2b2a28] text-[#9b9a97] rounded-full border border-[#3b3a37]">
            Rec
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 bottom-full mb-2 w-72 rounded-xl bg-[#202022] border border-[#333235] shadow-2xl p-3 z-50 animate-in fade-in zoom-in-95 duration-150">
          <p className="text-xs leading-relaxed text-[#9b9a97] mb-3 pb-2.5 border-b border-[#303033]">
            Higher effort means more thorough responses, but takes longer and uses your limits faster.
          </p>

          <div className="space-y-1">
            {/* Low */}
            <button
              type="button"
              onClick={() => {
                onChange("low");
                setIsOpen(false);
              }}
              className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-sm text-[#f3f3ee] hover:bg-[#2c2c30] transition-colors text-left"
            >
              <span>Low</span>
              {effort === "low" && <Check className="w-4 h-4 text-[#38bdf8]" />}
            </button>

            {/* Medium (Recommended) */}
            <button
              type="button"
              onClick={() => {
                onChange("medium");
                setIsOpen(false);
              }}
              className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-sm text-[#f3f3ee] hover:bg-[#2c2c30] transition-colors text-left"
            >
              <div className="flex items-center gap-2">
                <span>Medium</span>
                <span className="text-[11px] px-2 py-0.5 rounded-full border border-[#3f3f46] text-[#a1a1aa] font-normal">
                  Recommended
                </span>
              </div>
              {effort === "medium" && <Check className="w-4 h-4 text-[#38bdf8]" />}
            </button>

            {/* High */}
            <button
              type="button"
              onClick={() => {
                onChange("high");
                setIsOpen(false);
              }}
              className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-sm text-[#f3f3ee] hover:bg-[#2c2c30] transition-colors text-left"
            >
              <span>High</span>
              {effort === "high" && <Check className="w-4 h-4 text-[#38bdf8]" />}
            </button>

            {/* Extra */}
            <button
              type="button"
              onClick={() => {
                onChange("extra");
                setIsOpen(false);
              }}
              className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-sm text-[#f3f3ee] hover:bg-[#2c2c30] transition-colors text-left"
            >
              <span>Extra</span>
              {effort === "extra" && <Check className="w-4 h-4 text-[#38bdf8]" />}
            </button>

            {/* Max (with warning badge) */}
            <button
              type="button"
              onClick={() => {
                onChange("max");
                setIsOpen(false);
              }}
              className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-sm text-[#f3f3ee] hover:bg-[#2c2c30] transition-colors text-left"
            >
              <div className="flex items-center gap-2">
                <span>Max</span>
                <span className="flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-[#451a03]/40 border border-[#b45309]/50 text-[#f59e0b]">
                  <AlertTriangle className="w-3 h-3 text-[#f59e0b]" />
                  <span>8× or more usage</span>
                </span>
              </div>
              {effort === "max" && <Check className="w-4 h-4 text-[#38bdf8]" />}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
