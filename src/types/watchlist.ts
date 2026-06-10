export interface WatchlistItem {
  ticker: string;
  name: string;
  market: string;
  sector?: string;
  savedAt: string;
  memo?: string;
}

export type WatchlistInput = Omit<WatchlistItem, "savedAt">;
