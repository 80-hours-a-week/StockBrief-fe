import { afterEach, describe, expect, it, vi } from "vitest";

import { postChat } from "./api";

const DEFAULT_CHAT_SAFETY_DISCLAIMER =
  "공개 데이터 기반 설명이며 투자 조언이 아닙니다. 원문 확인이 필요합니다.";

describe("postChat", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("falls back to a safety disclaimer when the chat contract omits it", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse(chatContractResponse())));

    const response = await postChat({
      ticker: "005930",
      message: "왜 추천됐나요?",
    });

    expect(response.disclaimer).toBe(DEFAULT_CHAT_SAFETY_DISCLAIMER);
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

    expect(response.disclaimer).toBe(DEFAULT_CHAT_SAFETY_DISCLAIMER);
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
