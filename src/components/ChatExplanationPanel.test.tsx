import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { postAuthenticatedChat, postChat } from "@/lib/api";
import { readApiAuthToken, subscribeAuthSession } from "@/lib/cognito-auth";
import type { ChatResponse } from "@/types/api";

import { ChatExplanationPanel } from "./ChatExplanationPanel";

vi.mock("@/lib/api", () => ({
  postAuthenticatedChat: vi.fn(),
  postChat: vi.fn(),
}));

vi.mock("@/lib/cognito-auth", () => ({
  readApiAuthToken: vi.fn(),
  subscribeAuthSession: vi.fn(),
}));

const mockedPostAuthenticatedChat = vi.mocked(postAuthenticatedChat);
const mockedPostChat = vi.mocked(postChat);
const mockedReadApiAuthToken = vi.mocked(readApiAuthToken);
const mockedSubscribeAuthSession = vi.mocked(subscribeAuthSession);

describe("ChatExplanationPanel", () => {
  beforeEach(() => {
    mockedReadApiAuthToken.mockReturnValue(null);
    mockedSubscribeAuthSession.mockReturnValue(() => undefined);
    mockedPostChat.mockResolvedValue(chatResponse());
    mockedPostAuthenticatedChat.mockResolvedValue(chatResponse());
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("renders a public explanation with evidence and safety disclaimer", async () => {
    render(<ChatExplanationPanel ticker="005930" />);

    fireEvent.click(screen.getByRole("button", { name: "왜 추천됐나요?" }));

    await waitFor(() => {
      expect(mockedPostChat).toHaveBeenCalledWith({
        ticker: "005930",
        message: "왜 추천됐나요?",
        title: "005930 추천 이유 설명",
      });
    });
    expect(await screen.findByText("근거 기반 설명")).not.toBeNull();
    expect(screen.getByText("공개 데이터 기준 설명입니다.")).not.toBeNull();
    expect(screen.getByText("이 정보는 투자 조언이 아니며 원문 확인이 필요합니다.")).not.toBeNull();
    expect(screen.getByText("사용된 근거")).not.toBeNull();
    expect(screen.getByRole("link", { name: "원문" }).getAttribute("href")).toBe(
      "https://example.com/news",
    );
    expect(screen.queryByText(/^policy:/)).toBeNull();
    expect(screen.queryByText(/^session:/)).toBeNull();
  });

  it("does not render citation source links with unsafe URL schemes", async () => {
    mockedPostChat.mockResolvedValue(
      chatResponse({
        citations: [
          {
            evidence_id: "ev_javascript_url",
            type: "news",
            title: "비정상 URL 뉴스",
            source_name: "NEWS",
            source_url: "javascript:alert(1)",
            as_of_date: "2026-06-23",
          },
          {
            evidence_id: "ev_data_url",
            type: "disclosure",
            title: "비정상 URL 공시",
            source_name: "DISCLOSURE",
            source_url: "data:text/html,<script>alert(1)</script>",
            as_of_date: "2026-06-23",
          },
        ],
      }),
    );

    render(<ChatExplanationPanel ticker="005930" />);

    fireEvent.click(screen.getByRole("button", { name: "왜 추천됐나요?" }));

    expect(await screen.findByText("ev_javascript_url")).not.toBeNull();
    expect(screen.getByText("ev_data_url")).not.toBeNull();
    expect(screen.queryByRole("link", { name: "원문" })).toBeNull();
  });

  it("uses authenticated chat and keeps the returned session for the next request", async () => {
    mockedReadApiAuthToken.mockReturnValue("id-token");

    render(<ChatExplanationPanel ticker="005930" />);

    fireEvent.click(screen.getByRole("button", { name: "왜 추천됐나요?" }));
    await waitFor(() => {
      expect(mockedPostAuthenticatedChat).toHaveBeenCalledWith("id-token", {
        ticker: "005930",
        message: "왜 추천됐나요?",
        title: "005930 추천 이유 설명",
      });
    });

    fireEvent.change(screen.getByLabelText(/질문/), {
      target: { value: "근거를 더 자세히 설명해줘" },
    });
    fireEvent.click(screen.getByRole("button", { name: "왜 추천됐나요?" }));

    await waitFor(() => {
      expect(mockedPostAuthenticatedChat).toHaveBeenLastCalledWith("id-token", {
        ticker: "005930",
        message: "근거를 더 자세히 설명해줘",
        session_id: "chat-session-1",
        title: "005930 추천 이유 설명",
      });
    });
    expect(mockedPostChat).not.toHaveBeenCalled();
  });

  it("shows a retryable message when the chat API fails", async () => {
    mockedPostChat.mockRejectedValue(new Error("API unavailable"));

    render(<ChatExplanationPanel ticker="005930" />);

    fireEvent.click(screen.getByRole("button", { name: "왜 추천됐나요?" }));

    expect(await screen.findByText("설명을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.")).not.toBeNull();
  });
});

function chatResponse(overrides: Partial<ChatResponse> = {}): ChatResponse {
  return {
    session_id: "chat-session-1",
    message_id: null,
    answer: "공개 데이터 기준 설명입니다.",
    citations: [
      {
        evidence_id: "ev_005930_news",
        type: "news",
        title: "삼성전자 뉴스",
        source_name: "NEWS",
        source_url: "https://example.com/news",
        as_of_date: "2026-06-23",
      },
    ],
    policy_status: "allowed",
    disclaimer: "이 정보는 투자 조언이 아니며 원문 확인이 필요합니다.",
    used_evidence_ids: ["ev_005930_news"],
    ...overrides,
  };
}
