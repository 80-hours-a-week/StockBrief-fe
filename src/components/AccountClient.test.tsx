import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  getMe,
  getUserChatSessionDetail,
  getUserChatSessions,
  getUserPreferences,
  patchMe,
  putUserPreferences,
} from "@/lib/api";
import {
  clearAuthSession,
  isCognitoConfigured,
  readApiAuthToken,
  startCognitoAuth,
  subscribeAuthSession,
} from "@/lib/cognito-auth";
import type {
  MeResponse,
  UserChatSessionDetailResponse,
  UserChatSessionListResponse,
  UserPreferencesResponse,
} from "@/types/api";

import { AccountClient } from "./AccountClient";

vi.mock("@/lib/api", () => ({
  getMe: vi.fn(),
  getUserChatSessionDetail: vi.fn(),
  getUserChatSessions: vi.fn(),
  getUserPreferences: vi.fn(),
  patchMe: vi.fn(),
  putUserPreferences: vi.fn(),
}));

vi.mock("@/lib/cognito-auth", () => ({
  clearAuthSession: vi.fn(),
  isCognitoConfigured: vi.fn(),
  readApiAuthToken: vi.fn(),
  startCognitoAuth: vi.fn(),
  subscribeAuthSession: vi.fn(),
}));

const mockedGetMe = vi.mocked(getMe);
const mockedGetUserPreferences = vi.mocked(getUserPreferences);
const mockedGetUserChatSessions = vi.mocked(getUserChatSessions);
const mockedGetUserChatSessionDetail = vi.mocked(getUserChatSessionDetail);
const mockedPatchMe = vi.mocked(patchMe);
const mockedPutUserPreferences = vi.mocked(putUserPreferences);
const mockedClearAuthSession = vi.mocked(clearAuthSession);
const mockedIsCognitoConfigured = vi.mocked(isCognitoConfigured);
const mockedReadApiAuthToken = vi.mocked(readApiAuthToken);
const mockedStartCognitoAuth = vi.mocked(startCognitoAuth);
const mockedSubscribeAuthSession = vi.mocked(subscribeAuthSession);

