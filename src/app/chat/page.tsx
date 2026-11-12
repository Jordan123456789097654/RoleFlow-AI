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

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    return () => {
      if (thinkingTimerRef.current) clearInterval(thinkingTimerRef.current);
    };
  }, []);

  const streamAssistantMessage = (fullMessage: Message) => {
    const fullContent = fullMessage.content || "";
    if (!fullContent) {
      setMessages((prev) => [...prev, fullMessage]);
      setIsLoading(false);
      return;
    }

    const streamingMsg: Message = {
      ...fullMessage,
      content: "",
    };

    setMessages((prev) => [...prev, streamingMsg]);
    setIsLoading(false);
    setIsLiveTyping(true);

    let currentIndex = 0;
    const totalLength = fullContent.length;
    const step = Math.max(3, Math.ceil(totalLength / 50));

    const intervalId = setInterval(() => {
      currentIndex = Math.min(totalLength, currentIndex + step);
      const slice = fullContent.slice(0, currentIndex);

      setMessages((prev) => {
        if (prev.length === 0) return prev;
        const updated = [...prev];
        const last = updated[updated.length - 1];
        if (last && last.id === fullMessage.id) {
          updated[updated.length - 1] = { ...last, content: slice };
        }
        return updated;
      });

      if (currentIndex >= totalLength) {
        clearInterval(intervalId);
        setIsLiveTyping(false);
        if (fullMessage.artifact) {
          setActiveArtifact(fullMessage.artifact);
        }
      }
    }, 18);
  };

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

  const handleSendMessage = async (
    content: string,
    attachments: Attachment[],
    overrideBaseMessages?: Message[]
  ) => {
    if (!user && guestMessagesCount >= 5) {
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
    setIsLoading(true);
    setThinkingSeconds(0);
    const startThinkingTime = Date.now();
    if (thinkingTimerRef.current) clearInterval(thinkingTimerRef.current);
    thinkingTimerRef.current = setInterval(() => {
      setThinkingSeconds((Date.now() - startThinkingTime) / 1000);
    }, 100);

    if (!user) {
      const updatedCount = guestMessagesCount + 1;
      setGuestMessagesCount(updatedCount);
      localStorage.setItem("roleflow_guest_count", updatedCount.toString());
    }

    const effectiveUserId = getEffectiveUserId();

    try {
      const activeProject = projects.find((p) => p.id === selectedProjectId);

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": effectiveUserId,
          "x-user-email": user?.email || "",
        },
        body: JSON.stringify({
          userId: effectiveUserId,
          userEmail: user?.email,
          chatId: currentChatId,
          messages: newMessages,
          model: activeModel,
          effort,
          projectId: selectedProjectId,
          customInstructions:
            user?.customInstructions || activeProject?.customInstructions,
        }),
      });

      const data = await res.json();
      if (thinkingTimerRef.current) {
        clearInterval(thinkingTimerRef.current);
        thinkingTimerRef.current = null;
      }

      if (!res.ok) {
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
        if (res.status === 429) {
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

      const finalElapsed = Number(((Date.now() - startThinkingTime) / 1000).toFixed(1));
      if (data.message) {
        data.message.thinkingTime = data.message.thinkingTime || finalElapsed;
        streamAssistantMessage(data.message);
      }

      if (!currentChatId && data.chatId) {
        setCurrentChatId(data.chatId);
      }

      fetchUserChats(effectiveUserId);
    } catch (err: any) {
      if (thinkingTimerRef.current) {
        clearInterval(thinkingTimerRef.current);
        thinkingTimerRef.current = null;
      }
      console.error("Chat error:", err);
      const errorMessage: Message = {
        id: "msg-" + Date.now(),
        role: "assistant",
        content: err.message || "I encountered an error connecting to the model network. Please retry.",
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
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

    setIsLoading(true);
    setThinkingSeconds(0);
    const startThinkingTime = Date.now();
    if (thinkingTimerRef.current) clearInterval(thinkingTimerRef.current);
    thinkingTimerRef.current = setInterval(() => {
      setThinkingSeconds((Date.now() - startThinkingTime) / 1000);
    }, 100);

    const effectiveUserId = getEffectiveUserId();

    fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-user-id": effectiveUserId,
        "x-user-email": user?.email || "",
      },
      body: JSON.stringify({
        userId: effectiveUserId,
        userEmail: user?.email,
        chatId: currentChatId,
        messages: trimmed,
        model: activeModel,
        effort,
        projectId: selectedProjectId,
        customInstructions: user?.customInstructions,
      }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (thinkingTimerRef.current) {
          clearInterval(thinkingTimerRef.current);
          thinkingTimerRef.current = null;
        }
        if (data.usage) {
          setUsageStats(data.usage);
        }
        if (data.message) {
          const finalElapsed = Number(((Date.now() - startThinkingTime) / 1000).toFixed(1));
          data.message.thinkingTime = data.message.thinkingTime || finalElapsed;
          streamAssistantMessage(data.message);
        }
      })
      .catch((err) => {
        if (thinkingTimerRef.current) {
          clearInterval(thinkingTimerRef.current);
          thinkingTimerRef.current = null;
        }
        console.error(err);
      })
      .finally(() => setIsLoading(false));
  };

  const handleAuthSuccess = (authenticatedUser: UserProfile) => {
    setUser(authenticatedUser);
    localStorage.setItem("roleflow_user", JSON.stringify(authenticatedUser));
    setGuestLimitReached(false);
    fetchUserChats(authenticatedUser.id);
  };

  const handleSignOut = () => {
    setUser(null);
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
        projects={projects}
        activeProjectId={selectedProjectId}
        onSelectProject={setSelectedProjectId}
        onCreateProject={() => setCreateProjectModalOpen(true)}
        user={user}
        guestMessagesRemaining={Math.max(0, 5 - guestMessagesCount)}
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
