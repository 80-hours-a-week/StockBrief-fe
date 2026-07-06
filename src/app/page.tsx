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
    <div className="mx-auto max-w-7xl px-5 py-7">
      <section className="border-b border-line pb-7">
        <div className="max-w-3xl">
          <h1 className="text-3xl font-semibold leading-tight text-ink sm:text-4xl">
            공개 데이터로 검토할 국내 종목
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-muted">
            추천 후보의 점수, 이유, 리스크, 근거 기준일을 한 화면에서 확인합니다.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/explore"
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
      </section>

      <section className="py-8">
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold text-ink">오늘의 추천 후보</h2>
            <p className="mt-1 text-sm text-muted">
              현재 조건에서 확인된 후보 {candidates.items.length}개를 표시합니다.
            </p>
          </div>
          <Link href="/explore" className="text-sm font-semibold text-accent">
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
