import { NextRequest, NextResponse } from "next/server";
import { generateRoleFlowResponse } from "@/lib/ai-engine";
import { db, ADMIN_EMAIL } from "@/lib/db";
import { Attachment, Chat, Message, ModerationLogEntry, ModelId, EffortLevel, WebSource } from "@/types";
import { scanMessage } from "@/lib/moderation";
import { sendSecurityAlertEmail } from "@/lib/email";
import { getMemories, addMemory, removeMemory } from "@/lib/memory";
import { getSessionFromRequest } from "@/lib/auth";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { isImageAttachment } from "@/lib/ai-engine";
import { convertPdfAttachments } from "@/lib/pdf";
import { convertOfficeAttachments } from "@/lib/office";
import { compactHistory } from "@/lib/compaction";
import { formatSourcesForPrompt, isWebSearchConfigured, searchWeb } from "@/lib/web-search";
import { buildAttachmentScanText, buildIncidentContext, classifyImagesForSafety } from "@/lib/attachments";
import { imageHeldNotice, moderationRefusalNotice, notifyUser, suspensionNotice, usageWarningNotice } from "@/lib/notify";
import { DEFAULT_MODEL, GUEST_MODEL, MODEL_IDS, isGuestAllowedModel, resolveModelId } from "@/lib/models";
import { IMAGE_UPLOADS_ENABLED, IMAGE_UPLOADS_PAUSED_MESSAGE, isImageMimeType } from "@/lib/features";
import { generateChatTitle } from "@/lib/titles";

const ALLOWED_MODELS: ModelId[] = [...MODEL_IDS];
const ALLOWED_EFFORTS: EffortLevel[] = ["low", "medium", "high", "extra", "max"];

/**
 * Sends the chat request. A client that asks for text/event-stream gets the reply as it is
 * generated: "delta" events carry new text, then one "done" event carries the same JSON the
 * non-streaming response returns, or an "error" event carries the status and error body.
 */
export async function POST(req: NextRequest) {
  const wantsStream = (req.headers.get("accept") || "").includes("text/event-stream");
  if (!wantsStream) {
    return handleChat(req);
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: string, data: unknown) => {
        try {
          controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
        } catch {
          // The client has gone away. Generation still finishes so the chat is saved.
        }
      };
      try {
        const res = await handleChat(req, (text) => send("delta", { text }));
        const payload = await res.json().catch(() => ({ error: "Unexpected response." }));
        if (res.ok) {
          send("done", payload);
        } else {
          const retryAfter = res.headers.get("Retry-After");
          send("error", { status: res.status, retryAfter: retryAfter ? Number(retryAfter) : undefined, ...payload });
        }
      } catch (error) {
        console.error("Chat stream error:", error);
        send("error", { status: 500, error: "Internal server error" });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      "X-Accel-Buffering": "no",
    },
  });
}

