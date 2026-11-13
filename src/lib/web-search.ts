import { WebSource } from "@/types";
import { WebSearch } from "duckduckgo-websearch";

/**
 * Web search for grounding replies.
 * Uses DuckDuckGo by default (zero API key required).
 * If DuckDuckGo fails or is unreachable, optionally falls back to Brave Search when BRAVE_SEARCH_API_KEY is configured.
 */

const BRAVE_ENDPOINT = "https://api.search.brave.com/res/v1/web/search";
const TIMEOUT_MS = 8000;

export function isWebSearchConfigured(): boolean {
  // Free DuckDuckGo search is always available with 0 API keys required.
  return true;
}

function stripHtml(text: string): string {
  return text
    .replace(/<[^>]+>/g, "")
    .replace(/&quot;/g, '"')
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .trim();
}

export async function searchWeb(query: string, count = 5): Promise<WebSource[]> {
  const q = query.trim().slice(0, 400);
  if (!q) return [];

  // 1. Primary: DuckDuckGo Web Search (zero API key required)
  try {
    const ws = new WebSearch();
    const results = await Promise.race([
      ws.search(q, Math.min(count * 2, 10)),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("DuckDuckGo search timeout")), TIMEOUT_MS)
      ),
    ]);

    if (Array.isArray(results) && results.length > 0) {
      const parsed: WebSource[] = results
        .map((r) => ({
          title: stripHtml(String(r.title ?? r.link ?? "")),
          url: String(r.link ?? ""),
          snippet: stripHtml(String(r.snippet ?? "")).slice(0, 400),
        }))
        .filter((r) => /^https?:\/\//i.test(r.url) && r.title)
        .slice(0, count);

      if (parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn("DuckDuckGo search warning, trying fallback:", err);
  }

  // 2. Secondary fallback: Brave Search API if key is explicitly set
  const braveKey = process.env.BRAVE_SEARCH_API_KEY;
  if (braveKey) {
    try {
      const res = await fetch(`${BRAVE_ENDPOINT}?q=${encodeURIComponent(q)}&count=${count}`, {
        headers: { Accept: "application/json", "X-Subscription-Token": braveKey },
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
      if (res.ok) {
        const data = await res.json();
        const results: any[] = Array.isArray(data?.web?.results) ? data.web.results : [];
        return results
          .map((r) => ({
            title: stripHtml(String(r.title ?? r.url ?? "")),
            url: String(r.url ?? ""),
            snippet: stripHtml(String(r.description ?? "")).slice(0, 400),
          }))
          .filter((r) => /^https?:\/\//i.test(r.url) && r.title)
          .slice(0, count);
      }
    } catch (err) {
      console.warn("Brave search fallback error:", err);
    }
  }

  return [];
}

/** Numbered source list placed in the model's context. The model cites it as [1], [2], and so on. */
export function formatSourcesForPrompt(sources: WebSource[]): string {
  return sources
    .map((s, i) => `[${i + 1}] ${s.title} (${s.url})${s.snippet ? `\n${s.snippet}` : ""}`)
    .join("\n\n");
}
