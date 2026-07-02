import { describe, expect, it } from "vitest";

import {
  inspectHomePage,
  inspectStockDetailPage,
  inspectWatchlistPage,
  normalizeBaseUrl,
  parseArgs,
  runSmoke,
} from "./check-hosted-evidence-smoke.mjs";

const homeHtml = `
  <main>
    <h1>StockBrief</h1>
    <p>오늘의 추천 후보</p>
    <a>추천 후보 보기</a>
  </main>
`;

const detailHtml = `
  <main>
    <h1>삼성전자</h1>
    <div>추천 후보 점수</div>
    <section>
      <h2>공시·뉴스·재무·가격 근거</h2>
      <span>근거 ID: ev_1</span>
      <span>발행일: 2026.06.26</span>
      <a href="https://provider.example/news/private-body">원문 보기</a>
      <p>provider raw title should not be printed</p>
    </section>
  </main>
`;

const watchlistHtml = `
  <main>
    <p>관심종목</p>
    <h1>저장한 검토 후보</h1>
    <p>게스트는 이 브라우저에 저장하고, 로그인 후에는 서버 관심종목과 동기화합니다.</p>
    <section>
      <h2>저장된 관심종목이 없습니다.</h2>
      <a href="/recommendations">추천 후보 보기</a>
    </section>
    <p>private localStorage payload should not be printed</p>
  </main>
`;

describe("check-hosted-evidence-smoke", () => {
  it("parses CLI args and normalizes hosted URLs", () => {
    expect(
      parseArgs([
        "--",
        "--hosted-url",
        "https://main.example.amplifyapp.com/",
        "--ticker",
        "005930",
        "--timeout-ms",
        "5000",
      ]),
    ).toMatchObject({
      hostedUrl: "https://main.example.amplifyapp.com/",
      ticker: "005930",
      timeoutMs: 5000,
    });
    expect(normalizeBaseUrl("https://main.example.amplifyapp.com/")).toBe(
      "https://main.example.amplifyapp.com",
    );
  });

  it("checks hosted home, stock detail evidence, and guest watchlist without printing raw HTML", async () => {
    const calls = [];
    const result = await runSmoke({
      hostedUrl: "https://main.example.amplifyapp.com",
      ticker: "005930",
      fetcher: async (url) => {
        calls.push(url);
        if (url.endsWith("/watchlist")) {
          return {
            statusCode: 200,
            body: watchlistHtml,
            errorCode: null,
          };
        }
        return {
          statusCode: 200,
          body: url.endsWith("/stocks/005930") ? detailHtml : homeHtml,
          errorCode: null,
        };
      },
    });

    const serialized = JSON.stringify(result);
    expect(result.ok).toBe(true);
    expect(calls).toEqual([
      "https://main.example.amplifyapp.com/",
      "https://main.example.amplifyapp.com/stocks/005930",
      "https://main.example.amplifyapp.com/watchlist",
    ]);
    expect(result.checks["hosted_page:/stocks/{ticker}"].summary).toMatchObject({
      hasEvidenceSection: true,
      hasEvidenceId: true,
      hasPublishedDate: true,
      hasSourceReference: true,
      missing: [],
    });
    expect(result.checks["hosted_page:/watchlist"].summary).toMatchObject({
      hasWatchlistHeading: true,
      hasGuestStorageCopy: true,
      missing: [],
    });
    expect(serialized).not.toContain("provider raw title");
    expect(serialized).not.toContain("provider.example");
    expect(serialized).not.toContain("private localStorage payload");
  });

  it("reports missing evidence fields as blockers", async () => {
    const result = await runSmoke({
      hostedUrl: "https://main.example.amplifyapp.com",
      ticker: "005930",
      fetcher: async (url) => {
        if (url.endsWith("/watchlist")) {
          return {
            statusCode: 200,
            body: watchlistHtml,
            errorCode: null,
          };
        }
        return {
          statusCode: 200,
          body: url.endsWith("/stocks/005930")
            ? "<main><div>추천 후보 점수</div><h2>공시·뉴스·재무·가격 근거</h2></main>"
            : homeHtml,
          errorCode: null,
        };
      },
    });

    expect(result.ok).toBe(false);
    expect(result.blockers).toEqual([
      {
        check: "hosted_page:/stocks/{ticker}",
        status_code: 200,
        missing: ["hasEvidenceId", "hasPublishedDate", "hasSourceReference"],
        error_code: "check_failed",
      },
    ]);
  });

  it("keeps page inspection rules small and explicit", () => {
    expect(inspectHomePage(homeHtml).passed).toBe(true);
    expect(inspectStockDetailPage(detailHtml).passed).toBe(true);
    expect(inspectWatchlistPage(watchlistHtml).passed).toBe(true);
    expect(inspectStockDetailPage("<main>공시·뉴스·재무·가격 근거</main>").summary.missing).toContain(
      "hasEvidenceId",
    );
    expect(inspectWatchlistPage("<main>저장한 검토 후보</main>").summary.missing).toEqual([
      "hasGuestStorageCopy",
    ]);
  });
});
