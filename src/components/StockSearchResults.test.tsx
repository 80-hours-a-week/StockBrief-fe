import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import type { StockSearchItem } from "@/types/api";

import { StockSearchResults } from "./StockSearchResults";

describe("StockSearchResults", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders search results as stock detail links", () => {
    render(<StockSearchResults query="삼성" items={[stockSearchItem()]} />);

    const link = screen.getByRole("link", { name: /삼성전자/ });
    expect(link.getAttribute("href")).toBe("/stocks/005930");
    expect(screen.getByText("005930 · KOSPI")).not.toBeNull();
    expect(screen.getByText("전기전자")).not.toBeNull();
  });

  it("shows an empty result message after a search", () => {
    render(<StockSearchResults query="없는종목" items={[]} />);

    expect(screen.getByText("검색 결과가 없습니다.")).not.toBeNull();
  });

  it("asks for a query before the first search", () => {
    render(<StockSearchResults query="" items={[]} />);

    expect(screen.getByText("종목명이나 6자리 종목 코드를 입력해 주세요.")).not.toBeNull();
  });
});

function stockSearchItem(overrides: Partial<StockSearchItem> = {}): StockSearchItem {
  return {
    ticker: "005930",
    name: "삼성전자",
    market: "KOSPI",
    sector: "전기전자",
    industry: null,
    ...overrides,
  };
}
