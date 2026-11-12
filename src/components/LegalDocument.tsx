import React from "react";
import type { LegalBlock } from "@/lib/legal";

// Inline formatting: **bold**, *italic*, `code`, and email addresses.
const INLINE = /(\*\*[^*]+\*\*|\*[^*\s][^*]*\*|`[^`]+`|[\w.+-]+@[\w-]+\.[\w.-]+)/g;

function renderInline(text: string): React.ReactNode[] {
  return text.split(INLINE).map((part, idx) => {
    if (!part) return null;
    if (part.startsWith("**") && part.endsWith("**"))
      return <strong key={idx} className="font-semibold text-ink">{part.slice(2, -2)}</strong>;
    if (part.startsWith("`") && part.endsWith("`"))
      return <code key={idx} className="rounded bg-panel px-1 py-0.5 font-mono text-[0.85em]">{part.slice(1, -1)}</code>;
    if (part.startsWith("*") && part.endsWith("*") && part.length > 2)
      return <em key={idx}>{part.slice(1, -1)}</em>;
    if (/^[\w.+-]+@[\w-]+\.[\w.-]+$/.test(part))
      return <a key={idx} href={`mailto:${part}`} className="text-accent hover:underline">{part}</a>;
    return <React.Fragment key={idx}>{part}</React.Fragment>;
  });
}

export const LegalBlocks: React.FC<{ blocks: LegalBlock[] }> = ({ blocks }) => (
  <div className="space-y-6 text-ink leading-relaxed text-sm sm:text-[15px]">
    {blocks.map((b, i) => {
      switch (b.type) {
        case "heading":
          return b.level === 2 ? (
            <h2 key={i} className="pt-6 text-xl font-display text-ink font-medium tracking-tight">
              {renderInline(b.text)}
            </h2>
          ) : (
            <h3 key={i} className="pt-2 text-base font-medium text-ink">{renderInline(b.text)}</h3>
          );
        case "paragraph":
          return <p key={i}>{renderInline(b.text)}</p>;
        case "ul":
          return (
            <ul key={i} className="list-disc space-y-2 pl-5 marker:text-muted">
              {b.items.map((it, j) => <li key={j}>{renderInline(it)}</li>)}
            </ul>
          );
        case "ol":
          return (
            <ol key={i} className="list-decimal space-y-2 pl-5 marker:text-muted">
              {b.items.map((it, j) => <li key={j}>{renderInline(it)}</li>)}
            </ol>
          );
        case "table":
          return (
            <div key={i} className="overflow-x-auto rounded-lg border border-line">
              <table className="w-full text-left text-sm">
                <thead className="bg-panel">
                  <tr>{b.headers.map((h, j) => <th key={j} className="px-3 py-2 font-medium text-ink">{renderInline(h)}</th>)}</tr>
                </thead>
                <tbody>
                  {b.rows.map((r, j) => (
                    <tr key={j} className="border-t border-line align-top">
                      {r.map((c, k) => <td key={k} className="px-3 py-2 text-muted">{renderInline(c)}</td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        case "code":
          return (
            <pre key={i} className="overflow-x-auto rounded-lg border border-line bg-panel p-4 text-xs leading-relaxed">
              <code className="font-mono">{b.code}</code>
            </pre>
          );
        case "rule":
          return <hr key={i} className="border-line" />;
      }
    })}
  </div>
);
