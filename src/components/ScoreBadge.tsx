import { formatScore } from "@/lib/format";

export function ScoreBadge({ score }: { score: number }) {
  const tone = score >= 75 ? "bg-accent text-white" : score >= 65 ? "bg-ink text-white" : "bg-field text-ink";
  return (
    <span className={`inline-flex min-w-16 items-center justify-center rounded-md px-3 py-1.5 text-sm font-semibold ${tone}`}>
      {formatScore(score)}
    </span>
  );
}
