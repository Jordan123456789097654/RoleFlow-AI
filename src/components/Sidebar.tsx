"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Plus,
  Search,
  Pin,
  MessageSquare,
  FolderKanban,
  Settings,
  LogIn,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Trash2,
} from "lucide-react";
import { Chat, Project, UserProfile } from "@/types";
import { formatCleanName } from "@/lib/format";
import { Logo } from "./Logo";

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  chats: Chat[];
  activeChatId?: string;
  onSelectChat: (chatId: string) => void;
  onNewChat: () => void;
  onDeleteChat: (chatId: string) => void;
  onTogglePinChat: (chatId: string) => void;
  projects: Project[];
  activeProjectId?: string;
  onSelectProject: (projectId?: string) => void;
  onCreateProject: () => void;
  user: UserProfile | null;
  guestMessagesRemaining: number;
  onOpenAuth: () => void;
  onOpenSettings: () => void;
  onSignOut: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onToggle,
  chats,
  activeChatId,
  onSelectChat,
  onNewChat,
  onDeleteChat,
  onTogglePinChat,
  projects,
  activeProjectId,
  onSelectProject,
  onCreateProject,
  user,
  guestMessagesRemaining,
  onOpenAuth,
  onOpenSettings,
  onSignOut,
}) => {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredChats = chats.filter((c) =>
    c.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const pinnedChats = filteredChats.filter((c) => c.pinned);
  const unpinnedChats = filteredChats.filter((c) => !c.pinned);

  if (!isOpen) {
    return (
      <div className="fixed top-3 left-3 z-40">
        <button
          type="button"
          onClick={onToggle}
          className="p-2 rounded-xl bg-[#202022] hover:bg-[#2c2c30] text-[#9b9a97] hover:text-[#f3f3ee] border border-[#333235] transition-colors shadow-lg"
          title="Open Sidebar"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    );
  }

  return (
    <aside className="w-64 h-full bg-[#141413] border-r border-[#2a2927] flex flex-col z-40 shrink-0 transition-all duration-300">
      {/* Top Header */}
      <div className="h-14 px-3 flex items-center justify-between border-b border-[#242321]">
        <Link href="/" title="RoleFlow Home" className="hover:opacity-80 transition-opacity">
          <Logo size={24} />
        </Link>
        <button
          type="button"
          onClick={onToggle}
          className="p-1.5 rounded-lg text-[#9b9a97] hover:text-[#f3f3ee] hover:bg-[#22211f] transition-colors"
          title="Close Sidebar"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
      </div>

      {/* New Chat Button */}
      <div className="p-3">
        <button
          type="button"
          onClick={onNewChat}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-xl bg-[#22211f] hover:bg-[#2b2a28] text-[#f3f3ee] border border-[#302f2d] transition-colors text-sm font-medium shadow-sm"
        >
          <Plus className="w-4 h-4 text-[#d97706]" />
          <span>New Chat</span>
        </button>
      </div>

      {/* Search Input */}
      <div className="px-3 mb-2">
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-[#858480] absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search chats..."
            className="w-full bg-[#1b1a19] text-xs text-[#f3f3ee] placeholder-[#858480] pl-8 pr-3 py-2 rounded-lg border border-[#2e2d2b] focus:outline-none focus:border-[#4d4c52]"
          />
        </div>
      </div>

      {/* Chat List Scrollable */}
      <div className="flex-1 overflow-y-auto px-2 space-y-4">
        {/* Pinned Chats */}
        {pinnedChats.length > 0 && (
          <div>
            <div className="text-[11px] font-semibold text-[#858480] px-2 py-1 flex items-center gap-1.5 uppercase tracking-wider">
              <Pin className="w-3 h-3 text-[#d97706]" />
              <span>Pinned</span>
            </div>
            <div className="space-y-0.5 mt-1">
              {pinnedChats.map((chat) => (
                <div
                  key={chat.id}
                  className={`group flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                    activeChatId === chat.id
                      ? "bg-[#252422] text-[#f3f3ee] font-medium"
                      : "text-[#9b9a97] hover:bg-[#1d1c1a] hover:text-[#f3f3ee]"
                  }`}
                  onClick={() => onSelectChat(chat.id)}
                >
                  <span className="truncate">{chat.title}</span>
                  <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onTogglePinChat(chat.id);
                      }}
                      className="p-1 hover:text-[#f3f3ee]"
                      title="Unpin"
                    >
                      <Pin className="w-3 h-3 text-[#d97706]" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteChat(chat.id);
                      }}
                      className="p-1 hover:text-rose-400"
                      title="Delete"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Chats */}
        <div>
          <div className="text-[11px] font-semibold text-[#858480] px-2 py-1 uppercase tracking-wider">
            Recent Chats
          </div>
          {unpinnedChats.length === 0 ? (
            <div className="text-xs text-[#6e6d69] px-2 py-3 text-center">
              No chats yet
            </div>
          ) : (
            <div className="space-y-0.5 mt-1">
              {unpinnedChats.map((chat) => (
                <div
                  key={chat.id}
                  className={`group flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                    activeChatId === chat.id
                      ? "bg-[#252422] text-[#f3f3ee] font-medium"
                      : "text-[#9b9a97] hover:bg-[#1d1c1a] hover:text-[#f3f3ee]"
                  }`}
                  onClick={() => onSelectChat(chat.id)}
                >
                  <div className="flex items-center gap-2 truncate">
                    <MessageSquare className="w-3 h-3 shrink-0 text-[#858480]" />
                    <span className="truncate">{chat.title}</span>
                  </div>
                  <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onTogglePinChat(chat.id);
                      }}
                      className="p-1 hover:text-[#f3f3ee]"
                      title="Pin chat"
                    >
                      <Pin className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteChat(chat.id);
                      }}
                      className="p-1 hover:text-rose-400"
                      title="Delete chat"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Projects / Workspaces */}
        <div>
          <div className="flex items-center justify-between text-[11px] font-semibold text-[#858480] px-2 py-1 uppercase tracking-wider">
            <span>Projects</span>
            <button
              type="button"
              onClick={onCreateProject}
              className="hover:text-[#f3f3ee]"
              title="New project"
            >
              <Plus className="w-3 h-3" />
            </button>
          </div>
          <div className="space-y-0.5 mt-1">
            {projects.map((proj) => (
              <div
                key={proj.id}
                onClick={() => onSelectProject(proj.id)}
                className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs cursor-pointer transition-colors ${
                  activeProjectId === proj.id
                    ? "bg-[#252422] text-[#d97706] font-medium"
                    : "text-[#9b9a97] hover:bg-[#1d1c1a] hover:text-[#f3f3ee]"
                }`}
              >
                <FolderKanban className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{proj.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Profile / Auth Bar */}
      <div className="p-3 border-t border-[#242321] bg-[#11100f]">
        {user ? (
          <div className="flex items-center justify-between">
            <div
              className="flex items-center gap-2.5 cursor-pointer hover:opacity-80 transition-opacity truncate"
              onClick={onOpenSettings}
            >
              <div className="w-8 h-8 rounded-full bg-[#272624] border border-[#383734] flex items-center justify-center text-xs font-semibold text-[#d97706]">
                {formatCleanName(user.name, user.email).charAt(0).toUpperCase()}
              </div>
              <div className="truncate">
                <div className="text-xs font-medium text-[#f3f3ee] truncate flex items-center gap-1.5">
                  <span className="truncate">{formatCleanName(user.name, user.email)}</span>
                  {(Boolean(user.isAdmin) || user.email.toLowerCase() === "jordanedanield13@gmail.com") && (
                    <span className="text-[9px] font-mono font-semibold px-1 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 shrink-0">
                      ADMIN
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-[#858480] truncate">
                  {user.email}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={onOpenSettings}
                className="p-1.5 text-[#9b9a97] hover:text-[#f3f3ee] hover:bg-[#22211f] rounded-lg transition-colors"
                title="Settings & Instructions"
              >
                <Settings className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={onSignOut}
                className="p-1.5 text-[#9b9a97] hover:text-rose-400 hover:bg-[#22211f] rounded-lg transition-colors"
                title="Sign out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-[#858480]">
              <span>Guest Messages</span>
              <span className="text-[#d97706] font-semibold">
                {guestMessagesRemaining} left
              </span>
            </div>
            <button
              type="button"
              onClick={onOpenAuth}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-[#d97706] hover:bg-[#b45309] text-white text-xs font-medium transition-colors shadow-md"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign in with Email</span>
            </button>
          </div>
        )}
      </div>
    </aside>
  );
};
