"use client";

import React, { useState, useEffect, useRef } from "react";
import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { PromptBox } from "@/components/PromptBox";
import { MessageItem } from "@/components/MessageItem";
import { ArtifactsPanel } from "@/components/ArtifactsPanel";
import { AuthModal } from "@/components/AuthModal";
import { SettingsModal } from "@/components/SettingsModal";
import { formatCleanName, getTimeGreeting } from "@/lib/format";
import { DEFAULT_MODEL, GUEST_MODEL, isGuestAllowedModel, resolveModelId } from "@/lib/models";
import { CreateProjectModal } from "@/components/CreateProjectModal";
import { ShareModal } from "@/components/ShareModal";
import { Logo } from "@/components/Logo";
import { Toaster } from "@/components/Toaster";
import { toast } from "@/lib/toast";
import {
  Artifact,
  Attachment,
  Chat,
  EffortLevel,
  Message,
  ModelId,
  Project,
  UserProfile,
  UsageStats,
} from "@/types";
import { Code, Bug, Compass } from "lucide-react";

/** Messages a signed-out visitor can send before being asked to sign in. */
const GUEST_MESSAGE_LIMIT = 5;

/** Web search is offered only when the server has a search key. The client must opt in with this flag. */
const WEB_SEARCH_AVAILABLE = process.env.NEXT_PUBLIC_WEB_SEARCH_ENABLED === "true";

/** A chat as Markdown, for exporting. Sources are listed under the reply they support. */
function chatToMarkdown(chat: Chat): string {
  const lines: string[] = [`# ${chat.title}`, "", `Exported from RoleFlow on ${new Date().toLocaleString()}`, ""];
  for (const m of chat.messages) {
    lines.push(`## ${m.role === "user" ? "You" : "RoleFlow"}`, "");
    if (m.attachments && m.attachments.length > 0) {
      lines.push(`_Attached: ${m.attachments.map((a) => a.name).join(", ")}_`, "");
    }
    lines.push((m.content || "").trim(), "");
    if (m.sources && m.sources.length > 0) {
      lines.push("**Sources**", "");
      m.sources.forEach((src, i) => lines.push(`${i + 1}. [${src.title}](${src.url})`));
      lines.push("");
    }
  }
  return lines.join("\n");
}

/** One reply from /api/chat: the final payload when it succeeds, or the error details when it fails. */
interface ChatReplyResult {
  ok: boolean;
  status: number;
  data: any;
}

/**
 * Sends a chat request and reads its server-sent events. Text arrives through onDelta while the
 * reply is being written. Resolves with the final payload, or with the error the server reported.
 */
async function postChatStream(
  body: unknown,
  headers: Record<string, string>,
  onDelta: (text: string) => void,
  signal?: AbortSignal
): Promise<ChatReplyResult> {
  const outcome: { value: ChatReplyResult | null } = { value: null };

  const handleEvent = (raw: string) => {
    let event = "message";
    const dataLines: string[] = [];
    for (const line of raw.split("\n")) {
      if (line.startsWith("event:")) event = line.slice(6).trim();
      else if (line.startsWith("data:")) dataLines.push(line.slice(5).trimStart());
    }
    if (dataLines.length === 0) return;

    let payload: any;
    try {
      payload = JSON.parse(dataLines.join("\n"));
    } catch {
      return;
    }

    if (event === "delta") {
      if (typeof payload.text === "string" && payload.text) onDelta(payload.text);
    } else if (event === "done") {
      outcome.value = { ok: true, status: 200, data: payload };
    } else if (event === "error") {
      outcome.value = {
        ok: false,
        status: typeof payload.status === "number" ? payload.status : 500,
        data: payload,
      };
    }
  };

  try {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "text/event-stream", ...headers },
      body: JSON.stringify(body),
      signal,
    });

    // Not a stream (for example, an unexpected proxy response): read it as plain JSON.
    if (!(res.headers.get("content-type") || "").includes("text/event-stream") || !res.body) {
      const data = await res.json().catch(() => ({}));
      return { ok: res.ok, status: res.status, data };
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      let boundary = buffer.indexOf("\n\n");
      while (boundary !== -1) {
        handleEvent(buffer.slice(0, boundary));
        buffer = buffer.slice(boundary + 2);
        boundary = buffer.indexOf("\n\n");
      }
    }
    if (buffer.trim()) handleEvent(buffer);
  } catch (err: any) {
    if (err?.name === "AbortError") return { ok: false, status: 0, data: { aborted: true } };
    console.error("Chat stream failed:", err);
    if (!outcome.value) {
      return { ok: false, status: 0, data: { error: "The connection was interrupted. Please try again." } };
    }
  }

  return (
    outcome.value ?? {
      ok: false,
      status: 500,
      data: { error: "The reply ended before it was complete. Please try again." },
    }
  );
}

