import { CandidateCard } from "@/components/CandidateCard";
import type { RecommendationCandidate } from "@/types/api";

export function CandidateTable({ items }: { items: RecommendationCandidate[] }) {
  if (items.length === 0) {
    return (
      <div className="border-y border-line py-10 text-sm text-muted">
        현재 조건에 맞는 추천 후보가 없습니다.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {items.map((item) => (
        <CandidateCard key={item.ticker} candidate={item} />
      ))}
    </div>
  );
}
