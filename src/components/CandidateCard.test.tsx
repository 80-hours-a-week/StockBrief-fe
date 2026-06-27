import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { CandidateCard } from "./CandidateCard";

vi.mock("@/components/WatchlistToggle", () => ({
  WatchlistToggle: () => <button type="button">관심종목 저장</button>,
}));

describe("CandidateCard", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders candidate status labels in natural Korean", () => {
    render(<CandidateCard candidate={candidate()} />);

    expect(screen.getByText("누락 데이터")).not.toBeNull();
    expect(screen.getByText("2개 확인 필요")).not.toBeNull();
    expect(screen.queryByText("missing data")).toBeNull();
  });
});

function candidate() {
  return {
    ticker: "005930",
    name: "삼성전자",
    market: "KOSPI",
    sector: "반도체",
    recommendation_score: 77.6,
    score_components: [],
    recommendation_reasons: [
      {
        reason_id: "reason-1",
        component: "news_attention",
        summary: "최근 공개 근거가 후보 판단에 반영됐습니다.",
        evidence_ids: [],
        source_document_ids: [],
      },
    ],
    risk_tags: ["확인 필요"],
    evidence_level: "medium" as const,
    evidence_count: 3,
    missing_data: ["financial_statement", "price"],
    data_freshness: {
      as_of: "2026-06-26",
    },
    disclaimer: "공개 데이터 기반 검토 후보입니다.",
  };
}
