import { cleanup, render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { getMe } from "@/lib/api";
import { completeCognitoCallback, readApiAuthToken } from "@/lib/cognito-auth";
import { importLocalWatchlistOnce } from "@/lib/server-watchlist-store";
import type { MeResponse } from "@/types/api";

import { AuthCallbackClient } from "./AuthCallbackClient";

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    className,
  }: {
    href: string;
    children: ReactNode;
    className?: string;
  }) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
}));

vi.mock("@/lib/api", () => ({
  getMe: vi.fn(),
}));

vi.mock("@/lib/cognito-auth", () => ({
  completeCognitoCallback: vi.fn(),
  readApiAuthToken: vi.fn(),
}));

vi.mock("@/lib/server-watchlist-store", () => ({
  importLocalWatchlistOnce: vi.fn(),
}));

const mockedCompleteCognitoCallback = vi.mocked(completeCognitoCallback);
const mockedReadApiAuthToken = vi.mocked(readApiAuthToken);
const mockedGetMe = vi.mocked(getMe);
const mockedImportLocalWatchlistOnce = vi.mocked(importLocalWatchlistOnce);

describe("AuthCallbackClient", () => {
  beforeEach(() => {
    mockedCompleteCognitoCallback.mockResolvedValue(undefined);
    mockedReadApiAuthToken.mockReturnValue("id-token");
    mockedGetMe.mockResolvedValue(me());
    mockedImportLocalWatchlistOnce.mockResolvedValue({
      importedCount: 2,
      skippedExistingCount: 0,
      items: [],
      alreadySynced: false,
    });
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("completes Cognito callback and imports the local watchlist", async () => {
    render(<AuthCallbackClient code="auth-code" state="auth-state" />);

    await waitFor(() => {
      expect(mockedCompleteCognitoCallback).toHaveBeenCalledWith("auth-code", "auth-state");
    });

    expect(mockedGetMe).toHaveBeenCalledWith("id-token");
    expect(mockedImportLocalWatchlistOnce).toHaveBeenCalledWith("id-token", me());
    expect(await screen.findByText(/로컬 관심종목 2개를 서버와 병합했습니다/)).not.toBeNull();
    expect(screen.getByRole("link", { name: "관심종목으로 이동" }).getAttribute("href")).toBe(
      "/watchlist",
    );
  });

  it("keeps the user signed in when only watchlist sync fails", async () => {
    mockedImportLocalWatchlistOnce.mockRejectedValue(new Error("sync failed"));

    render(<AuthCallbackClient code="auth-code" state="auth-state" />);

    expect(
      await screen.findByText(/로그인은 완료되었지만 로컬 관심종목을 서버와 병합하지 못했습니다/),
    ).not.toBeNull();
    expect(screen.getByRole("link", { name: "계정으로 이동" }).getAttribute("href")).toBe(
      "/account",
    );
  });
});

function me(): MeResponse {
  return {
    id: "user-1",
    cognito_sub: "cognito-sub-1",
    email: "user@example.com",
    email_verified: true,
    nickname: null,
  };
}
