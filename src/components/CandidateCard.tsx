import Link from "next/link";

import { EvidenceBadge } from "@/components/EvidenceBadge";
import { RiskTag } from "@/components/RiskTag";
import { ScoreBadge } from "@/components/ScoreBadge";
import { WatchlistToggle } from "@/components/WatchlistToggle";
import { formatDate } from "@/lib/format";
import type { RecommendationCandidate, RecommendationReason } from "@/types/api";

export function CandidateCard({ candidate }: { candidate: RecommendationCandidate }) {
  const reasons = normalizeReasons(candidate.recommendation_reasons);
  const riskTags = candidate.risk_tags.length > 0 ? candidate.risk_tags : ["확인 필요"];
  const missingData = formatMissingData(candidate.missing_data);
  const asOf = formatDate(candidate.data_freshness.as_of);

  return (
    <article className="group border-y border-line bg-white px-4 py-5 transition hover:bg-field sm:px-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-muted">
            <span>{candidate.market}</span>
            <span aria-hidden="true">/</span>
            <span>{candidate.sector ?? "분류 없음"}</span>
            <span aria-hidden="true">/</span>
            <span>{candidate.ticker}</span>
          </div>
          <Link
            href={`/stocks/${candidate.ticker}`}
            className="mt-2 inline-flex text-xl font-semibold text-ink transition group-hover:text-accent focus:outline-none focus:shadow-focus"
          >
            {candidate.name}
          </Link>
        </div>

        <div className="flex shrink-0 items-center gap-3">
          <div className="text-right">
            <div className="text-xs font-medium text-muted">추천 후보 점수</div>
            <div className="mt-1">
              <ScoreBadge score={candidate.recommendation_score} />
            </div>
          </div>
          <WatchlistToggle
            item={{
              ticker: candidate.ticker,
              name: candidate.name,
              market: candidate.market,
              ...(candidate.sector ? { sector: candidate.sector } : {}),
            }}
            variant="compact"
          />
        </div>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-[1.4fr_0.9fr]">
        <div>
          <h3 className="text-sm font-semibold text-ink">추천 이유</h3>
          <ul className="mt-2 space-y-2">
            {reasons.map((reason) => (
              <li key={reason.key} className="border-l-2 border-accent pl-3 text-sm leading-6 text-muted">
                {reason.summary}
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <EvidenceBadge level={candidate.evidence_level} count={candidate.evidence_count} />
            {riskTags.slice(0, 3).map((tag) => (
              <RiskTag key={tag} tag={tag} />
            ))}
          </div>

          <dl className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <dt className="text-xs font-medium text-muted">데이터 기준일</dt>
              <dd className="mt-1 font-semibold text-ink">{asOf}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-muted">누락 데이터</dt>
              <dd className="mt-1 font-semibold text-ink">{missingData}</dd>
            </div>
          </dl>

          <Link
            href={`/stocks/${candidate.ticker}`}
            className="inline-flex rounded-md border border-line bg-white px-4 py-2 text-sm font-semibold text-ink transition hover:border-accent hover:text-accent focus:outline-none focus:shadow-focus"
          >
            왜 추천됐나요?
          </Link>
        </div>
      </div>
    </article>
  );
}

function normalizeReasons(reasons: RecommendationReason[]) {
  const filled = reasons.slice(0, 2).map((reason, index) => ({
    key: reason.reason_id || `${reason.component}-${index}`,
    summary: reason.summary,
  }));

  while (filled.length < 2) {
    filled.push({
      key: `missing-reason-${filled.length}`,
      summary: "공개 데이터 기준 추가 검토 포인트 확인이 필요합니다.",
    });
  }

  return filled;
}

function formatMissingData(value: unknown[]): string {
  if (!Array.isArray(value) || value.length === 0) {
    return "없음";
  }

  return `${value.length}개 확인 필요`;
}
