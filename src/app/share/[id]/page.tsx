import { db } from "@/lib/db";
import { Logo } from "@/components/Logo";
import { MessageItem } from "@/components/MessageItem";
import Link from "next/link";
import { ArrowLeft, MessageSquare } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function SharePage({ params }: { params: { id: string } }) {
  const chat = await db.getChat(params.id, undefined, true);

  if (!chat) {
    return (
      <div className="min-h-screen bg-[#18181b] text-[#f3f3ee] flex flex-col items-center justify-center p-6 text-center">
        <Logo size={32} className="mb-4" />
        <h1 className="text-xl font-semibold mb-2">Conversation not found</h1>
        <p className="text-sm text-[#9b9a97] mb-6">
          This shared link may have expired or been deleted.
        </p>
        <Link
          href="/"
          className="px-4 py-2 rounded-xl bg-[#f3f3ee] text-[#141413] text-sm font-semibold hover:bg-white transition-colors"
        >
          Return to RoleFlow
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#18181b] text-[#f3f3ee] flex flex-col">
      {/* Top Header */}
      <header className="h-14 px-6 border-b border-[#2e2d2b] bg-[#141413] flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="flex items-center gap-1.5 text-xs text-[#9b9a97] hover:text-[#f3f3ee] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </Link>
          <Logo size={24} />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-[#858480]">Shared Conversation</span>
          <Link
            href="/"
            className="px-3 py-1.5 rounded-lg bg-[#262624] hover:bg-[#30302d] text-xs font-medium text-[#f3f3ee] border border-[#383734] transition-colors"
          >
            Start New Chat
          </Link>
        </div>
      </header>

      {/* Title */}
      <div className="max-w-3xl mx-auto w-full pt-8 px-4">
        <h1 className="text-2xl font-serif text-[#f3f3ee] font-medium mb-1">
          {chat.title}
        </h1>
        <p className="text-xs text-[#858480]">
          Model: {chat.model === "roleflow-genesis-1" ? "RoleFlow Genesis 1.0" : "RoleFlow Flash 1.0"} · Effort: {chat.effort.toUpperCase()}
        </p>
      </div>

      {/* Messages */}
      <main className="flex-1 max-w-3xl mx-auto w-full py-6 space-y-4">
        {chat.messages.map((message) => {
          // Sanitize message: strip any internal audit or user identity metadata
          const sanitizedMsg = {
            id: message.id,
            role: message.role,
            content: message.content,
            thinkingTime: message.thinkingTime,
            artifact: message.artifact,
            createdAt: message.createdAt,
          };
          return <MessageItem key={message.id} message={sanitizedMsg} />;
        })}
      </main>

      <footer className="py-6 border-t border-[#242321] text-center text-xs text-[#73726e]">
        Built with RoleFlow · Independent AI Platform
      </footer>
    </div>
  );
}
