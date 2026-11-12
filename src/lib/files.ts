import PDFDocument from "pdfkit";
import type { GeneratedFile } from "@/types";

/** Keeps each file inside the request-body budget. Chat history is resent every turn. */
const MAX_FILE_BYTES = 1024 * 1024;
const MAX_FILES_PER_REPLY = 3;
const FILE_BLOCK = /```file\s+name="([^"\n]+)"\s*\n([\s\S]*?)```/g;

const MIME_BY_EXTENSION: Record<string, string> = {
  pdf: "application/pdf",
  md: "text/markdown",
  txt: "text/plain",
  csv: "text/csv",
  json: "application/json",
};

/**
 * Pulls ```file name="..."``` blocks out of a reply. Blocks are removed from the
 * text so they don't also appear as code. Runs before artifact extraction.
 */
export function extractFileBlocks(text: string): {
  text: string;
  files: { name: string; content: string }[];
} {
  const files: { name: string; content: string }[] = [];
  const cleaned = text
    .replace(FILE_BLOCK, (_match, name: string, content: string) => {
      if (files.length < MAX_FILES_PER_REPLY) files.push({ name: name.trim(), content });
      return "";
    })
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  return { text: cleaned, files };
}

function safeFileName(name: string): { name: string; ext: string } | null {
  const cleaned = name.replace(/[^\w.\- ]/g, "_").trim().slice(0, 80);
  const ext = cleaned.split(".").pop()?.toLowerCase() ?? "";
  if (!cleaned.includes(".") || !MIME_BY_EXTENSION[ext]) return null;
  return { name: cleaned, ext };
}

/** Minimal Markdown to PDF: headings, bullets, and paragraphs. Helvetica has limited Unicode support. */
function markdownToPdf(markdown: string): Promise<Buffer> {
  const doc = new PDFDocument({ size: "A4", margin: 56 });
  const chunks: Buffer[] = [];
  doc.on("data", (chunk: Buffer) => chunks.push(chunk));
  const done = new Promise<Buffer>((resolve, reject) => {
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
  });

  for (const raw of markdown.split("\n")) {
    const line = raw.replace(/\*\*(.+?)\*\*/g, "$1").replace(/`([^`]+)`/g, "$1");
    if (!line.trim()) {
      doc.moveDown(0.5);
    } else if (line.startsWith("# ")) {
      doc.font("Helvetica-Bold").fontSize(20).text(line.slice(2));
      doc.moveDown(0.3);
    } else if (line.startsWith("## ")) {
      doc.font("Helvetica-Bold").fontSize(15).text(line.slice(3));
      doc.moveDown(0.2);
    } else if (/^\s*[-*] /.test(line)) {
      doc.font("Helvetica").fontSize(11).text(`•  ${line.replace(/^\s*[-*] /, "")}`, { indent: 12 });
    } else {
      doc.font("Helvetica").fontSize(11).text(line);
    }
  }

  doc.end();
  return done;
}

/** Converts one generated file into a downloadable data URL. Returns null if it can't be produced. */
export async function renderGeneratedFile(
  requestedName: string,
  content: string
): Promise<GeneratedFile | null> {
  const parsed = safeFileName(requestedName);
  if (!parsed) return null;

  let buffer: Buffer;
  if (parsed.ext === "pdf") {
    buffer = await markdownToPdf(content);
  } else {
    if (parsed.ext === "json") {
      try {
        JSON.parse(content);
      } catch {
        return null;
      }
    }
    buffer = Buffer.from(content, "utf-8");
  }

  if (buffer.length > MAX_FILE_BYTES) return null;

  const type = MIME_BY_EXTENSION[parsed.ext];
  return {
    name: parsed.name,
    type,
    size: buffer.length,
    dataUrl: `data:${type};base64,${buffer.toString("base64")}`,
  };
}
