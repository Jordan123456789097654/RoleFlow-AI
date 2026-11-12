"use client";

import React from "react";
import { Share2, Sparkles, User as UserIcon } from "lucide-react";
import { EffortLevel, ModelId, Project, UserProfile } from "@/types";
import { formatCleanName } from "@/lib/format";
import { ModelSelector } from "./ModelSelector";
import { EffortDropdown } from "./EffortDropdown";

interface HeaderProps {
  model: ModelId;
  onModelChange: (model: ModelId) => void;
  effort: EffortLevel;
  onEffortChange: (effort: EffortLevel) => void;
  currentProject?: Project;
  hasMessages: boolean;
  onShare: () => void;
  user: UserProfile | null;
  onOpenAuth: () => void;
  onOpenSettings: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  model,
  onModelChange,
  effort,
  onEffortChange,
  currentProject,
  hasMessages,
  onShare,
  user,
  onOpenAuth,
  onOpenSettings,
}) => {
  return (
    <header className="h-14 px-4 border-b border-[#242321] bg-[#141413] flex items-center justify-between shrink-0 z-20">
      <div className="flex items-center gap-3">
        <ModelSelector currentModel={model} onSelect={onModelChange} />

        {currentProject && (
          <span className="text-xs px-2.5 py-1 rounded-lg bg-[#252422] text-[#d97706] font-medium border border-[#383734]">
            {currentProject.name}
          </span>
        )}
      </div>

      <div className="flex items-center gap-3">
        {hasMessages && (
          <button
            type="button"
            onClick={onShare}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-[#9b9a97] hover:text-[#f3f3ee] hover:bg-[#22211f] transition-colors border border-[#302f2d]"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Share</span>
          </button>
        )}

        <EffortDropdown effort={effort} onChange={onEffortChange} />

        {user ? (
          <button
            type="button"
            onClick={onOpenSettings}
            className="w-8 h-8 rounded-full bg-[#262624] border border-[#383734] flex items-center justify-center text-xs font-semibold text-[#d97706] hover:border-[#d97706] transition-colors"
            title={formatCleanName(user.name, user.email)}
          >
            {formatCleanName(user.name, user.email).charAt(0).toUpperCase()}
          </button>
        ) : (
          <button
            type="button"
            onClick={onOpenAuth}
            className="px-3 py-1.5 rounded-lg bg-[#f3f3ee] hover:bg-white text-[#141413] text-xs font-semibold transition-colors shadow"
          >
            Sign in
          </button>
        )}
      </div>
    </header>
  );
};