describe("AccountClient", () => {
  beforeEach(() => {
    mockedIsCognitoConfigured.mockReturnValue(true);
    mockedReadApiAuthToken.mockReturnValue("id-token");
    mockedSubscribeAuthSession.mockReturnValue(() => undefined);
    mockedStartCognitoAuth.mockResolvedValue(undefined);
    mockedGetMe.mockResolvedValue(me());
    mockedGetUserPreferences.mockResolvedValue(preferences("balanced"));
    mockedGetUserChatSessions.mockResolvedValue(chatSessions());
    mockedGetUserChatSessionDetail.mockResolvedValue(chatSessionDetail());
    mockedPatchMe.mockResolvedValue(me({ nickname: "새별" }));
    mockedPutUserPreferences.mockResolvedValue(preferences("aggressive"));
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("keeps account fields hidden while authenticated account data is loading", async () => {
    const profileRequest = deferred<MeResponse>();
    mockedGetMe.mockReturnValue(profileRequest.promise);

    render(<AccountClient />);

    expect(screen.getByRole("status").textContent).toBe("계정 정보를 확인하는 중입니다.");
    expect(screen.queryByText("표시할 email 없음")).toBeNull();
    expect(screen.queryByText("계정 정보를 표시할 수 없습니다. 다시 로그인해 주세요.")).toBeNull();

    profileRequest.resolve(me());

    expect(await screen.findByText("user@example.com")).not.toBeNull();
  });

  it("loads profile, preferences, and recent chat sessions for an authenticated user", async () => {
    mockedGetUserPreferences.mockResolvedValue(preferences("conservative"));

    render(<AccountClient />);

    expect(await screen.findByText("user@example.com")).not.toBeNull();
    expect((screen.getByLabelText("닉네임") as HTMLInputElement).value).toBe("기존닉네임");
    expect((screen.getByLabelText("선호 리스크") as HTMLSelectElement).value).toBe("conservative");
    expect(screen.getByText("삼성전자 설명")).not.toBeNull();
    expect(mockedGetMe).toHaveBeenCalledWith("id-token");
    expect(mockedGetUserPreferences).toHaveBeenCalledWith("id-token");
    expect(mockedGetUserChatSessions).toHaveBeenCalledWith("id-token");
  });

  it("loads a selected recent chat session detail", async () => {
    render(<AccountClient />);

    fireEvent.click(await screen.findByRole("button", { name: /삼성전자 설명/ }));

    expect(mockedGetUserChatSessionDetail).toHaveBeenCalledWith("id-token", "chat-1");
    expect(await screen.findByText("왜 검토 후보로 나왔나요?")).not.toBeNull();
    expect(screen.getByText("공개 데이터 기준 설명입니다.")).not.toBeNull();
    expect(screen.getByText("근거 1개")).not.toBeNull();
  });

  it("keeps recent chat sessions visible when a selected session detail fails", async () => {
    mockedGetUserChatSessionDetail.mockRejectedValue(new Error("detail failed"));

    render(<AccountClient />);

    fireEvent.click(await screen.findByRole("button", { name: /삼성전자 설명/ }));

    expect(await screen.findByText("대화 내용을 불러오지 못했습니다.")).not.toBeNull();
    expect(screen.getByRole("button", { name: /삼성전자 설명/ })).not.toBeNull();
  });

  it("keeps the account form available when only recent chat sessions fail", async () => {
    mockedGetUserChatSessions.mockRejectedValue(new Error("sessions failed"));

    render(<AccountClient />);

    expect(await screen.findByText("user@example.com")).not.toBeNull();
    expect((screen.getByLabelText("닉네임") as HTMLInputElement).value).toBe("기존닉네임");
    expect(await screen.findByText("최근 대화 이력을 불러오지 못했습니다.")).not.toBeNull();
    expect(screen.queryByText("로그인 상태를 확인하지 못했습니다. 다시 로그인해 주세요.")).toBeNull();
  });

  it("saves a trimmed nickname and risk profile without duplicate submissions", async () => {
    const saveRequest = deferred<MeResponse>();
    mockedPatchMe.mockReturnValue(saveRequest.promise);

    render(<AccountClient />);

    const nicknameInput = await screen.findByLabelText("닉네임");
    fireEvent.change(nicknameInput, { target: { value: "  새별  " } });
    fireEvent.change(screen.getByLabelText("선호 리스크"), {
      target: { value: "aggressive" },
    });

    const saveButton = screen.getByRole("button", { name: "저장" });
    fireEvent.click(saveButton);
    fireEvent.click(saveButton);

    expect(mockedPatchMe).toHaveBeenCalledTimes(1);
    expect(mockedPatchMe).toHaveBeenCalledWith("id-token", { nickname: "새별" });
    expect(saveButton.textContent).toBe("저장 중");
    expect((saveButton as HTMLButtonElement).disabled).toBe(true);

    saveRequest.resolve(me({ nickname: "새별" }));

    await waitFor(() => {
      expect(mockedPutUserPreferences).toHaveBeenCalledWith("id-token", {
        risk_profile: "aggressive",
      });
    });
    expect(await screen.findByText("계정 설정을 저장했습니다.")).not.toBeNull();
  });

  it("shows a partial failure when preferences fail after nickname save succeeds", async () => {
    mockedPatchMe.mockResolvedValue(me({ nickname: "새별" }));
    mockedPutUserPreferences.mockRejectedValue(new Error("preferences failed"));

    render(<AccountClient />);

    const nicknameInput = await screen.findByLabelText("닉네임");
    fireEvent.change(nicknameInput, { target: { value: "새별" } });
    fireEvent.change(screen.getByLabelText("선호 리스크"), {
      target: { value: "aggressive" },
    });
    fireEvent.click(screen.getByRole("button", { name: "저장" }));

    expect(await screen.findByText("닉네임은 저장됐지만 선호 리스크 저장에 실패했습니다.")).not.toBeNull();
    expect(mockedPatchMe).toHaveBeenCalledWith("id-token", { nickname: "새별" });
    expect(mockedPutUserPreferences).toHaveBeenCalledWith("id-token", {
      risk_profile: "aggressive",
    });
    expect(screen.queryByText("계정 설정 저장에 실패했습니다.")).toBeNull();
  });

  it("shows a retry-oriented message when account loading fails", async () => {
    mockedGetMe.mockRejectedValue(new Error("profile failed"));

    render(<AccountClient />);

    expect(await screen.findByText("로그인 상태를 확인하지 못했습니다. 다시 로그인해 주세요.")).not.toBeNull();
    expect(screen.getByText("계정 정보를 표시할 수 없습니다. 다시 로그인해 주세요.")).not.toBeNull();
    expect(screen.queryByText("표시할 email 없음")).toBeNull();
  });

  it("shows disabled auth actions when Cognito is not configured", async () => {
    mockedIsCognitoConfigured.mockReturnValue(false);
    mockedReadApiAuthToken.mockReturnValue(null);

    render(<AccountClient />);

    expect(await screen.findByText(/Cognito Hosted UI 환경변수가 아직 설정되지 않았습니다/)).not.toBeNull();
    expect((screen.getByRole("button", { name: "이메일 로그인" }) as HTMLButtonElement).disabled).toBe(true);
    expect((screen.getByRole("button", { name: "이메일 회원가입" }) as HTMLButtonElement).disabled).toBe(true);
    expect(mockedGetMe).not.toHaveBeenCalled();
  });

  it("clears the stored auth session when the user signs out", async () => {
    render(<AccountClient />);

    fireEvent.click(await screen.findByRole("button", { name: "로그아웃" }));

    expect(mockedClearAuthSession).toHaveBeenCalledOnce();
  });
});

function me(overrides: Partial<MeResponse> = {}): MeResponse {
  return {
    id: "user-1",
    cognito_sub: "cognito-sub-1",
    email: "user@example.com",
    email_verified: true,
    nickname: "기존닉네임",
    ...overrides,
  };
}

function preferences(riskProfile: string): UserPreferencesResponse {
  return {
    preferences: {
      risk_profile: riskProfile,
    },
  };
}

function chatSessions(): UserChatSessionListResponse {
  return {
    count: 1,
    items: [
      {
        session_id: "chat-1",
        ticker: "005930",
        title: "삼성전자 설명",
        created_at: "2026-06-24T09:00:00+09:00",
        updated_at: "2026-06-24T09:30:00+09:00",
      },
    ],
  };
}

function chatSessionDetail(): UserChatSessionDetailResponse {
  return {
    session: chatSessions().items[0],
    messages: [
      {
        message_id: "msg-user-1",
        role: "user",
        content: "왜 검토 후보로 나왔나요?",
        ticker: "005930",
        citations: [],
        safety_flags: [],
        created_at: "2026-06-24T09:30:00+09:00",
      },
      {
        message_id: "msg-assistant-1",
        role: "assistant",
        content: "공개 데이터 기준 설명입니다.",
        ticker: "005930",
        citations: [{ evidence_id: "ev-1" }],
        safety_flags: [],
        created_at: "2026-06-24T09:30:01+09:00",
      },
    ],
  };
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((innerResolve, innerReject) => {
    resolve = innerResolve;
    reject = innerReject;
  });
  return { promise, resolve, reject };
}
