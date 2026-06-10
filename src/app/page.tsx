import Link from "next/link";

import { CandidateTable } from "@/components/CandidateTable";
import { ErrorState } from "@/components/ErrorState";
import { getRecommendationCandidates } from "@/lib/api";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  let data: Awaited<ReturnType<typeof loadHomeData>>;
  try {
    data = await loadHomeData();
  } catch {
    return (
      <div className="mx-auto max-w-7xl px-5 py-8">
        <ErrorState />
      </div>
    );
  }

  const { candidates } = data;

  return (
    <div className="mx-auto max-w-7xl px-5 py-8">
      <section className="grid gap-8 border-b border-line pb-8 lg:grid-cols-[1.4fr_0.8fr]">
        <div>
          <p className="text-sm font-semibold text-accent">오늘의 추천 후보</p>
          <h1 className="mt-3 max-w-3xl text-4xl font-semibold leading-tight text-ink sm:text-5xl">
            공개 근거와 점수로 먼저 훑는 국내 종목 검토 흐름
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-muted">
            후보 점수, 추천 이유, 리스크 태그, 근거 기준일을 한 화면에서 확인합니다.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link
              href="/recommendations"
              className="rounded-md bg-ink px-5 py-3 text-sm font-semibold text-white transition hover:bg-accent focus:outline-none focus:shadow-focus"
            >
              추천 후보 보기
            </Link>
            <Link
              href="/onboarding"
              className="rounded-md border border-line bg-white px-5 py-3 text-sm font-semibold text-ink transition hover:bg-field focus:outline-none focus:shadow-focus"
            >
              선호 설정
            </Link>
          </div>
        </div>
        <div className="border-y border-line py-5">
          <div className="grid grid-cols-3 gap-4">
            <Metric label="Top 3" value={String(candidates.items.length)} />
            <Metric label="근거 기준" value="public" />
            <Metric label="기준" value="v1" />
          </div>
        </div>
      </section>

      <section className="py-8">
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold text-ink">오늘의 추천 후보 Top 3</h2>
            <p className="mt-1 text-sm text-muted">
              점수만이 아니라 추천 이유, 근거 수준, 리스크 태그를 함께 확인합니다.
            </p>
          </div>
          <Link href="/recommendations" className="text-sm font-semibold text-accent">
            전체 보기
          </Link>
        </div>
        <CandidateTable items={candidates.items} />
      </section>
    </div>
  );
}

async function loadHomeData() {
  const candidates = await getRecommendationCandidates({ limit: 3 });
  return { candidates };
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-3xl font-semibold text-ink">{value}</div>
      <div className="mt-1 text-xs font-medium uppercase text-muted">{label}</div>
    </div>
  );
}
