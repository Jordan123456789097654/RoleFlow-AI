import React from "react";
import { LegalHeader } from "@/components/LegalHeader";
import { Footer } from "@/components/Footer";
import { LegalBlocks } from "@/components/LegalDocument";
import { getLegalDocument, type LegalSlug } from "@/lib/legal";

export function legalMetadata(slug: LegalSlug) {
  const doc = getLegalDocument(slug);
  return {
    title: `${doc.title} · RoleFlow`,
    description: `${doc.title} for RoleFlow.`,
  };
}

export const LegalPage: React.FC<{ slug: LegalSlug }> = ({ slug }) => {
  const doc = getLegalDocument(slug);
  return (
    <div className="min-h-screen flex flex-col bg-app text-ink">
      <LegalHeader currentPage={slug} />
      <main className="flex-1 mx-auto w-full max-w-2xl px-4 py-14 sm:px-6 sm:py-20">
        <div className="mb-10 pb-8 border-b border-line">
          <h1 className="font-display text-3xl sm:text-4xl text-ink font-normal tracking-tight mb-4">
            {doc.title}
          </h1>
          {doc.meta.map((m, i) => (
            <p key={i} className="text-xs text-muted mt-1">{m.replace(/\*\*/g, "")}</p>
          ))}
        </div>
        <LegalBlocks blocks={doc.blocks} />
      </main>
      <Footer />
    </div>
  );
};