export default function ChatPage() {
  // Open by default on desktop. On phones the sidebar starts closed and opens as a drawer.
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (window.innerWidth >= 768) setSidebarOpen(true);
  }, []);
  const [model, setModel] = useState<ModelId>(DEFAULT_MODEL);
  const [effort, setEffort] = useState<EffortLevel>("medium");

  // User & Session Identity
  const [user, setUser] = useState<UserProfile | null>(null);
  // Signed-out users always run the guest model, whatever the selector last showed.
  const isGuest = !user;
  const activeModel: ModelId = isGuest && !isGuestAllowedModel(model) ? GUEST_MODEL : model;
  const [guestSessionId, setGuestSessionId] = useState<string>("");
  const [guestMessagesCount, setGuestMessagesCount] = useState(0);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [guestLimitReached, setGuestLimitReached] = useState(false);

  // Modals state
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [createProjectModalOpen, setCreateProjectModalOpen] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [usageStats, setUsageStats] = useState<UsageStats | null>(null);

  // Data state
  const [chats, setChats] = useState<Chat[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | undefined>(undefined);
  const [messages, setMessages] = useState<Message[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | undefined>(undefined);
  const [activeArtifact, setActiveArtifact] = useState<Artifact | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [thinkingSeconds, setThinkingSeconds] = useState(0);
  const [isLiveTyping, setIsLiveTyping] = useState(false);
  const thinkingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const [webSearchOn, setWebSearchOn] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    return () => {
      if (thinkingTimerRef.current) clearInterval(thinkingTimerRef.current);
    };
  }, []);

  // Restore or initialize user/guest identity
  useEffect(() => {
    let currentUserId = "";

    // Check saved user
    const savedUser = localStorage.getItem("roleflow_user");
    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        setUser(parsed);
        currentUserId = parsed.id;
      } catch (e) {
        console.error("Failed to parse saved user", e);
      }
    } else {
      const match = document.cookie.match(/roleflow_user=([^;]+)/);
      if (match && match[1]) {
        try {
          const parsed = JSON.parse(decodeURIComponent(match[1]));
          setUser(parsed);
          localStorage.setItem("roleflow_user", JSON.stringify(parsed));
          currentUserId = parsed.id;
        } catch (e) {
          console.error("Cookie parse error", e);
        }
      }
    }

    // Guest isolation: unique persistent ID per browser
    if (!currentUserId) {
      let guestId = localStorage.getItem("roleflow_guest_id");
      if (!guestId) {
        guestId = "guest_" + Math.random().toString(36).substring(2, 12);
        localStorage.setItem("roleflow_guest_id", guestId);
      }
      setGuestSessionId(guestId);
      currentUserId = guestId;
    }

    const savedGuestCount = localStorage.getItem("roleflow_guest_count");
    if (savedGuestCount) {
      setGuestMessagesCount(parseInt(savedGuestCount, 10) || 0);
    }

    // Fetch user-restricted chats
    fetchUserChats(currentUserId);
    fetchProjects();
  }, []);

  const getEffectiveUserId = () => {
    return user?.id || guestSessionId;
  };

  const fetchUserChats = async (userId?: string) => {
    const idToUse = userId || getEffectiveUserId();
    if (!idToUse) return;

    try {
      const res = await fetch(`/api/chats?userId=${encodeURIComponent(idToUse)}`, {
        headers: { "x-user-id": idToUse },
      });
      const data = await res.json();
      if (data.chats) setChats(data.chats);
    } catch (err) {
      console.error("Fetch chats error:", err);
    }
  };

  const fetchProjects = async () => {
    try {
      const res = await fetch("/api/projects");
      const data = await res.json();
      if (data.projects) setProjects(data.projects);
    } catch (err) {
      console.error("Fetch projects error:", err);
    }
  };

  useEffect(() => {
    if (messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isLoading]);

  const getGreeting = () => {
    const timeGreeting = getTimeGreeting().toLowerCase();
    const userName = formatCleanName(user?.name, user?.email);
    return `Good ${timeGreeting}, ${userName}`;
  };

  const handleSelectChat = (chatId: string) => {
    const chat = chats.find((c) => c.id === chatId);
    if (chat) {
      setCurrentChatId(chat.id);
      setMessages(chat.messages);
      // Chats saved under a retired model ID open on its successor.
      setModel(resolveModelId(chat.model) ?? DEFAULT_MODEL);
      setEffort(chat.effort);
      setSelectedProjectId(chat.projectId);

      const latestMsgWithArt = [...chat.messages].reverse().find((m) => m.artifact);
      if (latestMsgWithArt && latestMsgWithArt.artifact) {
        setActiveArtifact(latestMsgWithArt.artifact);
      } else {
        setActiveArtifact(null);
      }
    }
  };

  const handleNewChat = () => {
    setCurrentChatId(undefined);
    setMessages([]);
    setActiveArtifact(null);
  };

  const handleDeleteChat = async (chatId: string) => {
    const effectiveUserId = getEffectiveUserId();
    try {
      await fetch(`/api/chats/${chatId}?userId=${encodeURIComponent(effectiveUserId)}`, {
        method: "DELETE",
        headers: { "x-user-id": effectiveUserId },
      });
      setChats((prev) => prev.filter((c) => c.id !== chatId));
      if (currentChatId === chatId) {
        handleNewChat();
      }
    } catch (err) {
      console.error("Delete chat error:", err);
    }
  };

  const handleTogglePinChat = async (chatId: string) => {
    const chat = chats.find((c) => c.id === chatId);
    if (!chat) return;

    const effectiveUserId = getEffectiveUserId();
    try {
      const res = await fetch(`/api/chats/${chatId}?userId=${encodeURIComponent(effectiveUserId)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", "x-user-id": effectiveUserId },
        body: JSON.stringify({ pinned: !chat.pinned }),
      });
      const data = await res.json();
      if (data.chat) {
        setChats((prev) => prev.map((c) => (c.id === chatId ? data.chat : c)));
      }
    } catch (err) {
      console.error("Pin chat error:", err);
    }
  };

  /**
   * Sends the conversation and streams the reply into the chat. Used for new messages, edits,
   * and regenerations. Text appears as the server produces it.
   */
  const requestAssistantReply = async (history: Message[]) => {
    const startedAt = Date.now();
    const stopThinking = () => {
      if (thinkingTimerRef.current) {
        clearInterval(thinkingTimerRef.current);
        thinkingTimerRef.current = null;
      }
    };

    setIsLoading(true);
    setThinkingSeconds(0);
    stopThinking();
    thinkingTimerRef.current = setInterval(() => {
      setThinkingSeconds((Date.now() - startedAt) / 1000);
    }, 100);

    const effectiveUserId = getEffectiveUserId();
    const activeProject = projects.find((p) => p.id === selectedProjectId);
    const placeholderId = "stream-" + Date.now();
    let streaming = false;
    let streamedText = "";
    const controller = new AbortController();
    abortRef.current = controller;

    const onDelta = (text: string) => {
      streamedText += text;
      if (!streaming) {
        // The first text replaces the "Thinking" indicator with the reply itself.
        streaming = true;
        stopThinking();
        setIsLoading(false);
        setIsLiveTyping(true);
        setMessages((prev) => [
          ...prev,
          { id: placeholderId, role: "assistant", content: text, createdAt: new Date().toISOString() },
        ]);
        return;
      }
      setMessages((prev) =>
        prev.map((m) => (m.id === placeholderId ? { ...m, content: m.content + text } : m))
      );
    };

    const removePlaceholder = () => {
      if (streaming) setMessages((prev) => prev.filter((m) => m.id !== placeholderId));
      streaming = false;
    };

    try {
      const reply = await postChatStream(
        {
          userId: effectiveUserId,
          userEmail: user?.email,
          chatId: currentChatId,
          messages: history,
          model: activeModel,
          effort,
          projectId: selectedProjectId,
          customInstructions: user?.customInstructions || activeProject?.customInstructions,
          webSearch: webSearchOn,
        },
        {
          "x-user-id": effectiveUserId,
          "x-user-email": user?.email || "",
        },
        onDelta,
        controller.signal
      );
      stopThinking();

      if (reply.data?.aborted) {
        // The user pressed Stop. Keep what was written so far, marked as stopped.
        const partial = streamedText.trim();
        if (partial) {
          const stoppedMessage: Message = {
            id: placeholderId,
            role: "assistant",
            content: partial,
            stopped: true,
            createdAt: new Date().toISOString(),
          };
          if (streaming) {
            setMessages((prev) => prev.map((m) => (m.id === placeholderId ? stoppedMessage : m)));
          } else {
            setMessages((prev) => [...prev, stoppedMessage]);
          }
        } else {
          removePlaceholder();
          toast("Stopped", "info");
        }
        return;
      }

      const data = reply.data;
      if (!reply.ok) {
        removePlaceholder();
        if (data.isBanned) {
          const banMessage: Message = {
            id: "msg-" + Date.now(),
            role: "assistant",
            content:
              data.error ||
              "This account has been suspended under RoleFlow's Acceptable Use Policy regarding critical safety violations.",
            moderationBlocked: true,
            moderationTier: 1,
            canAppeal: false,
            createdAt: new Date().toISOString(),
          };
          setMessages((prev) => [...prev, banMessage]);
          return;
        }
        if (reply.status === 429) {
          if (!user || data.guestLimitReached) {
            setGuestLimitReached(true);
            setAuthModalOpen(true);
          }
          if (data.usage) {
            setUsageStats(data.usage);
          }
          throw new Error(data.error || "Message limit reached.");
        }
        throw new Error(data.error || "Failed to generate");
      }

      if (data.usage) {
        setUsageStats(data.usage);
        if (user) {
          setUser((prev) => (prev ? { ...prev, messageCount: data.usage.used } : prev));
        } else {
          setGuestMessagesCount(data.usage.used);
          localStorage.setItem("roleflow_guest_count", data.usage.used.toString());
        }
      }

      const finalElapsed = Number(((Date.now() - startedAt) / 1000).toFixed(1));
      if (data.message) {
        const finalMessage: Message = {
          ...data.message,
          thinkingTime: data.message.thinkingTime || finalElapsed,
        };
        // The final message replaces the streamed text. It carries the cleaned content, artifact and files.
        if (streaming) {
          setMessages((prev) => prev.map((m) => (m.id === placeholderId ? finalMessage : m)));
        } else {
          setMessages((prev) => [...prev, finalMessage]);
        }
        if (finalMessage.artifact) {
          setActiveArtifact(finalMessage.artifact);
        }
      }

      if (!currentChatId && data.chatId) {
        setCurrentChatId(data.chatId);
      }

      fetchUserChats(effectiveUserId);
    } catch (err: any) {
      stopThinking();
      removePlaceholder();
      console.error("Chat error:", err);
      toast("The reply failed. You can try again.", "error");
      const errorMessage: Message = {
        id: "msg-" + Date.now(),
        role: "assistant",
        content: err.message || "I encountered an error connecting to the model network. Please retry.",
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      abortRef.current = null;
      setIsLiveTyping(false);
      setIsLoading(false);
    }
  };

  const handleSendMessage = async (
    content: string,
    attachments: Attachment[],
    overrideBaseMessages?: Message[]
  ) => {
    if (!user && guestMessagesCount >= GUEST_MESSAGE_LIMIT) {
      setGuestLimitReached(true);
      setAuthModalOpen(true);
      return;
    }

    const userMessage: Message = {
      id: "msg-" + Date.now(),
      role: "user",
      content,
      attachments: attachments.length > 0 ? attachments : undefined,
      createdAt: new Date().toISOString(),
    };

    const base = overrideBaseMessages || messages;
    const newMessages = [...base, userMessage];
    setMessages(newMessages);

    if (!user) {
      const updatedCount = guestMessagesCount + 1;
      setGuestMessagesCount(updatedCount);
      localStorage.setItem("roleflow_guest_count", updatedCount.toString());
    }

    await requestAssistantReply(newMessages);
  };

  const handleEditMessage = (messageId: string, newContent: string) => {
    const index = messages.findIndex((m) => m.id === messageId);
    if (index === -1) return;

    const truncated = messages.slice(0, index);
    setMessages(truncated);
    handleSendMessage(newContent, [], truncated);
  };

  const handleRegenerate = () => {
    if (messages.length < 2) return;
    const trimmed = messages.slice(0, -1);
    setMessages(trimmed);
    void requestAssistantReply(trimmed);
  };

  const handleStop = () => {
    abortRef.current?.abort();
  };

  /** Starts a new chat from an assistant reply. The current chat is left as it was. */
  const handleBranch = (messageId: string) => {
    if (isLoading) return;
    const index = messages.findIndex((m) => m.id === messageId);
    if (index === -1) return;
    setCurrentChatId(undefined);
    setMessages(messages.slice(0, index + 1));
    setActiveArtifact(null);
    toast("Branched into a new chat. Your original chat is unchanged.", "success");
  };

  const handleRenameChat = async (chatId: string, title: string) => {
    const effectiveUserId = getEffectiveUserId();
    const previousTitle = chats.find((c) => c.id === chatId)?.title;
    setChats((prev) => prev.map((c) => (c.id === chatId ? { ...c, title } : c)));
    try {
      const res = await fetch(`/api/chats/${chatId}?userId=${encodeURIComponent(effectiveUserId)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", "x-user-id": effectiveUserId },
        body: JSON.stringify({ title }),
      });
      const data = await res.json();
      if (!res.ok || !data.chat) throw new Error(data.error || "Rename failed");
      setChats((prev) => prev.map((c) => (c.id === chatId ? data.chat : c)));
      toast("Chat renamed", "success");
    } catch (err) {
      console.error("Rename chat error:", err);
      setChats((prev) => prev.map((c) => (c.id === chatId && previousTitle ? { ...c, title: previousTitle } : c)));
      toast("Could not rename the chat. Please try again.", "error");
    }
  };

  const handleExportChat = (chatId: string) => {
    const chat = chats.find((c) => c.id === chatId);
    if (!chat) return;
    try {
      const blob = new Blob([chatToMarkdown(chat)], { type: "text/markdown;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const slug = chat.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "chat";
      const link = document.createElement("a");
      link.href = url;
      link.download = `${slug}.md`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      toast("Chat exported as Markdown", "success");
    } catch (err) {
      console.error("Export chat error:", err);
      toast("Could not export the chat.", "error");
    }
  };

  // Keyboard shortcuts: Ctrl/Cmd+Shift+O new chat, Ctrl/Cmd+K search chats, Ctrl/Cmd+/ focus the composer, Esc stops a reply.
  const anyModalOpen = authModalOpen || settingsModalOpen || createProjectModalOpen || shareModalOpen;
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      const key = e.key.toLowerCase();
      if (mod && e.shiftKey && key === "o") {
        e.preventDefault();
        if (!isLoading) handleNewChat();
        return;
      }
      if (mod && !e.shiftKey && key === "k") {
        e.preventDefault();
        setSidebarOpen(true);
        window.setTimeout(() => document.getElementById("chat-search")?.focus(), 60);
        return;
      }
      if (mod && !e.shiftKey && e.key === "/") {
        e.preventDefault();
        document.getElementById("composer-input")?.focus();
        return;
      }
      if (e.key === "Escape" && isLoading && !anyModalOpen) {
        handleStop();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const handleAuthSuccess = (authenticatedUser: UserProfile) => {
    setUser(authenticatedUser);
    localStorage.setItem("roleflow_user", JSON.stringify(authenticatedUser));
    setGuestLimitReached(false);
    fetchUserChats(authenticatedUser.id);
  };

  const handleSignOut = () => {
    setUser(null);
    setUsageStats(null);
    localStorage.removeItem("roleflow_user");
    document.cookie = "roleflow_user=; Max-Age=0; path=/;";
    // Re-init guest chats
    const guestId = "guest_" + Math.random().toString(36).substring(2, 12);
    setGuestSessionId(guestId);
    localStorage.setItem("roleflow_guest_id", guestId);
    fetchUserChats(guestId);
  };

  const starterChips = [
    { icon: Code, text: "Build an interactive HTML5 game" },
    { icon: Bug, text: "Write and optimize a Python algorithm" },
    { icon: Compass, text: "Design a high-scale microservice architecture" },
  ];

  const activeProject = projects.find((p) => p.id === selectedProjectId);

  // Free-limit line under the composer. Hidden for unlimited accounts.
  let usageNote: string | null = null;
  if (!user) {
    const limit = usageStats?.limit ?? GUEST_MESSAGE_LIMIT;
    const remaining = usageStats ? usageStats.remaining : Math.max(0, GUEST_MESSAGE_LIMIT - guestMessagesCount);
    usageNote = `${remaining} of ${limit} free messages left · Sign in for more on every model`;
  } else if (usageStats && !usageStats.isUnlimited) {
    usageNote = `${usageStats.remaining} of ${usageStats.limit} messages left today`;
  }

  const composer = (
    <PromptBox
      onSend={handleSendMessage}
      isLoading={isLoading}
      model={activeModel}
      onModelChange={setModel}
      guest={isGuest}
      onRequireAccount={() => setAuthModalOpen(true)}
      effort={effort}
      onEffortChange={setEffort}
      projects={projects}
      selectedProjectId={selectedProjectId}
      onProjectChange={setSelectedProjectId}
      onCreateProject={() => setCreateProjectModalOpen(true)}
      usageNote={usageNote}
      usageMeter={!user || !usageStats || usageStats.isUnlimited ? null : { used: usageStats.used, limit: usageStats.limit }}
      onStop={handleStop}
      webSearchAvailable={WEB_SEARCH_AVAILABLE}
      webSearchEnabled={webSearchOn}
      onWebSearchToggle={() => setWebSearchOn((on) => !on)}
    />
  );

  return (
    <div className="flex h-[100dvh] w-screen overflow-hidden bg-app text-ink">
      {/* Sidebar: a fixed drawer on phones, a column on desktop */}
      <Sidebar
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        chats={chats}
        activeChatId={currentChatId}
        onSelectChat={(id) => {
          handleSelectChat(id);
          if (typeof window !== "undefined" && window.innerWidth < 768) setSidebarOpen(false);
        }}
        onNewChat={handleNewChat}
        onDeleteChat={handleDeleteChat}
        onTogglePinChat={handleTogglePinChat}
        onRenameChat={handleRenameChat}
        onExportChat={handleExportChat}
        projects={projects}
        activeProjectId={selectedProjectId}
        onSelectProject={setSelectedProjectId}
        onCreateProject={() => setCreateProjectModalOpen(true)}
        user={user}
        guestMessagesRemaining={Math.max(0, GUEST_MESSAGE_LIMIT - guestMessagesCount)}
        onOpenAuth={() => {
          setGuestLimitReached(false);
          setAuthModalOpen(true);
        }}
        onOpenSettings={() => setSettingsModalOpen(true)}
        onSignOut={handleSignOut}
        onClearConversation={handleNewChat}
      />

      {/* Main column */}
      <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden relative">
        <Header
          model={activeModel}
          onModelChange={setModel}
          guest={isGuest}
          onRequireAccount={() => setAuthModalOpen(true)}
          effort={effort}
          onEffortChange={setEffort}
          currentProject={activeProject}
          hasMessages={messages.length > 0}
          onShare={() => setShareModalOpen(true)}
          user={user}
          onOpenAuth={() => {
            setGuestLimitReached(false);
            setAuthModalOpen(true);
          }}
          onOpenSettings={() => setSettingsModalOpen(true)}
          onClearConversation={handleNewChat}
          onSignOut={handleSignOut}
          onToggleSidebar={() => setSidebarOpen(true)}
        />

        {messages.length === 0 ? (
          /* Empty state: greeting and composer centered in the viewport */
          <div className="flex-1 overflow-y-auto">
            <div className="min-h-full flex flex-col items-center justify-center px-4 sm:px-6 pb-8 pt-4">
              <div className="w-full max-w-3xl">
                <div className="flex justify-center mb-5">
                  <Logo size={36} showText={false} />
                </div>
                <h1 className="font-display text-[32px] sm:text-[40px] leading-tight text-center text-ink mb-8 sm:mb-10">
                  {getGreeting()}
                </h1>

                {composer}

                <div className="flex flex-wrap items-center justify-center gap-2 mt-5">
                  {starterChips.map((chip, i) => {
                    const Icon = chip.icon;
                    return (
                      <button
                        key={i}
                        type="button"
                        onClick={() => handleSendMessage(chip.text, [])}
                        className="flex items-center gap-2 min-h-[36px] px-3.5 rounded-full border border-line bg-card text-sm text-ink/80 hover:text-ink hover:bg-hover transition-colors duration-150 outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
                      >
                        <Icon className="w-4 h-4 text-accent shrink-0" strokeWidth={1.75} />
                        <span>{chip.text}</span>
                      </button>
                    );
                  })}
                </div>

                <p className="text-xs text-muted text-center mt-8">
                  RoleFlow can make mistakes. Check important information.
                </p>
              </div>
            </div>
          </div>
        ) : (
          /* Conversation: scrollable messages with the composer pinned below */
          <>
            <div className="flex-1 overflow-y-auto">
              <div className="pt-4 pb-6">
                {messages.map((message, index) => (
                  <MessageItem
                    key={message.id}
                    message={message}
                    onEdit={handleEditMessage}
                    onRegenerate={handleRegenerate}
                    onOpenArtifact={(art) => setActiveArtifact(art)}
                    onBranch={handleBranch}
                    isStreaming={isLiveTyping && index === messages.length - 1}
                  />
                ))}

                {isLoading && (
                  <div className="w-full max-w-3xl mx-auto px-4 sm:px-6 py-4 animate-message">
                    <div className="inline-flex items-center gap-2 text-sm text-muted select-none" role="status" aria-live="polite">
                      <span className="inline-flex items-center gap-1" aria-hidden="true">
                        <span className="typing-dot w-1.5 h-1.5 rounded-full bg-accent" />
                        <span className="typing-dot w-1.5 h-1.5 rounded-full bg-accent" />
                        <span className="typing-dot w-1.5 h-1.5 rounded-full bg-accent" />
                      </span>
                      <span className="font-mono text-xs">Thinking for {thinkingSeconds.toFixed(1)}s</span>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </div>

            <div className="shrink-0 bg-app px-3 sm:px-4 pb-4 pt-2">
              <div className="w-full max-w-3xl mx-auto">{composer}</div>
            </div>
          </>
        )}
      </div>

      {/* Artifact panel */}
      {activeArtifact && (
        <ArtifactsPanel
          artifact={activeArtifact}
          onClose={() => setActiveArtifact(null)}
        />
      )}

      {/* Modals */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onSuccess={handleAuthSuccess}
        isGuestLimitReached={guestLimitReached}
      />

      {user && (
        <SettingsModal
          isOpen={settingsModalOpen}
          onClose={() => setSettingsModalOpen(false)}
          user={user}
          usage={usageStats || undefined}
          onUpdate={(updated) => {
            setUser(updated);
            localStorage.setItem("roleflow_user", JSON.stringify(updated));
          }}
          onAllChatsDeleted={() => {
            setChats([]);
            handleNewChat();
          }}
        />
      )}

      <CreateProjectModal
        isOpen={createProjectModalOpen}
        onClose={() => setCreateProjectModalOpen(false)}
        onCreated={(newProj) => {
          setProjects((prev) => [newProj, ...prev]);
          setSelectedProjectId(newProj.id);
        }}
      />

      <Toaster />

      {currentChatId && (
        <ShareModal
          isOpen={shareModalOpen}
          onClose={() => setShareModalOpen(false)}
          chatId={currentChatId}
        />
      )}
    </div>
  );
}
