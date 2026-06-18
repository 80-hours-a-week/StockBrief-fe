"use client";

import { useEffect, useState } from "react";

import { postAuthenticatedChat, postChat } from "@/lib/api";
import { readApiAuthToken, subscribeAuthSession } from "@/lib/cognito-auth";
import { evidenceTypeLabel, formatDate } from "@/lib/format";
import type { ChatResponse } from "@/types/api";

const DEFAULT_MESSAGE = "왜 추천됐나요?";
const MESSAGE_MAX_LENGTH = 1000;

export function ChatExplanationPanel({ ticker }: { ticker: string }) {
  const [message, setMessage] = useState(DEFAULT_MESSAGE);
  const [response, setResponse] = useState<ChatResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);

  useEffect(() => {
    const sync = () => setAccessToken(readApiAuthToken());
    sync();
    return subscribeAuthSession(sync);
  }, []);

  async function requestExplanation() {
    setLoading(true);
    setError(null);
    try {
      const body = {
        ticker,
        message,
        ...(sessionId ? { session_id: sessionId } : {}),
        title: `${ticker} 추천 이유 설명`,
      };
      const next = accessToken
        ? await postAuthenticatedChat(accessToken, body)
        : await postChat(body);
      setResponse(next);
      if (next.session_id) {
        setSessionId(next.session_id);
      }
    } catch {
      setError("설명을 불러오지 못했습니다. API 서버 상태를 확인해 주세요.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="mt-6 border-y border-line bg-white px-4 py-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-base font-semibold text-ink">추천 이유 설명</h3>
          <p className="mt-1 text-sm leading-6 text-muted">
            저장된 점수, 추천 이유, 근거, 리스크를 기반으로 설명합니다.
          </p>
        </div>
        <button
          type="button"
          onClick={requestExplanation}
          disabled={loading}
          className="shrink-0 rounded-md bg-ink px-4 py-2 text-sm font-semibold text-white transition hover:bg-accent focus:outline-none focus:shadow-focus disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "설명 생성 중" : DEFAULT_MESSAGE}
        </button>
      </div>

      <label className="mt-4 block">
        <span className="flex items-center justify-between gap-3 text-xs font-medium text-muted">
          <span>질문</span>
          <span>{message.length}/{MESSAGE_MAX_LENGTH}</span>
        </span>
        <textarea
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          maxLength={MESSAGE_MAX_LENGTH}
          rows={2}
          className="mt-1 w-full resize-none rounded-md border border-line bg-field px-3 py-2 text-sm text-ink outline-none transition focus:bg-white focus:shadow-focus"
        />
      </label>

      {error ? <p className="mt-4 text-sm text-caution">{error}</p> : null}

      {response ? (
        <div className="mt-5 space-y-4">
          <div className="text-xs font-medium text-muted">policy: {response.policy_status}</div>
          {/* React escapes rendered text here; keep agent answers as text, not HTML. */}
          <p className="whitespace-pre-line text-sm leading-6 text-ink">{response.answer}</p>
          {response.session_id ? (
            <p className="text-xs text-muted">session: {response.session_id}</p>
          ) : null}

          <div>
            <h4 className="text-sm font-semibold text-ink">citations</h4>
            {response.citations.length === 0 ? (
              <p className="mt-2 text-sm text-muted">표시할 citation이 없습니다.</p>
            ) : (
              <ul className="mt-2 space-y-2">
                {response.citations.map((citation) => (
                  <li key={citation.evidence_id} className="text-xs leading-5 text-muted">
                    <span className="font-semibold text-accent">
                      {citation.evidence_id}
                    </span>{" "}
                    {evidenceTypeLabel(citation.type)} / {citation.source_name} /{" "}
                    {formatDate(citation.as_of_date)}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      ) : null}
    </section>
  );
}
