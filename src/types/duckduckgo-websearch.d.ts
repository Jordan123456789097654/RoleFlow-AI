declare module "duckduckgo-websearch" {
  export interface SearchResultItem {
    title: string;
    link: string;
    snippet: string;
    position: number;
  }

  export class WebSearch {
    constructor();
    search(query: string, count?: number): Promise<SearchResultItem[]>;
  }

  export class WebFetcher {
    constructor();
  }

  export class SearchError extends Error {}
}
