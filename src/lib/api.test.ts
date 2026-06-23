import { afterEach, describe, expect, it, vi } from "vitest";

import { postChat } from "./api";

describe("postChat", () => {
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
