"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  Plus,
  Search,
  Pin,
  PinOff,
  FolderKanban,
  Settings,
  LogIn,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  Trash2,
  Shield,
  MessageSquare,
} from "lucide-react";
import { Chat, Project, UserProfile } from "@/types";
import { formatCleanName } from "@/lib/format";
import { Logo } from "./Logo";
import { UserAvatarMenu } from "./UserAvatarMenu";

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
  onClearConversation?: () => void;
}

type ChatGroup = { label: string; chats: Chat[] };

/** Buckets chats into Today, Previous 7 days, and Older, newest first. */
function groupChatsByDate(chats: Chat[]): ChatGroup[] {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const weekAgo = startOfToday - 6 * 24 * 60 * 60 * 1000;

  const buckets: Record<"today" | "week" | "older", Chat[]> = { today: [], week: [], older: [] };
  const sorted = [...chats].sort((a, b) => {
    const ta = new Date(b.updatedAt || b.createdAt).getTime() || 0;
    const tb = new Date(a.updatedAt || a.createdAt).getTime() || 0;
    return ta - tb;
  });

  for (const chat of sorted) {
    const t = new Date(chat.updatedAt || chat.createdAt).getTime() || 0;
    if (t >= startOfToday) buckets.today.push(chat);
    else if (t >= weekAgo) buckets.week.push(chat);
    else buckets.older.push(chat);
  }

  const groups: ChatGroup[] = [
    { label: "Today", chats: buckets.today },
    { label: "Previous 7 days", chats: buckets.week },
    { label: "Older", chats: buckets.older },
  ];
  return groups.filter((g) => g.chats.length > 0);
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
  onClearConversation,
}) => {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredChats = useMemo(
    () => chats.filter((c) => c.title.toLowerCase().includes(searchQuery.toLowerCase())),
    [chats, searchQuery]
  );

  const pinnedChats = filteredChats.filter((c) => c.pinned);
  const groups = useMemo(
    () => groupChatsByDate(filteredChats.filter((c) => !c.pinned)),
    [filteredChats]
  );

  const isAdmin = Boolean(user?.isAdmin);

  const rowClass = (active: boolean) =>
    `group flex items-center gap-2 min-h-[36px] pl-2.5 pr-1.5 rounded-lg text-sm cursor-pointer transition-colors duration-150 ${
      active ? "bg-hover text-ink" : "text-ink/80 hover:bg-hover hover:text-ink"
    }`;

  const iconBtn =
    "p-1.5 rounded-md text-muted hover:text-ink hover:bg-app transition-colors duration-150 outline-none focus-visible:ring-2 focus-visible:ring-accent/40";

  const renderChat = (chat: Chat) => (
    <div
      key={chat.id}
      className={rowClass(activeChatId === chat.id)}
      onClick={() => onSelectChat(chat.id)}
      aria-current={activeChatId === chat.id ? "true" : undefined}
    >
      <span className="truncate flex-1 min-w-0">{chat.title}</span>
      <div className="flex items-center gap-0.5 shrink-0 md:opacity-0 md:group-hover:opacity-100 focus-within:opacity-100 transition-opacity duration-150">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onTogglePinChat(chat.id);
          }}
          className={iconBtn}
          title={chat.pinned ? "Unpin chat" : "Pin chat"}
          aria-label={chat.pinned ? "Unpin chat" : "Pin chat"}
        >
          {chat.pinned ? <PinOff className="w-3.5 h-3.5" strokeWidth={1.75} /> : <Pin className="w-3.5 h-3.5" strokeWidth={1.75} />}
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDeleteChat(chat.id);
          }}
          className={`${iconBtn} hover:text-danger`}
          title="Delete chat"
          aria-label="Delete chat"
        >
          <Trash2 className="w-3.5 h-3.5" strokeWidth={1.75} />
        </button>
      </div>
    </div>
  );

  // Closed on desktop: a single floating button. On phones the header menu button handles this.
  if (!isOpen) {
    return (
      <div className="hidden md:block fixed top-3 left-3 z-40">
        <button
          type="button"
          onClick={onToggle}
          className="p-2 rounded-lg text-muted hover:text-ink hover:bg-hover transition-colors duration-150 outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
          title="Open sidebar"
          aria-label="Open sidebar"
        >
          <PanelLeftOpen className="w-5 h-5" strokeWidth={1.75} />
        </button>
      </div>
    );
  }

  return (
    <>
      {/* Scrim for the phone drawer */}
      <div
        className="md:hidden fixed inset-0 z-40 bg-ink/30"
        onClick={onToggle}
        aria-hidden="true"
      />

      <aside className="fixed md:static inset-y-0 left-0 z-50 md:z-auto w-[280px] md:w-[260px] h-full bg-panel flex flex-col shrink-0 border-r border-line md:border-r-0 shadow-menu md:shadow-none">
        {/* Top bar */}
        <div className="h-14 px-3 flex items-center justify-between">
          <Link href="/" title="RoleFlow home" className="px-1.5 outline-none focus-visible:ring-2 focus-visible:ring-accent/40 rounded">
            <Logo size={24} showText={false} />
          </Link>
          <button
            type="button"
            onClick={onToggle}
            className="p-2 rounded-lg text-muted hover:text-ink hover:bg-hover transition-colors duration-150 outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
            title="Close sidebar"
            aria-label="Close sidebar"
          >
            <PanelLeftClose className="w-5 h-5" strokeWidth={1.75} />
          </button>
        </div>

        {/* New chat */}
        <div className="px-3 pb-2">
          <button
            type="button"
            onClick={onNewChat}
            className="w-full flex items-center gap-2 min-h-[40px] px-2.5 rounded-lg text-sm text-ink hover:bg-hover transition-colors duration-150 outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
          >
            <Plus className="w-[18px] h-[18px]" strokeWidth={1.75} />
            <span>New chat</span>
          </button>
        </div>

        {/* Search */}
        <div className="px-3 pb-3">
          <div className="relative">
            <Search className="w-4 h-4 text-muted absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" strokeWidth={1.75} />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search chats"
              aria-label="Search chats"
              className="w-full min-h-[36px] bg-card text-sm text-ink placeholder:text-muted pl-8 pr-3 rounded-lg border border-line outline-none focus:border-accent/50 focus-visible:ring-2 focus-visible:ring-accent/30 transition-colors duration-150"
            />
          </div>
        </div>

        {/* Scrollable list */}
        <nav className="flex-1 overflow-y-auto px-2 pb-3 space-y-5">
          {pinnedChats.length > 0 && (
            <section>
              <h3 className="px-2.5 pb-1.5 text-xs font-medium text-muted">Pinned</h3>
              <div className="space-y-0.5">{pinnedChats.map(renderChat)}</div>
            </section>
          )}

          {groups.map((group) => (
            <section key={group.label}>
              <h3 className="px-2.5 pb-1.5 text-xs font-medium text-muted">{group.label}</h3>
              <div className="space-y-0.5">{group.chats.map(renderChat)}</div>
            </section>
          ))}

          {filteredChats.length === 0 && (
            <div className="flex flex-col items-center gap-2 py-8 text-center">
              <MessageSquare className="w-5 h-5 text-muted" strokeWidth={1.75} />
              <p className="text-xs text-muted">
                {searchQuery ? "No chats match your search" : "Your conversations will appear here"}
              </p>
            </div>
          )}

          {/* Projects */}
          <section>
            <div className="flex items-center justify-between px-2.5 pb-1.5">
              <h3 className="text-xs font-medium text-muted">Projects</h3>
              <button
                type="button"
                onClick={onCreateProject}
                className={iconBtn}
                title="New project"
                aria-label="New project"
              >
                <Plus className="w-3.5 h-3.5" strokeWidth={1.75} />
              </button>
            </div>
            <div className="space-y-0.5">
              {projects.map((proj) => (
                <button
                  key={proj.id}
                  type="button"
                  onClick={() => onSelectProject(proj.id)}
                  className={`w-full flex items-center gap-2 min-h-[36px] px-2.5 rounded-lg text-sm text-left transition-colors duration-150 ${
                    activeProjectId === proj.id
                      ? "bg-hover text-accent font-medium"
                      : "text-ink/80 hover:bg-hover hover:text-ink"
                  }`}
                >
                  <FolderKanban className="w-4 h-4 shrink-0" strokeWidth={1.75} />
                  <span className="truncate">{proj.name}</span>
                </button>
              ))}
            </div>
          </section>
        </nav>

        {/* Account */}
        <div className="p-3 border-t border-line">
          {user ? (
            <div className="flex items-center gap-2.5">
              <UserAvatarMenu
                user={user}
                onOpenSettings={onOpenSettings}
                onClearConversation={onClearConversation}
                onSignOut={onSignOut}
                position="bottom-left"
              />
              <button
                type="button"
                onClick={onOpenSettings}
                className="min-w-0 flex-1 text-left rounded-lg px-1 py-0.5 hover:bg-hover transition-colors duration-150 outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
              >
                <div className="text-sm font-medium text-ink truncate flex items-center gap-1.5">
                  <span className="truncate">{formatCleanName(user.name, user.email)}</span>
                  {isAdmin && (
                    <span className="text-[9px] font-mono font-semibold px-1 py-0.5 rounded bg-accent-soft text-accent shrink-0">
                      ADMIN
                    </span>
                  )}
                </div>
                <div className="text-xs text-muted truncate">{user.email}</div>
              </button>

              <div className="flex items-center shrink-0">
                {isAdmin && (
                  <Link href="/admin" className={iconBtn} title="Admin console" aria-label="Admin console">
                    <Shield className="w-4 h-4" strokeWidth={1.75} />
                  </Link>
                )}
                <button type="button" onClick={onOpenSettings} className={iconBtn} title="Settings" aria-label="Settings">
                  <Settings className="w-4 h-4" strokeWidth={1.75} />
                </button>
                <button
                  type="button"
                  onClick={onSignOut}
                  className={`${iconBtn} hover:text-danger`}
                  title="Sign out"
                  aria-label="Sign out"
                >
                  <LogOut className="w-4 h-4" strokeWidth={1.75} />
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-muted px-1">
                <span>Guest messages</span>
                <span className="font-medium text-accent">{guestMessagesRemaining} left</span>
              </div>
              <button
                type="button"
                onClick={onOpenAuth}
                className="w-full flex items-center justify-center gap-2 min-h-[40px] px-3 rounded-lg bg-accent hover:bg-accent-hover text-white text-sm font-medium transition-colors duration-150 outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
              >
                <LogIn className="w-4 h-4" strokeWidth={1.75} />
                <span>Sign in with email</span>
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};
