"use client";

import { useEffect, useState } from "react";

import { getMe, getUserChatSessions, getUserPreferences, patchMe, putUserPreferences } from "@/lib/api";
import {
  clearAuthSession,
  isCognitoConfigured,
  readApiAuthToken,
  startCognitoAuth,
  subscribeAuthSession,
} from "@/lib/cognito-auth";
import type { MeResponse, UserChatSession } from "@/types/api";

export function AccountClient() {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [me, setMe] = useState<MeResponse | null>(null);
  const [nickname, setNickname] = useState("");
  const [riskProfile, setRiskProfile] = useState("balanced");
  const [chatSessions, setChatSessions] = useState<UserChatSession[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const configured = isCognitoConfigured();

  useEffect(() => {
    const sync = () => setAccessToken(readApiAuthToken());
    sync();
    return subscribeAuthSession(sync);
  }, []);

  useEffect(() => {
    if (!accessToken) {
      return;
    }

    const token = accessToken;
    let cancelled = false;
    async function load() {
      setError(null);
      try {
        const [profile, preferences, sessions] = await Promise.all([
          getMe(token),
          getUserPreferences(token),
          getUserChatSessions(token),
        ]);
        if (cancelled) return;
        setMe(profile);
        setNickname(profile.nickname ?? "");
        setRiskProfile(
          typeof preferences.preferences.risk_profile === "string"
            ? preferences.preferences.risk_profile
            : "balanced",
        );
        setChatSessions(sessions.items);
      } catch {
        if (!cancelled) setError("로그인 상태를 확인하지 못했습니다. 다시 로그인해 주세요.");
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [accessToken]);

  async function saveProfile() {
    if (!accessToken) return;
    setError(null);
    setMessage(null);
    try {
      const updated = await patchMe(accessToken, { nickname: nickname.trim() || null });
      await putUserPreferences(accessToken, { risk_profile: riskProfile });
      setMe(updated);
      setMessage("계정 설정을 저장했습니다.");
    } catch {
      setError("계정 설정 저장에 실패했습니다.");
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-5 py-8">
      <section className="border-y border-line bg-white px-4 py-6 sm:px-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-ink">계정</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
              게스트 기능은 그대로 사용할 수 있고, 로그인하면 관심종목, 선호 설정, 대화 이력을 서버에 저장합니다.
            </p>
          </div>
          {accessToken ? (
            <button
              type="button"
              onClick={clearAuthSession}
              className="self-start rounded-md border border-line bg-white px-4 py-2 text-sm font-semibold text-muted transition hover:bg-field hover:text-ink focus:outline-none focus:shadow-focus"
            >
              로그아웃
            </button>
          ) : null}
        </div>

        {!configured ? (
          <div className="mt-6 rounded-md border border-line bg-field px-4 py-4 text-sm leading-6 text-muted">
            Cognito Hosted UI 환경변수가 아직 설정되지 않았습니다. 로컬에서는 게스트 관심종목을 계속 사용할 수 있습니다.
          </div>
        ) : null}

        {!accessToken ? (
          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              disabled={!configured}
              onClick={() => void startCognitoAuth("login")}
              className="rounded-md bg-ink px-4 py-2 text-sm font-semibold text-white transition hover:bg-accent focus:outline-none focus:shadow-focus disabled:cursor-not-allowed disabled:opacity-60"
            >
              이메일 로그인
            </button>
            <button
              type="button"
              disabled={!configured}
              onClick={() => void startCognitoAuth("signup")}
              className="rounded-md border border-line bg-white px-4 py-2 text-sm font-semibold text-ink transition hover:border-accent hover:text-accent focus:outline-none focus:shadow-focus disabled:cursor-not-allowed disabled:opacity-60"
            >
              이메일 회원가입
            </button>
          </div>
        ) : (
          <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1fr]">
            <div className="space-y-4">
              <div>
                <div className="text-xs font-medium text-muted">email</div>
                <div className="mt-1 text-sm font-semibold text-ink">{me?.email ?? "표시할 email 없음"}</div>
                <div className="mt-1 text-xs text-muted">
                  {me?.email_verified ? "이메일 인증 완료" : "이메일 인증이 필요합니다"}
                </div>
              </div>

              <label className="block">
                <span className="text-xs font-medium text-muted">닉네임</span>
                <input
                  value={nickname}
                  onChange={(event) => setNickname(event.target.value)}
                  className="mt-1 w-full rounded-md border border-line bg-field px-3 py-2 text-sm text-ink outline-none transition focus:bg-white focus:shadow-focus"
                  maxLength={80}
                />
              </label>

              <label className="block">
                <span className="text-xs font-medium text-muted">선호 리스크</span>
                <select
                  value={riskProfile}
                  onChange={(event) => setRiskProfile(event.target.value)}
                  className="mt-1 w-full rounded-md border border-line bg-field px-3 py-2 text-sm text-ink outline-none transition focus:bg-white focus:shadow-focus"
                >
                  <option value="conservative">conservative</option>
                  <option value="balanced">balanced</option>
                  <option value="aggressive">aggressive</option>
                </select>
              </label>

              <button
                type="button"
                onClick={() => void saveProfile()}
                className="rounded-md bg-ink px-4 py-2 text-sm font-semibold text-white transition hover:bg-accent focus:outline-none focus:shadow-focus"
              >
                저장
              </button>
            </div>

            <div>
              <h2 className="text-sm font-semibold text-ink">최근 대화 이력</h2>
              {chatSessions.length === 0 ? (
                <p className="mt-3 text-sm text-muted">저장된 대화 세션이 없습니다.</p>
              ) : (
                <ul className="mt-3 divide-y divide-line border-y border-line">
                  {chatSessions.slice(0, 5).map((session) => (
                    <li key={session.session_id} className="py-3 text-sm">
                      <div className="font-semibold text-ink">{session.title ?? session.session_id}</div>
                      <div className="mt-1 text-xs text-muted">{session.ticker ?? "종목 미지정"}</div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}

        {message ? <p className="mt-4 text-sm font-medium text-accent">{message}</p> : null}
        {error ? <p className="mt-4 text-sm font-medium text-caution">{error}</p> : null}
      </section>
    </div>
  );
}
