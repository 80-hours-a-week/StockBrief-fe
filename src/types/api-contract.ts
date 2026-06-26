export interface ApiEnvelope<T> {
  success: true;
  data: T;
  message: string;
  request_id: string;
}

export interface PaginationContract {
  limit: number;
  offset: number;
  total: number;
  has_more: boolean;
}

export type StockCandidateContractResponse = ApiEnvelope<{
  as_of: string;
  items: StockCandidateContractItem[];
  pagination: PaginationContract;
}>;

export interface StockCandidateContractItem {
  ticker: string;
  name: string;
  market: string;
  sector: string | null;
  score: {
    total: number;
    grade: string;
    as_of: string;
    version: string;
    breakdown: {
      momentum: number;
      liquidity: number;
      disclosure: number;
      news: number;
    };
  };
  price: {
    close: number | null;
    change_rate: number | null;
    volume: number | null;
    trade_date: string | null;
  } | null;
  evidence_summary: {
    news_count: number;
    disclosure_count: number;
    latest_at: string | null;
  };
}

export type StockSearchContractResponse = ApiEnvelope<{
  items: Array<{
    ticker: string;
    name: string;
    market: string;
    sector: string | null;
    corp_code: string | null;
    match_reason: string;
  }>;
  pagination: PaginationContract;
}>;

export type StockDetailContractResponse = ApiEnvelope<{
  stock: {
    ticker: string;
    name: string;
    market: string;
    sector: string | null;
    corp_code: string | null;
  };
}>;

export type StockEvidenceContractResponse = ApiEnvelope<{
  ticker: string;
  items: Array<{
    id: string;
    source_type: "NEWS" | "DISCLOSURE" | "SCORE" | "CHUNK";
    title: string;
    source_name: string;
    url: string | null;
    published_at: string | null;
    snippet: string;
    metadata: Record<string, unknown>;
  }>;
  pagination: PaginationContract;
}>;

export type ChatContractResponse = ApiEnvelope<{
  session_id: string;
  message_id?: string | null;
  answer: string;
  citations: Array<{
    id: string;
    source_type: "NEWS" | "DISCLOSURE" | "SCORE" | "CHUNK";
    title: string;
    url: string | null;
    published_at: string | null;
  }>;
  safety: {
    policy_action: "ALLOW" | "REDIRECT" | "BLOCK";
    disclaimer: string;
  };
}>;
