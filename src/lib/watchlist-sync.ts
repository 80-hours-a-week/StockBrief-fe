"use client";

import { getServerWatchlist, importServerWatchlist } from "@/lib/api";
import { readWatchlist } from "@/lib/watchlist-storage";
import type { MeResponse, ServerWatchlistItem } from "@/types/api";
import type { WatchlistInput } from "@/types/watchlist";

export const WATCHLIST_SYNC_STATE_KEY = "stockbrief_watchlist_v1_sync_state";
export const SERVER_WATCHLIST_CHANGED_EVENT = "stockbrief_server_watchlist_changed";

export interface WatchlistSyncResult {
  importedCount: number;
  skippedExistingCount: number;
  items: ServerWatchlistItem[];
}

interface SyncState {
  [cognitoSub: string]: {
    syncedAt: string;
  };
}

export async function importLocalWatchlistOnce(
  accessToken: string,
  me: MeResponse,
): Promise<WatchlistSyncResult> {
  const server = await getServerWatchlist(accessToken);
  const serverTickers = new Set(server.items.map((item) => item.ticker));
  const localItems: WatchlistInput[] = readWatchlist()
    .filter((item) => !serverTickers.has(item.ticker))
    .map((item) => ({
      ticker: item.ticker,
      name: item.name,
      market: item.market,
      ...(item.sector ? { sector: item.sector } : {}),
      ...(item.memo ? { memo: item.memo } : {}),
    }));

  const imported =
    localItems.length > 0
      ? await importServerWatchlist(accessToken, localItems)
      : {
          imported_count: 0,
          skipped_existing_count: 0,
          items: server.items,
        };

  markSynced(me.cognito_sub);
  return {
    importedCount: imported.imported_count,
    skippedExistingCount: imported.skipped_existing_count,
    items: imported.items,
  };
}

export function notifyServerWatchlistChanged(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(SERVER_WATCHLIST_CHANGED_EVENT));
}

export function subscribeServerWatchlistChanged(callback: () => void): () => void {
  if (typeof window === "undefined") return () => undefined;
  window.addEventListener(SERVER_WATCHLIST_CHANGED_EVENT, callback);
  return () => window.removeEventListener(SERVER_WATCHLIST_CHANGED_EVENT, callback);
}

function markSynced(cognitoSub: string): void {
  if (typeof window === "undefined") return;
  const state = readState();
  state[cognitoSub] = { syncedAt: new Date().toISOString() };
  window.localStorage.setItem(WATCHLIST_SYNC_STATE_KEY, JSON.stringify(state));
}

function readState(): SyncState {
  if (typeof window === "undefined") return {};
  const raw = window.localStorage.getItem(WATCHLIST_SYNC_STATE_KEY);
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
    return parsed as SyncState;
  } catch {
    return {};
  }
}
