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
  Pencil,
  Download,
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
  onRenameChat?: (chatId: string, title: string) => void;
  onExportChat?: (chatId: string) => void;
}

/** Most recent first. */
function sortRecent(chats: Chat[]): Chat[] {
  const t = (c: Chat) => new Date(c.updatedAt || c.createdAt).getTime() || 0;
  return [...chats].sort((x, y) => t(y) - t(x));
}

/** Short stamp under each title, e.g. "Nov 13, 10:31". */
function formatStamp(value: string): string {
  const d = new Date(value);
  if (isNaN(d.getTime())) return "";
  const date = d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  const time = d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
  return `${date}, ${time}`;
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
  onRenameChat,
  onExportChat,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");

  const filteredChats = useMemo(
    () => chats.filter((c) => c.title.toLowerCase().includes(searchQuery.toLowerCase())),
    [chats, searchQuery]
  );

  const pinnedChats = filteredChats.filter((c) => c.pinned);
  const recent = useMemo(
    () => sortRecent(filteredChats.filter((c) => !c.pinned)),
    [filteredChats]
  );

  const isAdmin = Boolean(user?.isAdmin);

  const rowClass = (active: boolean) =>
    `group flex items-center gap-2 min-h-[38px] pl-3 pr-1.5 rounded-xl text-sm cursor-pointer transition-colors duration-150 ${
      active
        ? "bg-hover text-ink shadow-[inset_2px_0_0_0_rgb(var(--c-accent))]"
        : "text-ink/75 hover:bg-hover hover:text-ink"
    }`;

  const iconBtn =
    "p-1.5 rounded-md text-muted hover:text-ink hover:bg-app transition-colors duration-150 outline-none focus-visible:ring-2 focus-visible:ring-accent/40";

  const startRename = (chat: Chat) => {
    setEditingId(chat.id);
    setEditTitle(chat.title);
  };

  const commitRename = (chat: Chat) => {
    const next = editTitle.trim();
    setEditingId(null);
    if (next && next !== chat.title && onRenameChat) onRenameChat(chat.id, next.slice(0, 120));
  };

  const renderChat = (chat: Chat) => (
    <div
      key={chat.id}
      className={rowClass(activeChatId === chat.id)}
      onClick={() => {
        if (editingId !== chat.id) onSelectChat(chat.id);
      }}
      aria-current={activeChatId === chat.id ? "true" : undefined}
    >
      {editingId === chat.id ? (
        <input
          autoFocus
          value={editTitle}
          onChange={(e) => setEditTitle(e.target.value)}
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => {
            e.stopPropagation();
            if (e.key === "Enter") commitRename(chat);
            if (e.key === "Escape") setEditingId(null);
          }}
          onBlur={() => commitRename(chat)}
          maxLength={120}
          aria-label="Chat title"
          className="flex-1 min-w-0 min-h-[28px] bg-transparent text-sm text-ink outline-none border-b border-accent/50"
        />
      ) : (
        <span className="flex-1 min-w-0 flex flex-col py-1.5">
          <span className="truncate">{chat.title}</span>
          <span className="font-mono text-[10.5px] text-muted truncate">{formatStamp(chat.updatedAt || chat.createdAt)}</span>
        </span>
      )}
      <div className="flex items-center gap-0.5 shrink-0 md:opacity-0 md:group-hover:opacity-100 focus-within:opacity-100 transition-opacity duration-150">
        {onRenameChat && editingId !== chat.id && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              startRename(chat);
            }}
            className={iconBtn}
            title="Rename chat"
            aria-label="Rename chat"
          >
            <Pencil className="w-3.5 h-3.5" strokeWidth={1.75} />
          </button>
        )}
        {onExportChat && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onExportChat(chat.id);
            }}
            className={iconBtn}
            title="Export as Markdown"
            aria-label="Export chat as Markdown"
          >
            <Download className="w-3.5 h-3.5" strokeWidth={1.75} />
          </button>
        )}
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

  // Closed on desktop: a slim icon rail keeps the main actions one click away.
  // On phones the header menu button opens the drawer, so the rail stays hidden there.
  if (!isOpen) {
    const railBtn =
      "w-10 h-10 flex items-center justify-center rounded-xl text-muted hover:text-ink hover:bg-hover transition-colors duration-150 outline-none focus-visible:ring-2 focus-visible:ring-accent/40";
    return (
      <aside className="hidden md:flex w-[60px] h-full shrink-0 flex-col items-center gap-1.5 py-3 bg-panel border-r border-line">
        <Link
          href="/"
          title="RoleFlow home"
          aria-label="RoleFlow home"
          className="mb-2 p-1 rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
        >
          <Logo size={30} showText={false} />
        </Link>
        <button type="button" onClick={onToggle} className={railBtn} title="Open sidebar" aria-label="Open sidebar">
          <PanelLeftOpen className="w-5 h-5" strokeWidth={1.75} />
        </button>
        <button
          type="button"
          onClick={onNewChat}
          className="w-10 h-10 flex items-center justify-center rounded-xl bg-accent text-on-accent hover:bg-accent-hover transition-colors duration-150 outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
          title="New chat"
          aria-label="New chat"
        >
          <Plus className="w-5 h-5" strokeWidth={2} />
        </button>
        <button
          type="button"
          onClick={() => {
            onToggle();
            window.setTimeout(() => document.getElementById("chat-search")?.focus(), 60);
          }}
          className={railBtn}
          title="Search chats"
          aria-label="Search chats"
        >
          <Search className="w-5 h-5" strokeWidth={1.75} />
        </button>
        <div className="mt-auto">
          <button type="button" onClick={onOpenSettings} className={railBtn} title="Settings" aria-label="Settings">
            <Settings className="w-5 h-5" strokeWidth={1.75} />
          </button>
        </div>
      </aside>
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
          <Link href="/" title="RoleFlow home" className="flex items-center gap-2 px-1.5 py-1 outline-none focus-visible:ring-2 focus-visible:ring-accent/40 rounded-lg">
            <Logo size={26} showText={false} />
            <span className="font-display text-[19px] font-medium tracking-tight text-ink">RoleFlow</span>
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
            className="w-full flex items-center gap-2 min-h-[42px] px-3 rounded-xl text-sm font-semibold bg-accent text-on-accent hover:bg-accent-hover transition-colors duration-150 outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
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
              id="chat-search"
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search chats"
              aria-label="Search chats"
              className="w-full min-h-[38px] bg-card text-sm text-ink placeholder:text-muted pl-8 pr-3 rounded-xl border border-line outline-none focus:border-accent/50 focus-visible:ring-2 focus-visible:ring-accent/30 transition-colors duration-150"
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

          {recent.length > 0 && (
            <section>
              <h3 className="px-2.5 pb-1.5 text-xs font-medium text-muted">Recent</h3>
              <div className="space-y-0.5">{recent.map(renderChat)}</div>
            </section>
          )}

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
                className="w-full flex items-center justify-center gap-2 min-h-[40px] px-3 rounded-lg bg-accent hover:bg-accent-hover text-on-accent text-sm font-medium transition-colors duration-150 outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
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
