import pdfParse from "pdf-parse/lib/pdf-parse.js";
import { Attachment, Message } from "@/types";

/** Base64 data URLs travel in the request body, and Vercel caps request bodies at about 4.5 MB. */
export const MAX_PDF_BYTES = 4 * 1024 * 1024;
const MAX_EXTRACTED_CHARS = 200_000;

export type PdfExtraction =
  | { ok: true; text: string; pages: number }
  | { ok: false; error: string };

export async function extractPdfText(dataUrl: string): Promise<PdfExtraction> {
  const match = dataUrl.match(/^data:application\/pdf;base64,(.+)$/);
  if (!match) return { ok: false, error: "The attached file is not a valid PDF." };

  const bytes = Buffer.from(match[1], "base64");
  if (bytes.length > MAX_PDF_BYTES) {
    return { ok: false, error: "PDFs must be 4 MB or smaller." };
  }
  if (!bytes.subarray(0, 5).toString("latin1").startsWith("%PDF-")) {
    return { ok: false, error: "The attached file is not a valid PDF." };
  }

  try {
    const result = await pdfParse(bytes);
    const text = (result.text || "")
      .replace(/\r\n/g, "\n")
      .replace(/[ \t]+\n/g, "\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim();

    if (!text) {
      return {
        ok: false,
        error: "This PDF has no extractable text. Scanned PDFs need OCR, which isn't supported yet.",
      };
    }
    return { ok: true, text: text.slice(0, MAX_EXTRACTED_CHARS), pages: result.numpages };
  } catch (err) {
    console.error("PDF extraction failed:", err);
    return {
      ok: false,
      error: "Couldn't read this PDF. It may be corrupted or password-protected.",
    };
  }
}

/**
 * Replaces each PDF attachment with its extracted text, in place, before anything
 * else touches the messages. Downstream code then handles PDFs like any text file:
 * the keyword scanner, the incident log, and the model prompt all see the text.
 * Returns an error message for the client, or null on success.
 */
export async function convertPdfAttachments(messages: Message[]): Promise<string | null> {
  for (const m of messages) {
    if (!m.attachments?.length) continue;
    const converted: Attachment[] = [];
    for (const a of m.attachments) {
      if (a.type !== "application/pdf") {
        converted.push(a);
        continue;
      }
      const result = await extractPdfText(a.content);
      if (!result.ok) return `"${a.name}": ${result.error}`;
      converted.push({
        name: a.name,
        type: "text/plain",
        size: a.size,
        content: `[Text extracted from PDF, ${result.pages} page(s)]\n${result.text}`,
      });
    }
    m.attachments = converted;
  }
  return null;
}
