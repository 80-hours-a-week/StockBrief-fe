import type { EvidenceLevel } from "@/types/api";

const evidenceCopy: Record<EvidenceLevel, string> = {
  strong: "근거 충분",
  medium: "근거 보통",
  weak: "근거가 부족한 후보",
};

export function EvidenceBadge({ level, count }: { level: EvidenceLevel; count?: number }) {
  return (
    <span className="inline-flex items-center rounded-full border border-line bg-white px-2.5 py-1 text-xs font-medium text-ink">
      {evidenceCopy[level]}{typeof count === "number" ? ` · ${count}` : ""}
    </span>
  );
}
