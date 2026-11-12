"use client";

import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, Sparkles, Zap, Check } from "lucide-react";
import { ModelId } from "@/types";

interface ModelSelectorProps {
  currentModel: ModelId;
  onSelect: (model: ModelId) => void;
}

export const ModelSelector: React.FC<ModelSelectorProps> = ({ currentModel, onSelect }) => {
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

  const models = [
    {
      id: "roleflow-genesis-1" as ModelId,
      name: "RoleFlow Genesis 1.0",
      badge: "Flagship",
      description: "Best for complex reasoning, architectural design & coding.",
      icon: Sparkles,
      color: "text-[#d97706]",
    },
    {
      id: "roleflow-flash-1" as ModelId,
      name: "RoleFlow Flash 1.0",
      badge: "Fast",
      description: "Ultra-fast response speed for quick questions and edits.",
      icon: Zap,
      color: "text-[#38bdf8]",
    },
  ];

  const activeModel = models.find((m) => m.id === currentModel) || models[0];

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-[#f3f3ee] hover:bg-[#262624] transition-colors border border-[#333230]"
      >
        <span>{activeModel.name}</span>
        <ChevronDown className="w-3.5 h-3.5 text-[#9b9a97]" />
      </button>

      {isOpen && (
        <div className="absolute left-0 mt-2 w-80 rounded-xl bg-[#202022] border border-[#333235] shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
          <div className="space-y-1">
            {models.map((model) => {
              const Icon = model.icon;
              const isSelected = model.id === currentModel;
              return (
                <button
                  key={model.id}
                  type="button"
                  onClick={() => {
                    onSelect(model.id);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-start gap-3 p-2.5 rounded-lg text-left transition-colors ${
                    isSelected ? "bg-[#2c2c30]" : "hover:bg-[#27272a]"
                  }`}
                >
                  <Icon className={`w-5 h-5 mt-0.5 shrink-0 ${model.color}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-[#f3f3ee]">
                        {model.name}
                      </span>
                      <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-[#333235] text-[#a1a1aa] font-semibold">
                        {model.badge}
                      </span>
                    </div>
                    <p className="text-xs text-[#9b9a97] mt-0.5 line-clamp-2">
                      {model.description}
                    </p>
                  </div>
                  {isSelected && <Check className="w-4 h-4 text-[#38bdf8] shrink-0 mt-1" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
