import JSZip from "jszip";
import { Attachment, Message } from "@/types";

/**
 * Turns Word (.docx) and Excel (.xlsx) attachments into plain text, so every later step handles
 * them like any text file. Both formats are zip archives of XML, read here with JSZip.
 */

const MAX_OUTPUT_CHARS = 60_000;
const MAX_SHEETS = 10;
const MAX_SHEET_ROWS = 300;
const MAX_SHEET_COLUMNS = 40;

const DOCX_TYPE = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
const XLSX_TYPE = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

export type OfficeKind = "docx" | "xlsx";

export function officeKind(a: Attachment): OfficeKind | null {
  const name = a.name.toLowerCase();
  if (a.type === DOCX_TYPE || name.endsWith(".docx")) return "docx";
  if (a.type === XLSX_TYPE || name.endsWith(".xlsx")) return "xlsx";
  return null;
}

function decodeXml(text: string): string {
  return text
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&amp;/g, "&");
}

/** Reads one attribute value from an XML start tag. */
function attr(tag: string, name: string): string | undefined {
  const m = tag.match(new RegExp(`\\s${name}="([^"]*)"`));
  return m ? decodeXml(m[1]) : undefined;
}

/** Zero-based column index from a cell reference such as "C7". */
function columnIndex(ref: string): number {
  const letters = (ref.match(/^[A-Za-z]+/) || ["A"])[0].toUpperCase();
  let n = 0;
  for (let i = 0; i < letters.length; i++) n = n * 26 + (letters.charCodeAt(i) - 64);
  return n - 1;
}

async function loadZip(dataUrl: string): Promise<JSZip> {
  const comma = dataUrl.indexOf(",");
  const base64 = comma >= 0 ? dataUrl.slice(comma + 1) : dataUrl;
  return JSZip.loadAsync(Buffer.from(base64, "base64"));
}

async function readEntry(zip: JSZip, path: string): Promise<string | null> {
  const file = zip.file(path);
  return file ? file.async("string") : null;
}

/** Text inside <tag>...</tag> elements, such as Word runs (w:t) or shared strings (t). */
function textRuns(xml: string, tagName: string): string {
  const runs = xml.match(new RegExp(`<${tagName}(?: [^>]*)?>[\\s\\S]*?</${tagName}>`, "g")) || [];
  return runs.map((r) => decodeXml(r.replace(new RegExp(`</?${tagName}(?: [^>]*)?>`, "g"), ""))).join("");
}

async function extractDocx(zip: JSZip): Promise<string> {
  const xml = await readEntry(zip, "word/document.xml");
  if (!xml) throw new Error("No document body");
  const paragraphs = xml.match(/<w:p[ >][\s\S]*?<\/w:p>/g) || [];
  return paragraphs
    .map((p) => textRuns(p, "w:t"))
    .join("\n")
    .trim();
}

async function extractXlsx(zip: JSZip): Promise<string> {
  const sharedXml = (await readEntry(zip, "xl/sharedStrings.xml")) || "";
  const shared = (sharedXml.match(/<si>[\s\S]*?<\/si>/g) || []).map((si) => textRuns(si, "t"));

  const workbookXml = (await readEntry(zip, "xl/workbook.xml")) || "";
  const relsXml = (await readEntry(zip, "xl/_rels/workbook.xml.rels")) || "";
  const targets = new Map<string, string>();
  for (const tag of relsXml.match(/<Relationship\b[^>]*>/g) || []) {
    const id = attr(tag, "Id");
    const target = attr(tag, "Target");
    if (id && target) targets.set(id, target);
  }

  const sheets: { name: string; path: string }[] = [];
  for (const tag of workbookXml.match(/<sheet\b[^>]*>/g) || []) {
    const name = attr(tag, "name") || `Sheet ${sheets.length + 1}`;
    const target = targets.get(attr(tag, "r:id") || "");
    if (!target) continue;
    const path = target.startsWith("/") ? target.slice(1) : `xl/${target}`;
    sheets.push({ name, path });
  }

  const out: string[] = [];
  for (const sheet of sheets.slice(0, MAX_SHEETS)) {
    const xml = await readEntry(zip, sheet.path);
    if (!xml) continue;
    const rows: string[] = [];
    const rowRe = /<row\b[^>]*>([\s\S]*?)<\/row>/g;
    let rowMatch: RegExpExecArray | null;
    while ((rowMatch = rowRe.exec(xml)) && rows.length < MAX_SHEET_ROWS) {
      const cells: string[] = [];
      const cellRe = /<c\b([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g;
      let cellMatch: RegExpExecArray | null;
      while ((cellMatch = cellRe.exec(rowMatch[1]))) {
        const tag = cellMatch[1];
        const body = cellMatch[2] || "";
        const ref = attr(tag, "r");
        const type = attr(tag, "t");
        const col = ref ? columnIndex(ref) : cells.length;
        const v = body.match(/<v>([\s\S]*?)<\/v>/);
        let value = "";
        if (type === "s" && v) value = shared[Number(v[1])] ?? "";
        else if (type === "inlineStr") value = textRuns(body, "t");
        else if (v) value = decodeXml(v[1]);
        if (col < 0 || col >= MAX_SHEET_COLUMNS) continue;
        while (cells.length < col) cells.push("");
        cells[col] = value.replace(/[\t\r\n]+/g, " ");
      }
      if (cells.some((c) => c !== "")) rows.push(cells.join("\t"));
    }
    out.push(`## Sheet: ${sheet.name}\n${rows.join("\n")}`);
  }
  return out.join("\n\n").trim();
}

/**
 * Replaces Word and Excel attachments in the messages with extracted text. Returns an error
 * message for a file that cannot be read, or null when every file converted.
 */
export async function convertOfficeAttachments(messages: Message[]): Promise<string | null> {
  for (const m of messages) {
    if (!m.attachments?.length) continue;
    const converted: Attachment[] = [];
    for (const a of m.attachments) {
      const kind = officeKind(a);
      if (!kind) {
        converted.push(a);
        continue;
      }
      let text: string;
      try {
        const zip = await loadZip(a.content);
        text = kind === "docx" ? await extractDocx(zip) : await extractXlsx(zip);
      } catch {
        return `"${a.name}" could not be read. It may be damaged, or it may be password protected.`;
      }
      if (!text) return `"${a.name}" has no readable text.`;
      const clipped = text.length > MAX_OUTPUT_CHARS ? `${text.slice(0, MAX_OUTPUT_CHARS)}\n[Truncated]` : text;
      const label = kind === "docx" ? "Word document" : "Excel workbook";
      converted.push({
        name: a.name,
        type: "text/plain",
        size: a.size,
        content: `[Text extracted from ${label}]\n${clipped}`,
      });
    }
    m.attachments = converted;
  }
  return null;
}
