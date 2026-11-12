import { db } from "@/lib/db";
import { Logo } from "@/components/Logo";
import { MessageItem } from "@/components/MessageItem";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function SharePage({ params }: { params: { id: string } }) {
  const chat = await db.getChat(params.id, undefined, true);

  if (!chat) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-app px-6 text-center text-ink">
        <Logo size={32} className="mb-8" />
        <h1 className="font-display text-2xl font-medium">Conversation not found</h1>
        <p className="mt-3 max-w-sm text-sm leading-relaxed text-muted">
          This shared link may have expired or been deleted.
        </p>
        <Link
          href="/"
          className="mt-8 inline-flex min-h-11 items-center justify-center rounded-lg bg-accent px-5 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
        >
          Go to RoleFlow
        </Link>
      </div>
    );
  }

  const modelName = chat.model === "roleflow-genesis-1" ? "RoleFlow Genesis 1.0" : "RoleFlow Flash 1.0";

  return (
    <div className="flex min-h-screen flex-col bg-app text-ink">
      <header className="sticky top-0 z-40 w-full border-b border-line bg-app/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-3xl items-center justify-between gap-3 px-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <Link
              href="/"
              aria-label="Back to home"
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-muted transition-colors hover:bg-hover hover:text-ink"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <Logo size={24} showText={false} className="shrink-0" />
            <span className="hidden text-sm text-muted sm:inline">Shared conversation</span>
          </div>

          <Link
            href="/"
            className="inline-flex min-h-10 shrink-0 items-center rounded-lg bg-accent px-4 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
          >
            Start your own chat
          </Link>
        </div>
      </header>

      <div className="mx-auto w-full max-w-3xl px-4 pb-8 pt-10 sm:px-6">
        <h1 className="break-words font-display text-2xl font-normal leading-snug tracking-tight text-ink sm:text-3xl">
          {chat.title}
        </h1>
        <p className="mt-2 text-xs text-muted">
          {modelName} · Effort: {chat.effort.toUpperCase()}
        </p>
      </div>

      <main className="mx-auto w-full max-w-3xl flex-1 space-y-6 px-4 pb-16 sm:px-6">
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

      <footer className="border-t border-line px-4 py-8 text-center text-xs text-muted">
        <div className="flex flex-col items-center gap-3">
          <p>Shared from RoleFlow</p>
          <Link href="/" className="inline-flex min-h-10 items-center text-accent transition-colors hover:text-accent-hover">
            Try RoleFlow
          </Link>
        </div>
      </footer>
    </div>
  );
}
