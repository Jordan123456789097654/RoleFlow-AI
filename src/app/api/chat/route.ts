import { NextRequest, NextResponse } from "next/server";
import { generateRoleFlowResponse } from "@/lib/ai-engine";
import { db, ADMIN_EMAIL } from "@/lib/db";
import { Chat, Message, ModerationLogEntry } from "@/types";
import { scanMessage } from "@/lib/moderation";
import { sendSecurityAlertEmail } from "@/lib/email";

function extractUserFromReq(req: NextRequest): { userId?: string; userEmail?: string } {
  let userId = req.headers.get("x-user-id") || undefined;
  let userEmail = req.headers.get("x-user-email") || undefined;

  const cookie = req.cookies.get("roleflow_user");
  if (cookie?.value) {
    try {
      const parsed = JSON.parse(decodeURIComponent(cookie.value));
      if (parsed?.id) userId = parsed.id;
      if (parsed?.email) userEmail = parsed.email;
    } catch {}
  }
  return { userId, userEmail };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const authData = extractUserFromReq(req);
    const userId = body.userId || authData.userId;
    let userEmail = body.userEmail || authData.userEmail;

    const {
      chatId,
      messages,
      model = "roleflow-genesis-1",
      effort = "medium",
      projectId,
      customInstructions,
    } = body;

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

    // Enforce Usage Limits
    const usageCheck = await db.getUsage(identifier, isGuest);

    if (!usageCheck.allowed) {
      if (isGuest) {
        return NextResponse.json(
          {
            error: "Guest limit reached. You have used all 5 complimentary messages. Please sign in to continue using RoleFlow.",
            guestLimitReached: true,
            usage: usageCheck,
          },
          { status: 429 }
        );
      } else {
        return NextResponse.json(
          {
            error: "Daily message limit reached. Free accounts include 25 messages per day. Your quota resets at midnight.",
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

    // 1. Run Trust & Safety Hybrid Scanner Before Model Generation
    const latestUserMsg = [...messages].reverse().find((m: Message) => m.role === "user");
    const promptToScan = latestUserMsg ? latestUserMsg.content : "";
    const moderationVerdict = scanMessage(promptToScan);

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
          tier: 1,
          category: moderationVerdict.category || "VIOLENT_EXTREMISM",
          status: "BANNED",
          ipAddress,
          createdAt: new Date().toISOString(),
          reason: moderationVerdict.reason || undefined,
          matchedKeywords: moderationVerdict.matchedKeywords,
        };

        await db.saveModerationLog(logEntry);

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
          messages: [...messages, assistantMessage],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        await db.saveChat(chatToSave);

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
        // Tier 2: Refuse response with warning banner. Increment user strike count.
        const newStrikes = await db.incrementStrikes(userEmail || userId || identifier);
        const logId =
          "mod-" + Date.now() + "-" + Math.random().toString(36).substring(2, 7);
        const logEntry: ModerationLogEntry = {
          id: logId,
          userId: userId || "guest",
          userEmail: userEmail || "guest",
          prompt: promptToScan,
          tier: 2,
          category: moderationVerdict.category || "CYBERATTACK",
          status: "FLAGGED",
          ipAddress,
          createdAt: new Date().toISOString(),
          reason: moderationVerdict.reason || undefined,
          matchedKeywords: moderationVerdict.matchedKeywords,
        };

        await db.saveModerationLog(logEntry);

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
          messages: [...messages, assistantMessage],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        await db.saveChat(chatToSave);

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

    // Generate response from RoleFlow AI Engine
    const result = await generateRoleFlowResponse({
      messages,
      model,
      effort,
      customInstructions: effectiveInstructions,
    });

    const assistantMessage: Message = {
      id: "msg-" + Date.now(),
      role: "assistant",
      content: result.content,
      thinking: result.thinking,
      artifact: result.artifact,
      createdAt: new Date().toISOString(),
    };

    const updatedMessages = [...messages, assistantMessage];

    // Persist chat to Database strictly under user
    const currentChatId = chatId || "chat-" + Date.now();
    const firstUserMsg = messages.find((m: Message) => m.role === "user");
    const title = firstUserMsg
      ? firstUserMsg.content.slice(0, 36) + (firstUserMsg.content.length > 36 ? "..." : "")
      : "New Conversation";

    const chatToSave: Chat = {
      id: currentChatId,
      userId,
      title,
      projectId,
      model,
      effort,
      messages: updatedMessages,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await db.saveChat(chatToSave);

    // Increment Usage and return updated quota
    const updatedUsage = await db.incrementUsage(identifier, isGuest);

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
