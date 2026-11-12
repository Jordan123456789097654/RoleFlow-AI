"use client";

import React from "react";
import { Menu, Share2 } from "lucide-react";
import { EffortLevel, ModelId, Project, UserProfile } from "@/types";
import { ModelSelector } from "./ModelSelector";
import { EffortDropdown } from "./EffortDropdown";
import { UserAvatarMenu } from "./UserAvatarMenu";

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
  onClearConversation?: () => void;
  onSignOut?: () => void;
  /** Opens the sidebar drawer. Shown on small screens only. */
  onToggleSidebar?: () => void;
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
  onClearConversation,
  onSignOut,
  onToggleSidebar,
}) => {
  return (
    <header className="h-14 px-3 sm:px-4 flex items-center justify-between gap-2 shrink-0 z-20 bg-app/90 backdrop-blur-sm">
      <div className="flex items-center gap-1 min-w-0">
        {onToggleSidebar && (
          <button
            type="button"
            onClick={onToggleSidebar}
            aria-label="Open sidebar"
            className="md:hidden p-2 -ml-1 rounded-lg text-muted hover:text-ink hover:bg-hover transition-colors duration-150 outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
          >
            <Menu className="w-5 h-5" strokeWidth={1.75} />
          </button>
        )}

        <ModelSelector currentModel={model} onSelect={onModelChange} placement="down" />

        {currentProject && (
          <span className="hidden sm:inline-flex text-xs px-2.5 py-1 rounded-full bg-accent-soft text-accent font-medium truncate max-w-[160px]">
            {currentProject.name}
          </span>
        )}
      </div>

      <div className="flex items-center gap-1 sm:gap-2 shrink-0">
        {hasMessages && (
          <button
            type="button"
            onClick={onShare}
            className="flex items-center gap-1.5 min-h-[36px] px-3 rounded-lg text-sm text-muted hover:text-ink hover:bg-hover transition-colors duration-150 outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
          >
            <Share2 className="w-4 h-4" strokeWidth={1.75} />
            <span className="hidden sm:inline">Share</span>
          </button>
        )}

        <div className="hidden sm:block">
          <EffortDropdown effort={effort} onChange={onEffortChange} placement="down" />
        </div>

        {user ? (
          <UserAvatarMenu
            user={user}
            onOpenSettings={onOpenSettings}
            onClearConversation={onClearConversation}
            onSignOut={onSignOut}
            position="top-right"
          />
        ) : (
          <button
            type="button"
            onClick={onOpenAuth}
            className="min-h-[36px] px-4 rounded-lg bg-ink text-app text-sm font-medium hover:opacity-90 transition-opacity duration-150 outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
          >
            Sign in
          </button>
        )}
      </div>
    </header>
  );
};
