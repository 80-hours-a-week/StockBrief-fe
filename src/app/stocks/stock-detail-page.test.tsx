import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { getRecommendationCandidate, getStock, getStockEvidence } from "@/lib/api";

import StockPage from "./[ticker]/page";

vi.mock("@/lib/api", () => ({
  getRecommendationCandidate: vi.fn(),
  getStock: vi.fn(),
  getStockEvidence: vi.fn(),
}));

vi.mock("@/components/WatchlistToggle", () => ({
  WatchlistToggle: () => <button type="button">관심종목 저장</button>,
}));

vi.mock("@/components/ChatExplanationPanel", () => ({
  ChatExplanationPanel: () => <section>AI 설명 패널</section>,
}));

const mockedGetRecommendationCandidate = vi.mocked(getRecommendationCandidate);
const mockedGetStock = vi.mocked(getStock);
const mockedGetStockEvidence = vi.mocked(getStockEvidence);

describe("StockPage", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("renders stock detail labels in natural Korean", async () => {
    mockedGetRecommendationCandidate.mockResolvedValue({
      ticker: "005930",
      name: "삼성전자",
      market: "KOSPI",
      sector: "반도체",
      recommendation_score: 77.6,
      score_components: [
        {
          name: "news_attention",
          weight: 10,
          raw_score: 8,
          weighted_score: 8,
          reason: "최근 공개 근거가 확인됩니다.",
          input_refs: [],
          evidence_ids: ["ev_news_1"],
        },
      ],
      recommendation_reasons: [
        {
          reason_id: "reason-1",
          component: "news_attention",
          summary: "최근 뉴스 근거가 후보 판단에 반영됐습니다.",
          evidence_ids: ["ev_news_1"],
          source_document_ids: [],
        },
      ],
      risk_tags: ["확인 필요"],
      evidence_level: "medium",
      evidence_count: 1,
      missing_data: [],
      data_freshness: {
        as_of: "2026-06-26",
        price_as_of: "2026-06-26",
        latest_evidence_at: "2026-06-26T03:48:00Z",
      },
      disclaimer: "공개 데이터 기반 검토 후보입니다.",
    });
    mockedGetStock.mockResolvedValue({
      ticker: "005930",
      name: "삼성전자",
      name_en: null,
      market: "KOSPI",
      sector: "반도체",
      industry: null,
      listing_date: null,
      is_active: true,
      identifiers: [],
    });
    mockedGetStockEvidence.mockResolvedValue({
      ticker: "005930",
      evidence: [
        {
          id: "ev_news_1",
          type: "news",
          title: "삼성전자 뉴스",
          summary: "뉴스 요약",
          source_name: "NEWS",
          source_url: "https://example.com/news",
          source_identifier: null,
          published_at: "2026-06-26T03:48:00Z",
          as_of_date: "2026-06-26",
          data_status: "available",
        },
      ],
      message: null,
    });

    render(await StockPage({ params: Promise.resolve({ ticker: "005930" }) }));

    expect(screen.getAllByText("누락 데이터")).toHaveLength(2);
    expect(screen.getByRole("heading", { name: "점수 구성" })).not.toBeNull();
    expect(screen.getByRole("heading", { name: "리스크와 확인할 점" })).not.toBeNull();
    expect(screen.getByRole("heading", { name: "공시·뉴스·재무·가격 근거" })).not.toBeNull();
    expect(screen.getAllByText(/근거 ID:/).length).toBeGreaterThan(0);
    expect(screen.getByText(/발행일:/)).not.toBeNull();
    expect(screen.getByText(/기준일:/)).not.toBeNull();
    expect(screen.getByRole("link", { name: "원문 보기" }).getAttribute("href")).toBe(
      "https://example.com/news",
    );
    expect(screen.getByText("확인됨")).not.toBeNull();

    expect(screen.queryByText("missing data")).toBeNull();
    expect(screen.queryByText("점수 breakdown")).toBeNull();
    expect(screen.queryByText(/published:/)).toBeNull();
    expect(screen.queryByText(/as of:/)).toBeNull();
    expect(screen.queryByText(/weight/)).toBeNull();
    expect(screen.queryByText(/evidence:/)).toBeNull();
    expect(screen.queryByRole("link", { name: "source" })).toBeNull();
  });
});
