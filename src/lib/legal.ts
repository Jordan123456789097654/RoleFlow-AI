import fs from "fs";
import path from "path";

export type LegalBlock =
  | { type: "heading"; level: 2 | 3; text: string }
  | { type: "paragraph"; text: string }
  | { type: "ul"; items: string[] }
  | { type: "ol"; items: string[] }
  | { type: "table"; headers: string[]; rows: string[][] }
  | { type: "rule" }
  | { type: "code"; language: string; code: string };

export interface LegalDocument {
  title: string;
  meta: string[];
  blocks: LegalBlock[];
}

export const LEGAL_SLUGS = [
  "terms",
  "privacy",
  "acceptable-use",
  "moderation",
  "ai-output",
  "cookies",
] as const;
export type LegalSlug = (typeof LEGAL_SLUGS)[number];

const splitRow = (line: string) =>
  line.trim().replace(/^\|/, "").replace(/\|$/, "").split("|").map((c) => c.trim());

/** Parses the subset of Markdown used by the legal documents. */
export function parseLegalMarkdown(source: string): LegalDocument {
  const lines = source.replace(/\r\n/g, "\n").split("\n");
  let title = "";
  const meta: string[] = [];
  const blocks: LegalBlock[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    if (!trimmed) { i++; continue; }

    if (trimmed.startsWith("```")) {
      const language = trimmed.slice(3).trim();
      const body: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith("```")) {
        body.push(lines[i]);
        i++;
      }
      i++; // closing fence
      blocks.push({ type: "code", language, code: body.join("\n") });
      continue;
    }

    if (trimmed.startsWith("# ")) {
      if (!title) title = trimmed.slice(2).trim();
      else blocks.push({ type: "heading", level: 2, text: trimmed.slice(2).trim() });
      i++; continue;
    }
    if (trimmed.startsWith("## ")) { blocks.push({ type: "heading", level: 2, text: trimmed.slice(3).trim() }); i++; continue; }
    if (trimmed.startsWith("### ")) { blocks.push({ type: "heading", level: 3, text: trimmed.slice(4).trim() }); i++; continue; }
    if (trimmed === "---") { blocks.push({ type: "rule" }); i++; continue; }

    if (trimmed.startsWith("|")) {
      const headers = splitRow(trimmed);
      i += 2; // skip separator row
      const rows: string[][] = [];
      while (i < lines.length && lines[i].trim().startsWith("|")) {
        rows.push(splitRow(lines[i]));
        i++;
      }
      blocks.push({ type: "table", headers, rows });
      continue;
    }

    if (trimmed.startsWith("- ")) {
      const items: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith("- ")) {
        items.push(lines[i].trim().slice(2));
        i++;
      }
      blocks.push({ type: "ul", items });
      continue;
    }

    if (/^\d+\.\s/.test(trimmed)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\.\s/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^\d+\.\s/, ""));
        i++;
      }
      blocks.push({ type: "ol", items });
      continue;
    }

    // Paragraph: consecutive plain lines.
    const para: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() &&
      !/^(#{1,3}\s|---$|\||- |\d+\.\s|```)/.test(lines[i].trim())
    ) {
      para.push(lines[i].trim());
      i++;
    }
    const text = para.join(" ");
    // Lines before the first section that are bold key:value style go in the meta line.
    if (!blocks.length && text.startsWith("**")) meta.push(text);
    else blocks.push({ type: "paragraph", text });
  }

  return { title, meta, blocks };
}

export function getLegalDocument(slug: LegalSlug): LegalDocument {
  const file = path.join(process.cwd(), "src", "content", "legal", `${slug}.md`);
  return parseLegalMarkdown(fs.readFileSync(file, "utf8"));
}
