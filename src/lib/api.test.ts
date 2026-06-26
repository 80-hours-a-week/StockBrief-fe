import { afterEach, describe, expect, it, vi } from "vitest";

import { postAuthenticatedChat, postChat, searchStocks } from "./api";

describe("chat API adapters", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("falls back to a safety disclaimer when the chat contract omits safety", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        jsonResponse(
          chatContractResponse({
            safety: undefined,
          }),
        ),
      ),
    );

    const response = await postChat({
      ticker: "005930",
      message: "왜 추천됐나요?",
    });

    expect(response.policy_status).toBe("redirected");
    expect(response.disclaimer).toContain("투자 조언");
  });

  it("falls back to a safety disclaimer when the chat contract omits disclaimer", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse(chatContractResponse())));

    const response = await postChat({
      ticker: "005930",
      message: "왜 추천됐나요?",
    });

    expect(response.policy_status).toBe("allowed");
    expect(response.disclaimer).toContain("투자 조언");
  });

  it("falls back to a safety disclaimer when the chat contract sends a blank disclaimer", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        jsonResponse(
          chatContractResponse({
            safety: {
              policy_action: "ALLOW",
              disclaimer: "   ",
            },
          }),
        ),
      ),
    );

    const response = await postChat({
      ticker: "005930",
      message: "왜 추천됐나요?",
    });

    expect(response.policy_status).toBe("allowed");
    expect(response.disclaimer).toContain("투자 조언");
  });

  it("maps non-null citation published_at values to chat citation dates", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        jsonResponse(
          chatContractResponse({
            citations: [
              {
                id: "ev_005930_news",
                source_type: "NEWS",
                title: "삼성전자 뉴스",
                url: "https://example.com/news",
                published_at: "2026-06-23T09:30:00+09:00",
              },
            ],
          }),
        ),
      ),
    );

    const response = await postChat({
      ticker: "005930",
      message: "왜 추천됐나요?",
    });

    expect(response.citations).toEqual([
      {
        evidence_id: "ev_005930_news",
        type: "news",
        title: "삼성전자 뉴스",
        source_name: "NEWS",
        source_url: "https://example.com/news",
        as_of_date: "2026-06-23T09:30:00+09:00",
      },
    ]);
    expect(response.used_evidence_ids).toEqual(["ev_005930_news"]);
  });

  it("maps non-null citation published_at values for authenticated chat responses", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        jsonResponse(
          chatContractResponse({
            citations: [
              {
                id: "ev_005930_disclosure",
                source_type: "DISCLOSURE",
                title: "삼성전자 공시",
                url: "https://example.com/disclosure",
                published_at: "2026-06-22T15:00:00+09:00",
              },
            ],
          }),
        ),
      ),
    );

    const response = await postAuthenticatedChat("id-token", {
      ticker: "005930",
      message: "근거를 설명해줘",
    });

    expect(fetch).toHaveBeenCalledWith(
      "http://localhost:8000/v1/chat",
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: "Bearer id-token",
        }),
      }),
    );
    expect(response.citations).toEqual([
      {
        evidence_id: "ev_005930_disclosure",
        type: "disclosure",
        title: "삼성전자 공시",
        source_name: "DISCLOSURE",
        source_url: "https://example.com/disclosure",
        as_of_date: "2026-06-22T15:00:00+09:00",
      },
    ]);
    expect(response.used_evidence_ids).toEqual(["ev_005930_disclosure"]);
  });

  it("preserves authenticated chat message ids for persisted session tracing", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        jsonResponse(
          chatContractResponse({
            session_id: "chat-session-1",
            message_id: "msg-assistant-1",
          }),
        ),
      ),
    );

    const response = await postAuthenticatedChat("id-token", {
      ticker: "005930",
      message: "근거를 설명해줘",
    });

    expect(response.session_id).toBe("chat-session-1");
    expect(response.message_id).toBe("msg-assistant-1");
  });
});

describe("stock search API adapter", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("calls the stock search endpoint with encoded query and limit", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        jsonResponse({
          success: true,
          message: "ok",
          request_id: "req-search",
          data: {
            items: [
              {
                ticker: "005930",
                name: "삼성전자",
                market: "KOSPI",
                sector: "전기전자",
                corp_code: "00126380",
                match_reason: "name",
              },
            ],
            pagination: {
              limit: 10,
              offset: 0,
              total: 1,
              has_more: false,
            },
          },
        }),
      ),
    );

    const response = await searchStocks("삼성 전자", 10);

    expect(fetch).toHaveBeenCalledWith(
      "http://localhost:8000/v1/stocks/search?q=%EC%82%BC%EC%84%B1+%EC%A0%84%EC%9E%90&limit=10",
      expect.objectContaining({
        cache: "no-store",
      }),
    );
    expect(response).toEqual({
      query: "삼성 전자",
      count: 1,
      items: [
        {
          ticker: "005930",
          name: "삼성전자",
          market: "KOSPI",
          sector: "전기전자",
          industry: null,
        },
      ],
    });
  });
});

function jsonResponse(body: unknown): Response {
  return {
    ok: true,
    status: 200,
    json: async () => body,
  } as Response;
}

function chatContractResponse(overrides: Record<string, unknown> = {}) {
  return {
    success: true,
    message: "ok",
    request_id: "req-chat",
    data: {
      session_id: "chat-session-1",
      answer: "공개 데이터 기준 설명입니다.",
      citations: [],
      safety: {
        policy_action: "ALLOW",
      },
      ...overrides,
    },
  };
}
