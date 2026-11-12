import React from "react";
import { LegalHeader } from "@/components/LegalHeader";
import { Footer } from "@/components/Footer";
import { LegalBlocks } from "@/components/LegalDocument";
import { parseLegalMarkdown } from "@/lib/legal";
import fs from "fs";
import path from "path";

export const metadata = {
  title: "API Keys · RoleFlow Docs",
  description: "Create, authenticate, and manage RoleFlow API keys, and call the chat completions endpoint.",
};

export default function ApiKeysDocsPage() {
  const source = fs.readFileSync(path.join(process.cwd(), "src", "content", "docs", "api-keys.md"), "utf8");
  const doc = parseLegalMarkdown(source);
  return (
    <div className="min-h-screen flex flex-col bg-app text-ink">
      <LegalHeader />
      <main className="flex-1 mx-auto w-full max-w-2xl px-4 py-14 sm:px-6 sm:py-20">
        <div className="mb-10 pb-8 border-b border-line">
          <p className="text-xs text-accent mb-2">Developer documentation</p>
          <h1 className="font-display text-3xl sm:text-4xl text-ink font-normal tracking-tight mb-4">{doc.title}</h1>
          {doc.meta.map((m, i) => (
            <p key={i} className="text-xs text-muted mt-1">{m.replace(/\*\*/g, "")}</p>
          ))}
        </div>
        <LegalBlocks blocks={doc.blocks} />
      </main>
      <Footer />
    </div>
  );
}
