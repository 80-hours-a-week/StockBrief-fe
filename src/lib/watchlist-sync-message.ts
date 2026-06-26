export interface WatchlistSyncMessageInput {
  importedCount: number;
  skippedExistingCount: number;
  alreadySynced: boolean;
}

export function formatWatchlistSyncMessage(summary: WatchlistSyncMessageInput | null): string {
  if (!summary) {
    return "관심종목 동기화 상태를 확인했습니다.";
  }
  if (summary.alreadySynced) {
    return "이미 이 계정으로 관심종목 동기화를 완료했습니다.";
  }
  if (summary.importedCount > 0 && summary.skippedExistingCount > 0) {
    return `로컬 관심종목 ${summary.importedCount}개를 서버에 병합했고 ${summary.skippedExistingCount}개는 이미 저장되어 있습니다.`;
  }
  if (summary.importedCount > 0) {
    return `로컬 관심종목 ${summary.importedCount}개를 서버에 병합했습니다.`;
  }
  if (summary.skippedExistingCount > 0) {
    return "로컬 관심종목은 이미 서버에 저장되어 있습니다.";
  }
  return "서버 관심종목과 동기화되었습니다.";
}
