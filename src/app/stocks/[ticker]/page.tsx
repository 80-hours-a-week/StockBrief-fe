import { ErrorState } from "@/components/ErrorState";
import { EvidenceBadge } from "@/components/EvidenceBadge";
import { ChatExplanationPanel } from "@/components/ChatExplanationPanel";
import { RiskTag } from "@/components/RiskTag";
import { ScoreBadge } from "@/components/ScoreBadge";
import { WatchlistToggle } from "@/components/WatchlistToggle";
import { componentLabel, evidenceTypeLabel, formatDate, formatScore } from "@/lib/format";
import { ApiError, getRecommendationCandidate, getStock, getStockEvidence } from "@/lib/api";
import type {
  MissingDataItem,
  RecommendationCandidate,
  ScoreComponent,
  StockDetail,
  StockEvidenceItem,
  StockEvidenceResponse,
} from "@/types/api";

export const dynamic = "force-dynamic";

const SCORE_COMPONENT_KEYS = [
  "financial_stability",
  "profitability",
  "growth",
  "valuation",
  "news_attention",
  "disclosure_event",
  "liquidity",
  "momentum_volatility",
] as const;

type StockPageProps = {
  params: Promise<{ ticker: string }>;
};

export default async function StockPage({ params }: StockPageProps) {
  const { ticker } = await params;
  let data: Awaited<ReturnType<typeof loadStockData>>;

  try {
    data = await loadStockData(ticker);
  } catch {
    return (
      <div className="mx-auto max-w-7xl px-5 py-8">
        <ErrorState href="/recommendations" />
      </div>
    );
  }

  const { candidate, stock, evidence } = data;
  const scoreComponents = normalizeScoreComponents(candidate.score_components);
  const riskTags = candidate.risk_tags.length > 0 ? candidate.risk_tags : ["확인 필요"];
  const missingData = formatMissingData(candidate.missing_data);
  const dataAsOf = formatDate(candidate.data_freshness.as_of);
  const evidenceGroups = groupEvidenceByType(evidence.evidence);

  return (
    <div className="mx-auto max-w-7xl px-5 py-8">
      <section className="border-b border-line pb-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-accent">{stock.market} · {stock.sector ?? "분류 없음"}</p>
            <h1 className="mt-2 text-4xl font-semibold text-ink">{stock.name}</h1>
            <p className="mt-2 text-sm text-muted">{stock.ticker} · {stock.industry ?? "업종 정보 없음"}</p>
          </div>
          <div className="text-left sm:text-right">
            <div className="text-xs font-medium text-muted">추천 후보 점수</div>
            <div className="mt-1">
              <ScoreBadge score={candidate.recommendation_score} />
            </div>
            <div className="mt-3">
              <WatchlistToggle
                item={{
                  ticker: stock.ticker,
                  name: stock.name,
                  market: stock.market,
                  ...(stock.sector ? { sector: stock.sector } : {}),
                }}
              />
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-[1fr_1fr_1fr]">
          <div className="border-y border-line py-4">
            <div className="text-xs font-medium text-muted">근거 수준</div>
            <div className="mt-2">
              <EvidenceBadge level={candidate.evidence_level} count={candidate.evidence_count} />
            </div>
          </div>
          <div className="border-y border-line py-4">
            <div className="text-xs font-medium text-muted">데이터 기준일</div>
            <div className="mt-2 text-sm font-semibold text-ink">{dataAsOf}</div>
          </div>
          <div className="border-y border-line py-4">
            <div className="text-xs font-medium text-muted">누락 데이터</div>
            <div className="mt-2 text-sm font-semibold text-ink">{missingData.summary}</div>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          {riskTags.map((tag) => (
            <RiskTag key={tag} tag={tag} />
          ))}
        </div>
      </section>

      <section className="grid gap-8 py-8 lg:grid-cols-[0.9fr_1.1fr]">
        <div>
          <h2 className="text-xl font-semibold text-ink">왜 추천됐나요?</h2>
          <div className="mt-4 space-y-4">
            {candidate.recommendation_reasons.length === 0 ? (
              <div className="border-y border-line py-4 text-sm text-muted">
                추천 이유 데이터가 아직 충분하지 않습니다.
              </div>
            ) : candidate.recommendation_reasons.map((reason) => (
              <article key={reason.reason_id} className="border-l-2 border-accent pl-4">
                <h3 className="text-sm font-semibold text-ink">{componentLabel(reason.component)}</h3>
                <p className="mt-1 text-sm leading-6 text-muted">{reason.summary}</p>
                <p className="mt-2 text-xs text-muted">연결 근거 {reason.evidence_ids.length}개</p>
              </article>
            ))}
          </div>
          <ChatExplanationPanel ticker={stock.ticker} />
        </div>

        <div>
          <h2 className="text-xl font-semibold text-ink">점수 구성</h2>
          <div className="mt-4 divide-y divide-line border-y border-line bg-white">
            {scoreComponents.map((component) => (
              <div key={component.name} className="grid grid-cols-[1fr_auto] gap-4 px-4 py-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="font-medium text-ink">{componentLabel(component.name)}</div>
                    <span className="text-xs text-muted">비중 {component.weight}</span>
                  </div>
                  <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-line">
                    <div
                      className="h-full rounded-full bg-accent"
                      style={{ width: `${componentWidth(component)}%` }}
                    />
                  </div>
                  <div className="mt-2 text-xs leading-5 text-muted">{component.reason}</div>
                </div>
                <div className="text-right text-sm font-semibold text-ink">
                  {formatScore(component.weighted_score)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-8 border-t border-line py-8 lg:grid-cols-[0.9fr_1.1fr]">
        <div>
          <h2 className="text-xl font-semibold text-ink">리스크와 확인할 점</h2>
          <div className="mt-4 space-y-3">
            <div className="flex flex-wrap gap-2">
              {riskTags.map((tag) => (
                <RiskTag key={tag} tag={tag} />
              ))}
            </div>
            <div className="border-y border-line py-4">
              <h3 className="text-sm font-semibold text-ink">누락 데이터</h3>
              {missingData.items.length === 0 ? (
                <p className="mt-2 text-sm text-muted">현재 확인할 누락 데이터가 표시되지 않았습니다.</p>
              ) : (
                <ul className="mt-2 space-y-1 text-sm text-muted">
                  {missingData.items.map((item) => (
                    <li key={item}>- {item}</li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-ink">데이터 기준일</h2>
          <dl className="mt-4 grid gap-3 border-y border-line py-4 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-xs font-medium text-muted">후보 산정 기준</dt>
              <dd className="mt-1 font-semibold text-ink">{dataAsOf}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-muted">근거 개수</dt>
              <dd className="mt-1 font-semibold text-ink">{candidate.evidence_count}개</dd>
            </div>
          </dl>
        </div>
      </section>

      <section className="border-t border-line py-8">
        <div className="mb-4 flex items-end justify-between">
          <div>
            <h2 className="text-xl font-semibold text-ink">공시·뉴스·재무·가격 근거</h2>
            <p className="mt-1 text-sm text-muted">추천 이유와 AI 설명에 연결되는 근거를 확인합니다.</p>
          </div>
          <span className="text-sm text-muted">기준일 {dataAsOf}</span>
        </div>
        {evidenceGroups.length === 0 ? (
          <div className="border-y border-line py-8 text-sm text-muted">
            {evidence.message ?? "표시할 근거가 아직 없습니다. API 데이터 적재 상태를 확인해 주세요."}
          </div>
        ) : (
          <div className="space-y-3">
            {evidenceGroups.map((group, index) => (
              <details
                key={group.type}
                className="border-y border-line bg-white"
                open={index === 0}
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-4 py-3 text-sm font-semibold text-ink marker:hidden">
                  <span>{evidenceTypeLabel(group.type)} 근거</span>
                  <span className="shrink-0 text-xs font-medium text-muted">{group.items.length}개</span>
                </summary>
                <div className="divide-y divide-line border-t border-line">
                  {group.items.map((item) => (
                    <article key={item.id} className="px-4 py-4">
                      <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
                        <span className="font-semibold text-accent">{item.source_name}</span>
                        <span>{evidenceStatusLabel(item.data_status)}</span>
                        <span>발행일 {formatDate(item.published_at)}</span>
                        <span>기준일 {formatDate(item.as_of_date)}</span>
                      </div>
                      <h3 className="mt-2 font-semibold text-ink">{item.title}</h3>
                      <p className="mt-1 text-sm leading-6 text-muted">{item.summary}</p>
                      {item.source_url ? (
                        <a
                          href={item.source_url}
                          className="mt-2 inline-flex text-xs font-semibold text-accent"
                          rel="noreferrer"
                          target="_blank"
                        >
                          원문 보기
                        </a>
                      ) : (
                        <p className="mt-2 text-xs text-muted">
                          출처 확인 {item.source_identifier ?? "필요"}
                        </p>
                      )}
                    </article>
                  ))}
                </div>
              </details>
            ))}
          </div>
        )}
      </section>

      <section className="border-t border-line py-8">
        <h2 className="text-xl font-semibold text-ink">면책 문구</h2>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-muted">{candidate.disclaimer}</p>
      </section>
    </div>
  );
}

async function loadStockData(ticker: string) {
  const [stock, evidence, candidate] = await Promise.all([
    getStock(ticker),
    getStockEvidence(ticker),
    getRecommendationCandidate(ticker).catch((error: unknown) => {
      if (error instanceof ApiError && error.status === 404) {
        return null;
      }
      throw error;
    }),
  ]);
  return {
    candidate: candidate ?? fallbackCandidate(stock, evidence),
    stock,
    evidence,
  };
}

function fallbackCandidate(
  stock: StockDetail,
  evidence: StockEvidenceResponse,
): RecommendationCandidate {
  const evidenceIds = evidence.evidence.slice(0, 3).map((item) => item.id);
  const asOf = evidence.evidence[0]?.as_of_date ?? evidence.evidence[0]?.published_at ?? "";
  return {
    ticker: stock.ticker,
    name: stock.name,
    market: stock.market,
    sector: stock.sector,
    recommendation_score: 0,
    score_components: [],
    recommendation_reasons: [
      {
        reason_id: `${stock.ticker}-unscored`,
        component: "data_gap",
        summary: "추천 후보 점수는 아직 산정되지 않았지만 기본 종목 정보와 공개 근거는 확인할 수 있습니다.",
        evidence_ids: evidenceIds,
        source_document_ids: [],
      },
    ],
    risk_tags: ["점수 산정 필요"],
    evidence_level: evidence.evidence.length >= 2 ? "medium" : "weak",
    evidence_count: evidence.evidence.length,
    missing_data: ["recommendation_score"],
    data_freshness: { as_of: asOf },
    disclaimer: "공개 데이터 기반 검토 후보이며 최종 투자 판단은 사용자에게 있습니다.",
  };
}

function normalizeScoreComponents(components: ScoreComponent[]): ScoreComponent[] {
  return SCORE_COMPONENT_KEYS.map((name) => {
    const found = components.find((component) => component.name === name);
    if (found) return found;

    return {
      name,
      weight: defaultWeight(name),
      raw_score: null,
      weighted_score: 0,
      reason: "해당 점수 항목 데이터 확인이 필요합니다.",
      input_refs: [],
      evidence_ids: [],
    };
  });
}

function defaultWeight(name: string): number {
  const weights: Record<string, number> = {
    financial_stability: 20,
    profitability: 15,
    growth: 15,
    valuation: 10,
    news_attention: 10,
    disclosure_event: 10,
    liquidity: 10,
    momentum_volatility: 10,
  };
  return weights[name] ?? 0;
}

function componentWidth(component: ScoreComponent): number {
  if (component.weight <= 0) return 0;
  return Math.max(0, Math.min(100, (component.weighted_score / component.weight) * 100));
}

function formatMissingData(value: MissingDataItem[]) {
  if (!Array.isArray(value) || value.length === 0) {
    return { summary: "없음", items: [] as string[] };
  }

  const items = value.map((item) => {
    if (typeof item === "string") return item;
    if (item && typeof item === "object" && "field" in item) {
      return String(item.field);
    }
    return "확인 필요 데이터";
  });

  return { summary: `${items.length}개 확인 필요`, items };
}

function evidenceStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    available: "확인됨",
    fallback: "대체 데이터",
    missing: "누락",
  };
  return labels[status] ?? status;
}

const EVIDENCE_TYPE_ORDER = ["disclosure", "news", "financial", "price"] as const;

function groupEvidenceByType(items: StockEvidenceItem[]) {
  return EVIDENCE_TYPE_ORDER.map((type) => ({
    type,
    items: items.filter((item) => item.type === type),
  })).filter((group) => group.items.length > 0);
}
