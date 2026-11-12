"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import {
  Settings,
  Shield,
  Trash2,
  LogOut,
  User as UserIcon,
  Sparkles,
} from "lucide-react";
import { UserProfile } from "@/types";
import { formatCleanName } from "@/lib/format";

const ADMIN_EMAIL = "jordanedanield13@gmail.com";

interface UserAvatarMenuProps {
  user: UserProfile;
  onOpenSettings: () => void;
  onClearConversation?: () => void;
  onSignOut?: () => void;
  position?: "top-right" | "bottom-left";
}

export const UserAvatarMenu: React.FC<UserAvatarMenuProps> = ({
  user,
  onOpenSettings,
  onClearConversation,
  onSignOut,
  position = "top-right",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const isAdmin = Boolean(
    user.isAdmin || user.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase()
  );

  const cleanName = formatCleanName(user.name, user.email);
  const initial = cleanName.charAt(0).toUpperCase();

  // Close on outside click or escape key
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const popoverClasses =
    position === "bottom-left"
      ? "bottom-full left-0 mb-2"
      : "top-full right-0 mt-2";

  return (
    <div className="relative inline-block" ref={menuRef}>
      {/* Clickable Avatar Circle */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-8 h-8 rounded-full bg-[#262624] border border-[#383734] flex items-center justify-center text-xs font-semibold text-[#d97706] hover:border-[#d97706] hover:scale-105 active:scale-95 transition-all shadow-sm focus:outline-none"
        title={cleanName}
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        {initial}
      </button>

      {/* Sleek Floating Popover Menu */}
      {isOpen && (
        <div
          className={`absolute ${popoverClasses} w-64 rounded-2xl bg-[#1b1a19] border border-[#2e2d2b] shadow-2xl z-50 p-2 animate-in fade-in zoom-in-95 duration-150 text-[#e4e3de] select-none`}
        >
          {/* User Header */}
          <div className="px-3 py-2.5 border-b border-[#292826] flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-[#282725] border border-[#3b3a37] flex items-center justify-center text-xs font-bold text-[#d97706] shrink-0">
              {initial}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-semibold text-[#f4f4f0] truncate">
                  {cleanName}
                </span>
                {isAdmin && (
                  <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 shrink-0">
                    ADMIN
                  </span>
                )}
              </div>
              <div className="text-[11px] text-[#8e8d89] truncate" title={user.email}>
                {user.email}
              </div>
            </div>
          </div>

          {/* Action List */}
          <div className="py-1 space-y-0.5">
            {/* Settings */}
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                onOpenSettings();
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-[#cfcec9] hover:text-[#f4f4f0] hover:bg-[#252422] transition-colors"
            >
              <Settings className="w-4 h-4 text-[#9b9a97]" />
              <span>Settings</span>
            </button>

            {/* Admin Console (If Admin) */}
            {isAdmin && (
              <Link
                href="/admin"
                onClick={() => setIsOpen(false)}
                className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-amber-300 hover:text-amber-200 hover:bg-amber-500/10 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <Shield className="w-4 h-4 text-amber-400" />
                  <span>Admin Console</span>
                </div>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Ctrl
                </span>
              </Link>
            )}

            {/* Clear Conversation */}
            {onClearConversation && (
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  onClearConversation();
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-[#cfcec9] hover:text-[#f4f4f0] hover:bg-[#252422] transition-colors"
              >
                <Trash2 className="w-4 h-4 text-[#9b9a97]" />
                <span>Clear Conversation</span>
              </button>
            )}
          </div>

          {/* Sign Out Row */}
          {onSignOut && (
            <div className="pt-1 mt-1 border-t border-[#292826]">
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  onSignOut();
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors"
              >
                <LogOut className="w-4 h-4 text-rose-400" />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
