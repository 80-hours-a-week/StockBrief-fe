"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { completeCognitoCallback } from "@/lib/cognito-auth";

export function AuthCallbackClient({
  code,
  state,
}: {
  code: string | null;
  state: string | null;
}) {
  const [status, setStatus] = useState<"loading" | "done" | "error">(
    code && state ? "loading" : "error",
  );

  useEffect(() => {
    if (!code || !state) {
      return;
    }

    const authCode = code;
    const authState = state;
    let cancelled = false;
    async function complete() {
      try {
        await completeCognitoCallback(authCode, authState);
        if (!cancelled) setStatus("done");
      } catch {
        if (!cancelled) setStatus("error");
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
              로그인이 완료되었습니다. 관심종목 화면에서 로컬 관심종목을 서버와 병합합니다.
            </p>
            <Link
              href="/watchlist"
              className="mt-5 inline-flex rounded-md bg-ink px-4 py-2 text-sm font-semibold text-white transition hover:bg-accent focus:outline-none focus:shadow-focus"
            >
              관심종목으로 이동
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
