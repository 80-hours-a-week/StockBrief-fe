import { describe, expect, it } from "vitest";

import { formatWatchlistSyncMessage } from "./watchlist-sync-message";

describe("formatWatchlistSyncMessage", () => {
  it("reports an imported-only sync", () => {
    expect(
      formatWatchlistSyncMessage({
        importedCount: 2,
        skippedExistingCount: 0,
        alreadySynced: false,
      }),
    ).toBe("로컬 관심종목 2개를 서버에 병합했습니다.");
  });

  it("reports a skipped-only sync", () => {
    expect(
      formatWatchlistSyncMessage({
        importedCount: 0,
        skippedExistingCount: 3,
        alreadySynced: false,
      }),
    ).toBe("로컬 관심종목은 이미 서버에 저장되어 있습니다.");
  });

  it("reports imported and skipped counts together", () => {
    expect(
      formatWatchlistSyncMessage({
        importedCount: 1,
        skippedExistingCount: 2,
        alreadySynced: false,
      }),
    ).toBe("로컬 관심종목 1개를 서버에 병합했고 2개는 이미 저장되어 있습니다.");
  });

  it("reports an already-synced account without implying a new import", () => {
    expect(
      formatWatchlistSyncMessage({
        importedCount: 0,
        skippedExistingCount: 0,
        alreadySynced: true,
      }),
    ).toBe("이미 이 계정으로 관심종목 동기화를 완료했습니다.");
  });

  it("reports the neutral fallback while sync details are not loaded", () => {
    expect(formatWatchlistSyncMessage(null)).toBe("관심종목 동기화 상태를 확인했습니다.");
  });
});
