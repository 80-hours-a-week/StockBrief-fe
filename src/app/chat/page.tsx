"use client";

import { useState } from "react";

import { ChatExplanationPanel } from "@/components/ChatExplanationPanel";

const DEFAULT_TICKER = "005930";

export default function ChatPage() {
  const [tickerInput, setTickerInput] = useState(DEFAULT_TICKER);
  const normalizedTicker = tickerInput.replace(/\D/g, "").slice(0, 6);
  const canAsk = normalizedTicker.length === 6;

  return (
    <div className="mx-auto max-w-5xl px-5 py-8">
      <section className="border-b border-line pb-6">
        <p className="text-sm font-semibold text-accent">Mock Agent</p>
        <h1 className="mt-2 text-3xl font-semibold text-ink">근거 기반 설명 챗</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
          종목 코드를 입력하면 저장된 점수, 추천 이유, 근거 데이터를 바탕으로 설명을 확인합니다.
        </p>
      </section>

      <section className="py-6">
        <label className="block max-w-sm">
          <span className="text-xs font-medium text-muted">종목 코드</span>
          <input
            value={tickerInput}
            onChange={(event) => setTickerInput(event.target.value)}
            inputMode="numeric"
            maxLength={6}
            className="mt-1 w-full rounded-md border border-line bg-field px-3 py-2 text-sm font-semibold text-ink outline-none transition focus:bg-white focus:shadow-focus"
          />
        </label>
        {canAsk ? (
          <ChatExplanationPanel ticker={normalizedTicker} />
        ) : (
          <div className="mt-6 border-y border-line py-6 text-sm text-muted">
            6자리 종목 코드를 입력하면 설명 패널이 열립니다.
          </div>
        )}
      </section>
    </div>
  );
}
