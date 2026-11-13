import { WebSource } from "@/types";

/**
 * Web search for grounding replies. Uses the Brave Search API when BRAVE_SEARCH_API_KEY is set.
 * Without a key, search is off and every call returns no results.
 */

const ENDPOINT = "https://api.search.brave.com/res/v1/web/search";
const TIMEOUT_MS = 8000;

export function isWebSearchConfigured(): boolean {
  return Boolean(process.env.BRAVE_SEARCH_API_KEY);
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
  const key = process.env.BRAVE_SEARCH_API_KEY;
  const q = query.trim().slice(0, 400);
  if (!key || !q) return [];

  try {
    const res = await fetch(`${ENDPOINT}?q=${encodeURIComponent(q)}&count=${count}`, {
      headers: { Accept: "application/json", "X-Subscription-Token": key },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!res.ok) {
      console.warn(`Web search failed: status=${res.status}`);
      return [];
    }
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
  } catch (err) {
    console.warn("Web search error:", err);
    return [];
  }
}

/** Numbered source list placed in the model's context. The model cites it as [1], [2], and so on. */
export function formatSourcesForPrompt(sources: WebSource[]): string {
  return sources
    .map((s, i) => `[${i + 1}] ${s.title} (${s.url})${s.snippet ? `\n${s.snippet}` : ""}`)
    .join("\n\n");
}
