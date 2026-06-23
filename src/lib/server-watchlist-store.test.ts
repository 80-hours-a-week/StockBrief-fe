import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { getServerWatchlist, importServerWatchlist } from "@/lib/api";
import { WATCHLIST_STORAGE_KEY } from "@/lib/watchlist-storage";
import type { MeResponse, ServerWatchlistItem, ServerWatchlistResponse } from "@/types/api";

import {
  WATCHLIST_SYNC_STATE_KEY,
  clearServerWatchlistSnapshot,
  importLocalWatchlistOnce,
} from "./server-watchlist-store";

vi.mock("@/lib/api", () => ({
  getServerWatchlist: vi.fn(),
  importServerWatchlist: vi.fn(),
}));

const mockedGetServerWatchlist = vi.mocked(getServerWatchlist);
const mockedImportServerWatchlist = vi.mocked(importServerWatchlist);

describe("importLocalWatchlistOnce", () => {
  beforeEach(() => {
    clearServerWatchlistSnapshot();
    window.localStorage.clear();
    mockedGetServerWatchlist.mockResolvedValue(watchlistResponse([]));
    mockedImportServerWatchlist.mockResolvedValue({
      imported_count: 1,
      skipped_existing_count: 0,
      items: [serverItem("005930")],
    });
  });

  afterEach(() => {
    clearServerWatchlistSnapshot();
    window.localStorage.clear();
    vi.clearAllMocks();
  });

  it("imports local items once while the local watchlist fingerprint is unchanged", async () => {
    writeLocalWatchlist([localItem("005930", "삼성전자")]);

    const first = await importLocalWatchlistOnce("token-1", me("cognito-sub-1"));
    const second = await importLocalWatchlistOnce("token-1", me("cognito-sub-1"));

    expect(first).toMatchObject({
      importedCount: 1,
      skippedExistingCount: 0,
      alreadySynced: false,
    });
    expect(second).toMatchObject({
      importedCount: 0,
      skippedExistingCount: 0,
      alreadySynced: true,
    });
    expect(mockedImportServerWatchlist).toHaveBeenCalledTimes(1);
    expect(mockedImportServerWatchlist).toHaveBeenCalledWith("token-1", [
      {
        ticker: "005930",
        name: "삼성전자",
        market: "KOSPI",
        sector: "반도체",
      },
    ]);
    const syncState = JSON.parse(window.localStorage.getItem(WATCHLIST_SYNC_STATE_KEY) ?? "{}") as {
      "cognito-sub-1"?: { localWatchlistFingerprint?: string };
    };
    expect(syncState["cognito-sub-1"]?.localWatchlistFingerprint).toBeTypeOf("string");
  });

  it("imports newly added local items for the same Cognito subject after logout", async () => {
    mockedImportServerWatchlist
      .mockResolvedValueOnce({
        imported_count: 1,
        skipped_existing_count: 0,
        items: [serverItem("005930")],
      })
      .mockResolvedValueOnce({
        imported_count: 1,
        skipped_existing_count: 0,
        items: [serverItem("005930"), serverItem("000660")],
      });

    writeLocalWatchlist([localItem("005930", "삼성전자")]);
    await importLocalWatchlistOnce("token-1", me("cognito-sub-1"));

    writeLocalWatchlist([localItem("005930", "삼성전자"), localItem("000660", "SK하이닉스")]);
    const second = await importLocalWatchlistOnce("token-1", me("cognito-sub-1"));

    expect(second).toMatchObject({
      importedCount: 1,
      skippedExistingCount: 0,
      alreadySynced: false,
    });
    expect(mockedImportServerWatchlist).toHaveBeenCalledTimes(2);
    expect(mockedImportServerWatchlist).toHaveBeenNthCalledWith(2, "token-1", [
      {
        ticker: "000660",
        name: "SK하이닉스",
        market: "KOSPI",
        sector: "반도체",
      },
    ]);
  });
});

function me(cognitoSub: string): MeResponse {
  return {
    id: "user-1",
    cognito_sub: cognitoSub,
    email: "user@example.com",
    email_verified: true,
    nickname: null,
  };
}

function serverItem(ticker: string): ServerWatchlistItem {
  return {
    ticker,
    name: ticker === "000660" ? "SK하이닉스" : "삼성전자",
    market: "KOSPI",
    sector: "반도체",
    memo: null,
    saved_at: "2026-06-23T00:00:00.000Z",
  };
}

function watchlistResponse(items: ServerWatchlistItem[]): ServerWatchlistResponse {
  return {
    items,
    count: items.length,
  };
}

function localItem(ticker: string, name: string) {
  return {
    ticker,
    name,
    market: "KOSPI",
    sector: "반도체",
    savedAt: `2026-06-23T00:00:00.000Z-${ticker}`,
  };
}

function writeLocalWatchlist(items: ReturnType<typeof localItem>[]): void {
  window.localStorage.setItem(WATCHLIST_STORAGE_KEY, JSON.stringify(items));
}
