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
import { Code, Sparkles, Bug, Compass } from "lucide-react";

export default function ChatPage() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [model, setModel] = useState<ModelId>("roleflow-genesis-1");
  const [effort, setEffort] = useState<EffortLevel>("medium");

  // User & Session Identity
  const [user, setUser] = useState<UserProfile | null>(null);
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
    const timeGreeting = getTimeGreeting();
    const userName = formatCleanName(user?.name, user?.email);
    return `${timeGreeting}, ${userName}`;
  };

  const handleSelectChat = (chatId: string) => {
    const chat = chats.find((c) => c.id === chatId);
    if (chat) {
      setCurrentChatId(chat.id);
      setMessages(chat.messages);
      setModel(chat.model);
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

  const handleSendMessage = async (content: string, attachments: Attachment[]) => {
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

    const newMessages = [...messages, userMessage];
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
          model,
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
    handleSendMessage(newContent, []);
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
        model,
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

  return (
    <div className="flex h-screen w-screen overflow-hidden roleflow-mesh-bg text-[#f4f4f0]">
      {/* Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        chats={chats}
        activeChatId={currentChatId}
        onSelectChat={handleSelectChat}
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

      {/* Main Chat Center Pane */}
      <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden relative">
        <Header
          model={model}
          onModelChange={setModel}
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
        />

        <div className="flex-1 flex flex-col overflow-y-auto">
          {messages.length === 0 ? (
            /* Blank Canvas (RoleFlow Workspace) */
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-2xl mx-auto w-full">
              {/* Logo & Greeting */}
              <div className="flex items-center justify-center gap-3.5 mb-7">
                <Logo size={38} showText={false} />
                <h1 className="font-serif text-3xl sm:text-[38px] text-[#f4f4f0] font-normal tracking-tight">
                  {getGreeting()}
                </h1>
              </div>

              {/* Centered Prompt Box */}
              <div className="w-full">
                <PromptBox
                  onSend={handleSendMessage}
                  isLoading={isLoading}
                  model={model}
                  onModelChange={setModel}
                  effort={effort}
                  onEffortChange={setEffort}
                  projects={projects}
                  selectedProjectId={selectedProjectId}
                  onProjectChange={setSelectedProjectId}
                  onCreateProject={() => setCreateProjectModalOpen(true)}
                />
              </div>

              {/* Starter Chips */}
              <div className="flex flex-wrap items-center justify-center gap-2 mt-5">
                {starterChips.map((chip, i) => {
                  const Icon = chip.icon;
                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() => handleSendMessage(chip.text, [])}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#1c1b1a] hover:bg-[#252423] text-xs text-[#999894] hover:text-[#f4f4f0] border border-[#2e2d2b] transition-all hover:border-[#42403c] shadow-sm"
                    >
                      <Icon className="w-3.5 h-3.5 text-[#d97706]" />
                      <span>{chip.text}</span>
                    </button>
                  );
                })}
              </div>

              <p className="text-xs text-[#7d7c78] mt-6">
                Independent AI built by RoleFlow · Frontier open-weights cloud cluster
              </p>
            </div>
          ) : (
            /* Active Message Flow */
            <div className="flex-1 flex flex-col">
              <div className="flex-1 overflow-y-auto divide-y divide-[#222120]/40 pb-36">
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
                  <div className="w-full max-w-3xl mx-auto py-5 px-4 animate-message">
                    <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-[#1b1a19] border border-[#2d2c2a] shadow-sm select-none">
                      <span className="w-2 h-2 rounded-full bg-[#d97706] animate-ping" />
                      <span className="font-mono text-xs text-[#d97706] font-medium">
                        Thinking for {thinkingSeconds.toFixed(1)}s...
                      </span>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Floating Bottom Prompt Bar */}
              <div className="sticky bottom-0 bg-gradient-to-t from-[#141413] via-[#141413]/95 to-transparent pt-6 pb-4">
                <PromptBox
                  onSend={handleSendMessage}
                  isLoading={isLoading}
                  model={model}
                  onModelChange={setModel}
                  effort={effort}
                  onEffortChange={setEffort}
                  projects={projects}
                  selectedProjectId={selectedProjectId}
                  onProjectChange={setSelectedProjectId}
                  onCreateProject={() => setCreateProjectModalOpen(true)}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Slide-out RoleFlow Artifacts Panel */}
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