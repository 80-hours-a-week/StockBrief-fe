"use client";

import type { WatchlistInput, WatchlistItem } from "@/types/watchlist";

export const WATCHLIST_STORAGE_KEY = "stockbrief_watchlist_v1";

const WATCHLIST_CHANGED_EVENT = "stockbrief_watchlist_changed";

export function readWatchlist(): WatchlistItem[] {
  if (typeof window === "undefined") return [];

  const raw = window.localStorage.getItem(WATCHLIST_STORAGE_KEY);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return dedupeWatchlist(parsed.filter(isWatchlistItem));
  } catch {
    return [];
  }
}

export function saveWatchlistItem(input: WatchlistInput): WatchlistItem[] {
  const current = readWatchlist();
  const existing = current.find((item) => item.ticker === input.ticker);
  if (existing) return current;

  const nextItem: WatchlistItem = {
    ticker: input.ticker,
    name: input.name,
    market: input.market,
    savedAt: new Date().toISOString(),
    ...(input.sector ? { sector: input.sector } : {}),
    ...(input.memo ? { memo: input.memo } : {}),
  };

  return writeWatchlist([nextItem, ...current]);
}

export function removeWatchlistItem(ticker: string): WatchlistItem[] {
  return writeWatchlist(readWatchlist().filter((item) => item.ticker !== ticker));
}

export function updateWatchlistMemo(ticker: string, memo: string): WatchlistItem[] {
  const normalizedMemo = memo.trim();
  return writeWatchlist(
    readWatchlist().map((item) => {
      if (item.ticker !== ticker) return item;
      if (normalizedMemo) return { ...item, memo: normalizedMemo };
      return {
        ticker: item.ticker,
        name: item.name,
        market: item.market,
        savedAt: item.savedAt,
        ...(item.sector ? { sector: item.sector } : {}),
      };
    }),
  );
}

export function isTickerSaved(ticker: string): boolean {
  return readWatchlist().some((item) => item.ticker === ticker);
}

export function subscribeWatchlist(callback: () => void): () => void {
  if (typeof window === "undefined") return () => undefined;

  const handleStorage = (event: StorageEvent) => {
    if (event.key === WATCHLIST_STORAGE_KEY) callback();
  };

  window.addEventListener("storage", handleStorage);
  window.addEventListener(WATCHLIST_CHANGED_EVENT, callback);

  return () => {
    window.removeEventListener("storage", handleStorage);
    window.removeEventListener(WATCHLIST_CHANGED_EVENT, callback);
  };
}

function writeWatchlist(items: WatchlistItem[]): WatchlistItem[] {
  if (typeof window === "undefined") return [];

  const next = dedupeWatchlist(items);
  window.localStorage.setItem(WATCHLIST_STORAGE_KEY, JSON.stringify(next));
  window.dispatchEvent(new CustomEvent(WATCHLIST_CHANGED_EVENT));
  return next;
}

function dedupeWatchlist(items: WatchlistItem[]): WatchlistItem[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    if (seen.has(item.ticker)) return false;
    seen.add(item.ticker);
    return true;
  });
}

function isWatchlistItem(value: unknown): value is WatchlistItem {
  if (!value || typeof value !== "object") return false;
  const item = value as Partial<WatchlistItem>;
  return (
    typeof item.ticker === "string" &&
    typeof item.name === "string" &&
    typeof item.market === "string" &&
    typeof item.savedAt === "string" &&
    (typeof item.sector === "undefined" || typeof item.sector === "string") &&
    (typeof item.memo === "undefined" || typeof item.memo === "string")
  );
}
