"use client";

import { useEffect, useState } from "react";

import { addServerWatchlistItem, deleteServerWatchlistItem, getServerWatchlist } from "@/lib/api";
import { readAuthSession, subscribeAuthSession } from "@/lib/cognito-auth";
import {
  isTickerSaved,
  removeWatchlistItem,
  saveWatchlistItem,
  subscribeWatchlist,
} from "@/lib/watchlist-storage";
import { notifyServerWatchlistChanged } from "@/lib/watchlist-sync";
import type { WatchlistInput } from "@/types/watchlist";

export function WatchlistToggle({
  item,
  variant = "default",
}: {
  item: WatchlistInput;
  variant?: "default" | "compact";
}) {
  const [saved, setSaved] = useState(false);
  const [ready, setReady] = useState(false);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  useEffect(() => {
    const sync = () => {
      if (!readAuthSession()) {
        setSaved(isTickerSaved(item.ticker));
      }
      setReady(true);
    };

    sync();
    return subscribeWatchlist(sync);
  }, [item.ticker]);

  useEffect(() => {
    const sync = () => setAccessToken(readAuthSession()?.accessToken ?? null);
    sync();
    return subscribeAuthSession(sync);
  }, []);

  useEffect(() => {
    if (!accessToken) return;
    const token = accessToken;
    let cancelled = false;
    async function loadServerState() {
      setReady(false);
      try {
        const response = await getServerWatchlist(token);
        if (!cancelled) setSaved(response.items.some((serverItem) => serverItem.ticker === item.ticker));
      } catch {
        if (!cancelled) setSaved(false);
      } finally {
        if (!cancelled) setReady(true);
      }
    }

    void loadServerState();
    return () => {
      cancelled = true;
    };
  }, [accessToken, item.ticker]);

  async function toggle() {
    if (accessToken) {
      setReady(false);
      try {
        if (saved) {
          await deleteServerWatchlistItem(accessToken, item.ticker);
          setSaved(false);
        } else {
          await addServerWatchlistItem(accessToken, item);
          setSaved(true);
        }
        notifyServerWatchlistChanged();
      } finally {
        setReady(true);
      }
      return;
    }

    if (saved) {
      removeWatchlistItem(item.ticker);
      return;
    }

    saveWatchlistItem(item);
  }

  const label = saved ? "관심종목 해제" : "관심종목 저장";
  const baseClass =
    "inline-flex items-center justify-center rounded-md border text-sm font-semibold transition focus:outline-none focus:shadow-focus disabled:cursor-not-allowed disabled:opacity-60";
  const sizeClass = variant === "compact" ? "px-3 py-1.5" : "px-4 py-2";
  const toneClass = saved
    ? "border-accent bg-accent text-white hover:bg-ink"
    : "border-line bg-white text-ink hover:border-accent hover:text-accent";

  return (
    <button
      type="button"
      aria-pressed={saved}
      disabled={!ready}
      onClick={() => void toggle()}
      className={`${baseClass} ${sizeClass} ${toneClass}`}
    >
      {ready ? label : "상태 확인"}
    </button>
  );
}
