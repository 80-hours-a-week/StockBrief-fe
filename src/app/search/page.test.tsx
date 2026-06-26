import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { searchStocks } from "@/lib/api";

import SearchPage from "./page";

vi.mock("@/lib/api", () => ({
  searchStocks: vi.fn(),
}));

const mockedSearchStocks = vi.mocked(searchStocks);

describe("SearchPage", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("does not call the search API before the first search", async () => {
    render(await SearchPage({ searchParams: Promise.resolve({}) }));

    expect(mockedSearchStocks).not.toHaveBeenCalled();
    expect(screen.getByText("종목명이나 6자리 종목 코드를 입력해 주세요.")).not.toBeNull();
  });

  it("does not call the search API for a whitespace-only query", async () => {
    render(await SearchPage({ searchParams: Promise.resolve({ q: "   " }) }));

    expect(mockedSearchStocks).not.toHaveBeenCalled();
    expect(screen.getByText("종목명이나 6자리 종목 코드를 입력해 주세요.")).not.toBeNull();
  });

  it("calls the search API after a non-empty query", async () => {
    mockedSearchStocks.mockResolvedValue({
      query: "삼성",
      count: 0,
      items: [],
    });

    render(await SearchPage({ searchParams: Promise.resolve({ q: " 삼성 " }) }));

    expect(mockedSearchStocks).toHaveBeenCalledWith("삼성", 20);
    expect(screen.getByText('"삼성" 검색 결과 0개')).not.toBeNull();
  });
});