async function handleChat(req: NextRequest, onDelta?: (text: string) => void): Promise<NextResponse> {
  try {
    const body = await req.json();
    const session = getSessionFromRequest(req);

    // Cryptographic Session Priority: Never trust raw client-provided identity for user accounts
    let userId = session?.userId;
    let userEmail = session?.email;

    // If unauthenticated, fallback to secure guest isolation
    if (!userId) {
      const guestId = body.guestId || req.cookies.get("roleflow_guest_id")?.value;
      if (guestId && typeof guestId === "string" && guestId.startsWith("guest_")) {
        userId = guestId.slice(0, 36);
      } else {
        const ipHash = (req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1").replace(/[^a-zA-Z0-9]/g, "");
        userId = `guest_${ipHash.slice(0, 16)}`;
      }
    }

    const {
      chatId,
      messages,
      model: rawModel = DEFAULT_MODEL,
      effort = "medium",
      projectId,
      customInstructions,
      webSearch = false,
    } = body;
    // Retired IDs (e.g. roleflow-flash-1) resolve to their successor before any other check.
    let model: ModelId = resolveModelId(rawModel) ?? DEFAULT_MODEL;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: "Messages array required" }, { status: 400 });
    }

    // Resolve user profile if user id provided without email
    if (!userEmail && userId && !userId.startsWith("guest_")) {
      const dbUser = await db.getUserById(userId);
      if (dbUser) {
        userEmail = dbUser.email;
      }
    }

    const isGuest = !userId || userId.startsWith("guest_");
    const identifier = userEmail || userId || "guest_default";

    // Guests can use only the guest model. Substituting here, before generation and before the
    // chat is saved, means the reply and the stored chat both show the model that actually ran.
    if (isGuest && !isGuestAllowedModel(model)) {
      model = GUEST_MODEL;
    }

    // Per-minute abuse limits, separate from daily quotas. Guest IDs come from the client,
    // so guests are limited per IP. Signed-in accounts are also capped per user.
    const rateIp =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "unknown";
    const ipLimit = checkRateLimit(
      `ip:${rateIp}`,
      isGuest ? RATE_LIMITS.guestIpPerMinute : RATE_LIMITS.ipPerMinute
    );
    const accountLimit = isGuest
      ? { limited: false, retryAfterSeconds: 0 }
      : checkRateLimit(`user:${userId}`, RATE_LIMITS.userPerMinute);
    const rateLimited = ipLimit.limited ? ipLimit : accountLimit;
    if (rateLimited.limited) {
      return NextResponse.json(
        { error: "Too many requests. Please wait a moment and try again.", rateLimited: true },
        { status: 429, headers: { "Retry-After": String(rateLimited.retryAfterSeconds) } }
      );
    }

    // System Maintenance & Feature Flag Enforcements
    const sysConfig = await db.getSystemConfig();
    const isAdmin = Boolean(
      (userEmail && ADMIN_EMAIL && userEmail.toLowerCase() === ADMIN_EMAIL.toLowerCase()) ||
      (session && session.isAdmin)
    );

    if (sysConfig.maintenanceMode && !isAdmin) {
      return NextResponse.json(
        { error: "RoleFlow is currently in scheduled maintenance. Please check back shortly." },
        { status: 503 }
      );
    }

    const safeModel: ModelId = ALLOWED_MODELS.includes(model) ? model : DEFAULT_MODEL;
    let safeEffort: EffortLevel = ALLOWED_EFFORTS.includes(effort) ? effort : "medium";
    if (!sysConfig.allowHighEffort && (safeEffort === "extra" || safeEffort === "max")) {
      safeEffort = "high";
    }

    // Defense-in-depth: Verify chat ownership if existing chatId supplied
    let existingChat: Chat | null | undefined = null;
    if (chatId) {
      existingChat = await db.getChat(chatId, undefined, true);
      if (existingChat && existingChat.userId && existingChat.userId !== userId) {
        return NextResponse.json(
          { error: "Access denied. Cannot modify a conversation belonging to another user." },
          { status: 403 }
        );
      }
    }

    // Prevent system prompt injection: Filter client-supplied messages strictly to user & assistant
    const safeMessages = messages.filter(
      (m: Message) => m && (m.role === "user" || m.role === "assistant")
    );

    if (safeMessages.length === 0) {
      return NextResponse.json({ error: "Valid user or assistant messages required" }, { status: 400 });
    }

    // Image uploads are paused. A new image on the latest turn is refused before any other work.
    // Images in earlier turns (saved before the pause) are not refused, so existing chats keep
    // working; buildModelMessages reduces them to filenames for the model.
    if (!IMAGE_UPLOADS_ENABLED) {
      const latestTurn = [...safeMessages].reverse().find((m: Message) => m.role === "user");
      const hasNewImage = (latestTurn?.attachments || []).some(
        (a: Attachment) =>
          isImageMimeType(a.type) || (typeof a.content === "string" && a.content.startsWith("data:image/"))
      );
      if (hasNewImage) {
        return NextResponse.json(
          { error: IMAGE_UPLOADS_PAUSED_MESSAGE, code: "image_uploads_disabled" },
          { status: 400 }
        );
      }
    }

    // PDFs become extracted text here, so every later step handles them like any text file.
    const pdfError = await convertPdfAttachments(safeMessages);
    if (pdfError) {
      return NextResponse.json({ error: pdfError }, { status: 400 });
    }

    // Word and Excel files become extracted text in the same way.
    const officeError = await convertOfficeAttachments(safeMessages);
    if (officeError) {
      return NextResponse.json({ error: officeError }, { status: 400 });
    }

    // Cap conversation history to 30 messages to prevent token budget abuse
    const cappedMessages = safeMessages.slice(-30);
    const latestUserMsg = [...cappedMessages].reverse().find((m: Message) => m.role === "user");
    if (latestUserMsg && latestUserMsg.content && latestUserMsg.content.length > 16000) {
      latestUserMsg.content = latestUserMsg.content.slice(0, 16000);
    }

    // 0. Check if User is Banned
    const banStatus = await db.getUserBanStatus(userEmail || userId || "");
    if (banStatus.isBanned) {
      return NextResponse.json(
        {
          error:
            "Account suspended. Your access to RoleFlow has been revoked due to serious violations of our Acceptable Use Policy.",
          isBanned: true,
        },
        { status: 403 }
      );
    }

    // Enforce Usage Limits using dynamic limits from system config
    const usageCheck = await db.getUsage(identifier, isGuest);

    if (!usageCheck.allowed) {
      if (isGuest) {
        return NextResponse.json(
          {
            error: `Guest limit reached. You have used all ${usageCheck.limit} complimentary messages. Please sign in to continue using RoleFlow.`,
            guestLimitReached: true,
            usage: usageCheck,
          },
          { status: 429 }
        );
      } else {
        return NextResponse.json(
          {
            error: `Daily message limit reached. Free accounts include ${usageCheck.limit} messages per day. Your quota resets at midnight.`,
            limitReached: true,
            usage: usageCheck,
          },
          { status: 429 }
        );
      }
    }

    // Extract IP Address for moderation audit records
    const ipAddress =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "127.0.0.1";

    // 1. Run Trust & Safety Hybrid Scanner across current prompt and recent user messages
    const promptToScan = latestUserMsg ? latestUserMsg.content : "";
    // Attachments are scanned as well: filenames and text file contents. Image pixels are checked below.
    const attachmentScanText = buildAttachmentScanText(latestUserMsg);
    let moderationVerdict = scanMessage([promptToScan, attachmentScanText].filter(Boolean).join("\n"));

    if (!moderationVerdict.flagged && cappedMessages.length > 1) {
      for (const m of cappedMessages) {
        if (m.role === "user" && m !== latestUserMsg) {
          const v = scanMessage(m.content || "");
          if (v.flagged) {
            moderationVerdict = v;
            break;
          }
        }
      }
    }

    // Image review: the vision model checks uploaded images before any answer is generated.
    const latestImages = (latestUserMsg?.attachments || []).filter(isImageAttachment);
    if (!moderationVerdict.flagged && latestImages.length > 0) {
      moderationVerdict = await classifyImagesForSafety(latestImages);
    }
    const incidentContext = buildIncidentContext(cappedMessages, latestUserMsg);

    if (moderationVerdict.flagged) {
      if (moderationVerdict.tier === 1) {
        // Zero tolerance: Hard block, Ban account, send Security Alert email
        await db.banUser(userEmail || userId || identifier);

        const logId =
          "mod-" + Date.now() + "-" + Math.random().toString(36).substring(2, 7);
        const logEntry: ModerationLogEntry = {
          id: logId,
          userId: userId || "guest",
          userEmail: userEmail || "guest",
          prompt: promptToScan,
          context: incidentContext,
          tier: 1,
          category: moderationVerdict.category || "VIOLENT_EXTREMISM",
          status: "BANNED",
          ipAddress,
          createdAt: new Date().toISOString(),
          reason: moderationVerdict.reason || undefined,
          matchedKeywords: moderationVerdict.matchedKeywords,
        };

        await db.saveModerationLog(logEntry);

        notifyUser(userEmail, suspensionNotice({ logId }));

        // Instant security alert email via Resend
        sendSecurityAlertEmail({
          userEmail: userEmail || "Guest User",
          userId,
          timestamp: new Date().toUTCString(),
          flaggedPrompt: promptToScan,
          category: moderationVerdict.category || "VIOLENT_EXTREMISM",
          tier: 1,
          ipAddress,
          logId,
        }).catch((e) => console.error("Security alert dispatch error:", e));

        const assistantMessage: Message = {
          id: "msg-" + Date.now(),
          role: "assistant",
          content:
            "This request has been blocked under RoleFlow's Acceptable Use Policy regarding violent extremism, terrorism, and severe harm. This incident has been logged for administrative review.",
          moderationBlocked: true,
          moderationTier: 1,
          moderationCategory: moderationVerdict.category || undefined,
          moderationLogId: logId,
          canAppeal: true,
          createdAt: new Date().toISOString(),
        };

        const currentChatId = chatId || "chat-" + Date.now();
        const chatToSave: Chat = {
          id: currentChatId,
          userId,
          title: promptToScan.slice(0, 36) + (promptToScan.length > 36 ? "..." : ""),
          projectId,
          model,
          effort,
          messages: [...safeMessages, assistantMessage],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        await db.saveChat(chatToSave, userId);

        return NextResponse.json({
          chatId: currentChatId,
          message: assistantMessage,
          chat: chatToSave,
          blocked: true,
          tier: 1,
          logId,
          isBanned: true,
          error: assistantMessage.content,
        });
      } else if (moderationVerdict.tier === 2) {
        // Special Wellbeing Handling: Self-harm requests receive compassionate crisis support, NOT strikes or bans
        if (moderationVerdict.category === "SELF_HARM") {
          const crisisContent =
            "If you or someone you know is going through a tough time or having thoughts of self-harm, please know that you are not alone and compassionate support is available 24/7.\n\n" +
            "• **US & Canada:** Call or text **988** to reach the Suicide & Crisis Lifeline (free, confidential).\n" +
            "• **Crisis Text Line:** Text **HOME** to **741741** to connect with a crisis counselor.\n" +
            "• **UK:** Call **111** (NHS) or call the Samaritans at **116 123**.\n" +
            "• **International:** Find local resources in your region at [findahelpline.com](https://findahelpline.com).\n\n" +
            "Please reach out to one of these services, a trusted loved one, or a professional who can help.";

          const assistantMessage: Message = {
            id: "msg-" + Date.now(),
            role: "assistant",
            content: crisisContent,
            moderationBlocked: false,
            createdAt: new Date().toISOString(),
          };

          const currentChatId = chatId || "chat-" + Date.now();
          const chatToSave: Chat = {
            id: currentChatId,
            userId,
            title: promptToScan.slice(0, 36) + (promptToScan.length > 36 ? "..." : ""),
            projectId,
            model,
            effort,
            messages: [...safeMessages, assistantMessage],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          await db.saveChat(chatToSave, userId);

          return NextResponse.json({
            chatId: currentChatId,
            message: assistantMessage,
            chat: chatToSave,
            blocked: true,
            isSelfHarmSupport: true,
          });
        }

        // Tier 2 Security / Harm: Refuse response with warning banner. Increment user strike count.
        const newStrikes = await db.incrementStrikes(userEmail || userId || identifier);
        const logId =
          "mod-" + Date.now() + "-" + Math.random().toString(36).substring(2, 7);
        const logEntry: ModerationLogEntry = {
          id: logId,
          userId: userId || "guest",
          userEmail: userEmail || "guest",
          prompt: promptToScan,
          context: incidentContext,
          tier: 2,
          category: moderationVerdict.category || "CYBERATTACK",
          status: "FLAGGED",
          ipAddress,
          createdAt: new Date().toISOString(),
          reason: moderationVerdict.reason || undefined,
          matchedKeywords: moderationVerdict.matchedKeywords,
        };

        await db.saveModerationLog(logEntry);

        notifyUser(
          userEmail,
          moderationVerdict.category === "IMAGE_REVIEW"
            ? imageHeldNotice({ logId })
            : moderationRefusalNotice({ category: moderationVerdict.category || undefined, logId, strikes: newStrikes })
        );

        const categoryReadable =
          moderationVerdict.category?.toLowerCase().replace(/_/g, " ") || "security policy";
        const warningContent = `This request has been flagged and refused under RoleFlow's Acceptable Use Policy regarding ${categoryReadable}. Your account has received strike ${newStrikes}. Continued infractions may result in permanent suspension.`;

        const assistantMessage: Message = {
          id: "msg-" + Date.now(),
          role: "assistant",
          content: warningContent,
          moderationBlocked: true,
          moderationTier: 2,
          moderationCategory: moderationVerdict.category || undefined,
          moderationLogId: logId,
          canAppeal: true,
          createdAt: new Date().toISOString(),
        };

        const currentChatId = chatId || "chat-" + Date.now();
        const chatToSave: Chat = {
          id: currentChatId,
          userId,
          title: promptToScan.slice(0, 36) + (promptToScan.length > 36 ? "..." : ""),
          projectId,
          model,
          effort,
          messages: [...safeMessages, assistantMessage],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        await db.saveChat(chatToSave, userId);

        return NextResponse.json({
          chatId: currentChatId,
          message: assistantMessage,
          chat: chatToSave,
          blocked: true,
          tier: 2,
          logId,
          strikes: newStrikes,
          error: warningContent,
        });
      }
    }

    // Build combined custom instructions if user has profile preferences
    let effectiveInstructions = customInstructions || "";
    if (userEmail) {
      const userProfile = await db.getUserByEmail(userEmail);
      if (userProfile) {
        const parts: string[] = [];
        if (userProfile.customInstructions) {
          parts.push(`User Background & Preferences:\n${userProfile.customInstructions}`);
        }
        if (userProfile.responseInstructions) {
          parts.push(`User Response Style Guidelines:\n${userProfile.responseInstructions}`);
        }
        if (parts.length > 0) {
          effectiveInstructions = parts.join("\n\n");
        }
      }
    }

    // Retrieve persistent user memories
    let persistentMemories: string[] = [];
    if (userId && !isGuest) {
      try {
        const memItems = await getMemories(userId);
        persistentMemories = memItems.map((m) => m.memory);
      } catch (e) {
        console.warn("Failed to load user memories for chat:", e);
      }
    }

    // A new chat gets an AI-written title. The title call starts now and runs alongside the reply.
    // Existing chats keep the title they already have.
    const titleSource = safeMessages.find((m: Message) => m.role === "user");
    const titlePromise: Promise<string> | null =
      !existingChat && titleSource ? generateChatTitle(titleSource.content || "") : null;

    // Chat compacting: older turns are condensed into a stored summary, and the newest turns go in full.
    const compacted = await compactHistory(safeMessages, existingChat?.compaction);
    const historyForModel = compacted.history.slice(-30);

    // Web search: when the user turns it on and the server has a key, the latest question is
    // answered with numbered results. The results go to the model only, not into the saved message.
    let webSources: WebSource[] = [];
    const latestUserIndex = historyForModel.map((m: Message) => m.role).lastIndexOf("user");
    if (webSearch === true && isWebSearchConfigured() && latestUserIndex !== -1) {
      const latest = historyForModel[latestUserIndex];
      webSources = await searchWeb(latest.content || "");
      if (webSources.length > 0) {
        historyForModel[latestUserIndex] = {
          ...latest,
          content: `${latest.content}\n\n[Web search results for this question. Cite the results you use as [1], [2], and so on.]\n\n${formatSourcesForPrompt(webSources)}`,
        };
      }
    }

    // Generate response from RoleFlow AI Engine
    const result = await generateRoleFlowResponse({
      messages: historyForModel,
      model: safeModel,
      effort: safeEffort,
      customInstructions: effectiveInstructions,
      memories: persistentMemories,
      onDelta,
      conversationSummary: compacted.summaryForModel,
    });

    // Upstream safety block: Groq refused the request or filtered the generation. Our scanner
    // did not catch it, so it is audited here as a Tier 2 incident (strike + warning, no auto-ban),
    // alerted to admins, and not charged against quota.
    if (result.isSafetyRefusal) {
      const newStrikes = await db.incrementStrikes(userEmail || userId || identifier);
      const logId =
        "mod-" + Date.now() + "-" + Math.random().toString(36).substring(2, 7);
      const logEntry: ModerationLogEntry = {
        id: logId,
        userId: userId || "guest",
        userEmail: userEmail || "guest",
        prompt: promptToScan,
        context: incidentContext,
        tier: 2,
        category: "UPSTREAM_SAFETY_BLOCK",
        status: "FLAGGED",
        ipAddress,
        createdAt: new Date().toISOString(),
        reason: `Upstream model provider blocked this request on safety grounds (${result.safetyReason || "unspecified"}).`,
      };
      await db.saveModerationLog(logEntry);

      sendSecurityAlertEmail({
        userEmail: userEmail || "Guest User",
        userId,
        timestamp: new Date().toUTCString(),
        flaggedPrompt: promptToScan,
        category: "UPSTREAM_SAFETY_BLOCK",
        tier: 2,
        ipAddress,
        logId,
      }).catch((e) => console.error("Security alert dispatch error:", e));

      const warningContent = `This request has been flagged and refused under RoleFlow's Acceptable Use Policy. Your account has received strike ${newStrikes}. Continued infractions may result in permanent suspension.`;

      const assistantMessage: Message = {
        id: "msg-" + Date.now(),
        role: "assistant",
        content: warningContent,
        moderationBlocked: true,
        moderationTier: 2,
        moderationCategory: "UPSTREAM_SAFETY_BLOCK",
        moderationLogId: logId,
        canAppeal: true,
        createdAt: new Date().toISOString(),
      };

      const refusedChatId = chatId || "chat-" + Date.now();
      const refusedChat: Chat = {
        id: refusedChatId,
        userId,
        title: promptToScan.slice(0, 36) + (promptToScan.length > 36 ? "..." : ""),
        projectId,
        model,
        effort,
        messages: [...cappedMessages, assistantMessage],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await db.saveChat(refusedChat, userId);

      return NextResponse.json({
        chatId: refusedChatId,
        message: assistantMessage,
        chat: refusedChat,
        blocked: true,
        tier: 2,
        logId,
        strikes: newStrikes,
        error: warningContent,
      });
    }

    // Auto-persist memories added or removed by AI
    if (userId && !isGuest) {
      if (result.memoriesAdded && result.memoriesAdded.length > 0) {
        for (const added of result.memoriesAdded) {
          try {
            await addMemory(userId, added);
          } catch (e) {}
        }
      }
      if (result.memoriesRemoved && result.memoriesRemoved.length > 0) {
        try {
          const allMems = await getMemories(userId);
          for (const rem of result.memoriesRemoved) {
            const match = allMems.find((m) =>
              m.memory.toLowerCase().includes(rem.toLowerCase())
            );
            if (match) {
              await removeMemory(userId, match.id);
            }
          }
        } catch (e) {}
      }
    }

    const assistantMessage: Message = {
      id: "msg-" + Date.now(),
      role: "assistant",
      content: result.content,
      thinkingTime: result.thinkingTime || 1.2,
      artifact: result.artifact,
      generatedFiles: result.generatedFiles,
      meta: result.meta,
      sources: webSources.length > 0 ? webSources : undefined,
      createdAt: new Date().toISOString(),
    };

    const updatedMessages = [...cappedMessages, assistantMessage];

    // Persist chat to Database strictly under user
    const currentChatId = chatId || "chat-" + Date.now();
    const title = existingChat?.title || (titlePromise ? await titlePromise : "New Conversation");

    const chatToSave: Chat = {
      id: currentChatId,
      userId,
      title,
      projectId,
      model,
      effort,
      messages: updatedMessages,
      compaction: compacted.compaction,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await db.saveChat(chatToSave, userId);

    // Increment Usage only on successful, non-fallback generations
    let updatedUsage = usageCheck;
    if (result.content && !result.isFallback) {
      updatedUsage = await db.incrementUsage(identifier, isGuest);

      // Warn signed-in users at 5 and 1 remaining messages.
      if (!isGuest && !updatedUsage.isUnlimited && (updatedUsage.remaining === 5 || updatedUsage.remaining === 1)) {
        notifyUser(
          userEmail,
          usageWarningNotice({ remaining: updatedUsage.remaining, limit: updatedUsage.limit, resetsAt: updatedUsage.resetsAt })
        );
      }
    }

    return NextResponse.json({
      chatId: currentChatId,
      message: assistantMessage,
      chat: chatToSave,
      usage: {
        used: updatedUsage.used,
        limit: updatedUsage.limit,
        remaining: updatedUsage.remaining,
        isUnlimited: updatedUsage.isUnlimited,
        resetsAt: updatedUsage.resetsAt,
      },
    });
  } catch (error: any) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
