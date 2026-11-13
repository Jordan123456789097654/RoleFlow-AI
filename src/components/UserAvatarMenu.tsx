"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Settings, Shield, Trash2, LogOut, Activity } from "lucide-react";
import { UserProfile } from "@/types";
import { formatCleanName } from "@/lib/format";


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
    user.isAdmin
  );

  const cleanName = formatCleanName(user.name, user.email);
  const initial = cleanName.charAt(0).toUpperCase();

  // Close on outside click or Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const popoverPlacement =
    position === "bottom-left" ? "bottom-full left-0 mb-2" : "top-full right-0 mt-2";

  const itemClass =
    "w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm text-ink hover:bg-hover transition-colors duration-150 text-left";

  return (
    <div className="relative inline-block" ref={menuRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-9 h-9 rounded-full bg-accent text-on-accent flex items-center justify-center text-sm font-medium hover:bg-accent-hover transition-colors duration-150 outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
        title={cleanName}
        aria-haspopup="menu"
        aria-expanded={isOpen}
      >
        {initial}
      </button>

      {isOpen && (
        <div
          role="menu"
          className={`absolute ${popoverPlacement} w-64 rounded-xl bg-card shadow-menu z-50 p-1.5 text-ink select-none animate-message`}
        >
          {/* User header */}
          <div className="px-2.5 py-2.5 mb-1 border-b border-line flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-accent text-on-accent flex items-center justify-center text-sm font-medium shrink-0">
              {initial}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-medium truncate">{cleanName}</span>
                {isAdmin && (
                  <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-accent-soft text-accent shrink-0">
                    ADMIN
                  </span>
                )}
              </div>
              <div className="text-xs text-muted truncate" title={user.email}>
                {user.email}
              </div>
            </div>
          </div>

          <div className="space-y-0.5">
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setIsOpen(false);
                onOpenSettings();
              }}
              className={itemClass}
            >
              <Settings className="w-4 h-4 text-muted" strokeWidth={1.75} />
              <span>Settings</span>
            </button>

            <a
              href="https://status.roleflow.site"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setIsOpen(false)}
              className={itemClass}
            >
              <Activity className="w-4 h-4 text-muted" strokeWidth={1.75} />
              <span>System Status</span>
            </a>

            {isAdmin && (
              <Link
                href="/admin"
                role="menuitem"
                onClick={() => setIsOpen(false)}
                className={itemClass}
              >
                <Shield className="w-4 h-4 text-muted" strokeWidth={1.75} />
                <span>Admin console</span>
              </Link>
            )}

            {onClearConversation && (
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setIsOpen(false);
                  onClearConversation();
                }}
                className={itemClass}
              >
                <Trash2 className="w-4 h-4 text-muted" strokeWidth={1.75} />
                <span>Clear conversation</span>
              </button>
            )}
          </div>

          {onSignOut && (
            <div className="pt-1 mt-1 border-t border-line">
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setIsOpen(false);
                  onSignOut();
                }}
                className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm text-danger hover:bg-danger-soft transition-colors duration-150 text-left"
              >
                <LogOut className="w-4 h-4" strokeWidth={1.75} />
                <span>Sign out</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
