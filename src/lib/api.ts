import type {
  ChatRequest,
  ChatResponse,
  MeResponse,
  RecommendationCandidate,
  RecommendationCandidateList,
  RiskProfile,
  ServerWatchlistImportResponse,
  ServerWatchlistResponse,
  StockDetail,
  StockEvidenceResponse,
  StockSearchResponse,
  UserChatSessionListResponse,
  UserPreferencesResponse,
} from "@/types/api";
import type { WatchlistInput } from "@/types/watchlist";

const DEFAULT_API_BASE_URL = "http://localhost:8000/v1";

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

function apiBaseUrl(): string {
  return (process.env.NEXT_PUBLIC_API_BASE_URL ?? DEFAULT_API_BASE_URL).replace(/\/$/, "");
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${apiBaseUrl()}${path}`, {
    ...init,
    headers: {
      Accept: "application/json",
      ...init?.headers,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new ApiError(`API request failed: ${path}`, response.status);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

async function authorizedRequest<T>(
  path: string,
  accessToken: string,
  init?: RequestInit,
): Promise<T> {
  return request<T>(path, {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      ...init?.headers,
    },
  });
}

export interface CandidateQuery {
  riskProfile?: RiskProfile;
  market?: "KOSPI" | "KOSDAQ";
  sector?: string;
  limit?: number;
}

export async function getRecommendationCandidates(
  query: CandidateQuery = {},
): Promise<RecommendationCandidateList> {
  const params = new URLSearchParams();
  if (query.riskProfile) params.set("risk_profile", query.riskProfile);
  if (query.market) params.set("market", query.market);
  if (query.sector) params.set("sector", query.sector);
  if (query.limit) params.set("limit", String(query.limit));
  const suffix = params.toString() ? `?${params.toString()}` : "";
  return request<RecommendationCandidateList>(`/recommendations/candidates${suffix}`);
}

export async function getRecommendationCandidate(
  ticker: string,
): Promise<RecommendationCandidate> {
  return request<RecommendationCandidate>(`/recommendations/candidates/${ticker}`);
}

export async function searchStocks(query = "", limit = 20): Promise<StockSearchResponse> {
  const params = new URLSearchParams();
  if (query) params.set("q", query);
  params.set("limit", String(limit));
  return request<StockSearchResponse>(`/stocks/search?${params.toString()}`);
}

export async function getStock(ticker: string): Promise<StockDetail> {
  return request<StockDetail>(`/stocks/${ticker}`);
}

export async function getStockEvidence(
  ticker: string,
  types?: Array<"financial" | "news" | "disclosure" | "price">,
): Promise<StockEvidenceResponse> {
  const params = new URLSearchParams();
  if (types?.length) params.set("types", types.join(","));
  const suffix = params.toString() ? `?${params.toString()}` : "";
  return request<StockEvidenceResponse>(`/stocks/${ticker}/evidence${suffix}`);
}

export async function postChat(requestBody: ChatRequest): Promise<ChatResponse> {
  return request<ChatResponse>("/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestBody),
  });
}

export async function postAuthenticatedChat(
  accessToken: string,
  requestBody: ChatRequest,
): Promise<ChatResponse> {
  return authorizedRequest<ChatResponse>("/chat", accessToken, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestBody),
  });
}

export async function getMe(accessToken: string): Promise<MeResponse> {
  return authorizedRequest<MeResponse>("/me", accessToken);
}

export async function patchMe(
  accessToken: string,
  body: { nickname?: string | null },
): Promise<MeResponse> {
  return authorizedRequest<MeResponse>("/me", accessToken, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
}

export async function getUserPreferences(accessToken: string): Promise<UserPreferencesResponse> {
  return authorizedRequest<UserPreferencesResponse>("/me/preferences", accessToken);
}

export async function putUserPreferences(
  accessToken: string,
  preferences: Record<string, unknown>,
): Promise<UserPreferencesResponse> {
  return authorizedRequest<UserPreferencesResponse>("/me/preferences", accessToken, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ preferences }),
  });
}

export async function getServerWatchlist(accessToken: string): Promise<ServerWatchlistResponse> {
  return authorizedRequest<ServerWatchlistResponse>("/me/watchlist", accessToken);
}

export async function addServerWatchlistItem(
  accessToken: string,
  item: WatchlistInput,
): Promise<void> {
  await authorizedRequest("/me/watchlist", accessToken, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(item),
  });
}

export async function deleteServerWatchlistItem(
  accessToken: string,
  ticker: string,
): Promise<void> {
  await authorizedRequest(`/me/watchlist/${ticker}`, accessToken, {
    method: "DELETE",
  });
}

export async function patchServerWatchlistItem(
  accessToken: string,
  ticker: string,
  body: { memo?: string | null },
): Promise<void> {
  await authorizedRequest(`/me/watchlist/${ticker}`, accessToken, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
}

export async function importServerWatchlist(
  accessToken: string,
  items: WatchlistInput[],
): Promise<ServerWatchlistImportResponse> {
  return authorizedRequest<ServerWatchlistImportResponse>("/me/watchlist/import", accessToken, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ items }),
  });
}

export async function getUserChatSessions(
  accessToken: string,
): Promise<UserChatSessionListResponse> {
  return authorizedRequest<UserChatSessionListResponse>("/me/chat-sessions", accessToken);
}
