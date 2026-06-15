"use client";

import { getServerWatchlist } from "@/lib/api";
import type { ServerWatchlistResponse } from "@/types/api";

let cachedToken: string | null = null;
let cachedResponse: ServerWatchlistResponse | null = null;
let pendingToken: string | null = null;
let pendingRequest: Promise<ServerWatchlistResponse> | null = null;

const listeners = new Set<() => void>();

export function getServerWatchlistSnapshot(
  accessToken: string,
): Promise<ServerWatchlistResponse> {
  if (cachedToken === accessToken && cachedResponse) {
    return Promise.resolve(cachedResponse);
  }
  if (pendingToken === accessToken && pendingRequest) {
    return pendingRequest;
  }
  pendingToken = accessToken;
  pendingRequest = getServerWatchlist(accessToken)
    .then((response) => {
      setServerWatchlistSnapshot(accessToken, response);
      return response;
    })
    .finally(() => {
      pendingToken = null;
      pendingRequest = null;
    });
  return pendingRequest;
}

export function setServerWatchlistSnapshot(
  accessToken: string,
  response: ServerWatchlistResponse,
): void {
  cachedToken = accessToken;
  cachedResponse = response;
  emit();
}

export function clearServerWatchlistSnapshot(): void {
  cachedToken = null;
  cachedResponse = null;
  pendingToken = null;
  pendingRequest = null;
  emit();
}

export async function refreshServerWatchlistSnapshot(
  accessToken: string,
): Promise<ServerWatchlistResponse> {
  cachedToken = null;
  cachedResponse = null;
  return getServerWatchlistSnapshot(accessToken);
}

export function isTickerInServerWatchlist(ticker: string): boolean {
  return cachedResponse?.items.some((item) => item.ticker === ticker) ?? false;
}

export function subscribeServerWatchlistSnapshot(callback: () => void): () => void {
  listeners.add(callback);
  return () => {
    listeners.delete(callback);
  };
}

function emit(): void {
  listeners.forEach((listener) => listener());
}
