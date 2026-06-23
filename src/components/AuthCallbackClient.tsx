"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { getMe } from "@/lib/api";
import { completeCognitoCallback, readApiAuthToken } from "@/lib/cognito-auth";
import { importLocalWatchlistOnce } from "@/lib/server-watchlist-store";

type CallbackStatus = "loading" | "done" | "sync-error" | "error";

interface SyncSummary {
  importedCount: number;
  skippedExistingCount: number;
  alreadySynced: boolean;
}

export function AuthCallbackClient({
  code,
  state,
}: {
  code: string | null;
  state: string | null;
}) {
  const [status, setStatus] = useState<CallbackStatus>(code && state ? "loading" : "error");
  const [syncSummary, setSyncSummary] = useState<SyncSummary | null>(null);

  useEffect(() => {
    if (!code || !state) {
      return;
    }

    const authCode = code;
    const authState = state;
    let cancelled = false;
    async function complete() {
      let callbackCompleted = false;

      try {
        await completeCognitoCallback(authCode, authState);
        callbackCompleted = true;
        const token = readApiAuthToken();
        if (!token) {
          throw new Error("Missing Cognito API token after callback.");
        }
        const me = await getMe(token);
        const result = await importLocalWatchlistOnce(token, me);
        if (!cancelled) {
          setSyncSummary({
            importedCount: result.importedCount,
            skippedExistingCount: result.skippedExistingCount,
            alreadySynced: result.alreadySynced,
          });
          setStatus("done");
        }
      } catch {
        if (!cancelled) setStatus(callbackCompleted ? "sync-error" : "error");
      }
    }

    void complete();
    return () => {
      cancelled = true;
    };
  }, [code, state]);

  return (
    <div className="mx-auto max-w-xl px-5 py-12">
      <section className="border-y border-line bg-white px-4 py-8">
        <h1 className="text-xl font-semibold text-ink">로그인 처리</h1>
        {status === "loading" ? (
          <p className="mt-3 text-sm leading-6 text-muted">Cognito 인증 결과를 확인하는 중입니다.</p>
        ) : null}
        {status === "done" ? (
          <>
            <p className="mt-3 text-sm leading-6 text-muted">
              로그인이 완료되었습니다. {syncMessage(syncSummary)}
            </p>
            <Link
              href="/watchlist"
              className="mt-5 inline-flex rounded-md bg-ink px-4 py-2 text-sm font-semibold text-white transition hover:bg-accent focus:outline-none focus:shadow-focus"
            >
              관심종목으로 이동
            </Link>
          </>
        ) : null}
        {status === "sync-error" ? (
          <>
            <p className="mt-3 text-sm leading-6 text-muted">
              로그인은 완료되었지만 로컬 관심종목을 서버와 병합하지 못했습니다. 계정 화면에서 로그인 상태를 확인한 뒤
              관심종목 화면에서 다시 동기화할 수 있습니다.
            </p>
            <Link
              href="/account"
              className="mt-5 inline-flex rounded-md border border-line bg-white px-4 py-2 text-sm font-semibold text-ink transition hover:border-accent hover:text-accent focus:outline-none focus:shadow-focus"
            >
              계정으로 이동
            </Link>
          </>
        ) : null}
        {status === "error" ? (
          <>
            <p className="mt-3 text-sm leading-6 text-muted">
              로그인 결과를 처리하지 못했습니다. 계정 화면에서 다시 시도해 주세요.
            </p>
            <Link
              href="/account"
              className="mt-5 inline-flex rounded-md border border-line bg-white px-4 py-2 text-sm font-semibold text-ink transition hover:border-accent hover:text-accent focus:outline-none focus:shadow-focus"
            >
              계정으로 이동
            </Link>
          </>
        ) : null}
      </section>
    </div>
  );
}

function syncMessage(summary: SyncSummary | null): string {
  if (!summary) return "관심종목 동기화 상태를 확인했습니다.";
  if (summary.alreadySynced) return "이미 이 계정으로 관심종목 동기화를 완료했습니다.";
  if (summary.importedCount > 0) {
    return `로컬 관심종목 ${summary.importedCount}개를 서버와 병합했습니다.`;
  }
  if (summary.skippedExistingCount > 0) {
    return "로컬 관심종목은 이미 서버에 저장되어 있습니다.";
  }
  return "서버 관심종목과 동기화되었습니다.";
}
