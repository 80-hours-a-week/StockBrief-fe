import { ErrorState } from "@/components/ErrorState";
import { StockSearchResults } from "@/components/StockSearchResults";
import { searchStocks } from "@/lib/api";

export const dynamic = "force-dynamic";

type SearchPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams;
  const query = readQuery(params.q);
  let results: Awaited<ReturnType<typeof searchStocks>> = {
    query,
    count: 0,
    items: [],
  };

  if (query) {
    try {
      results = await searchStocks(query, 20);
    } catch {
      return (
        <div className="mx-auto max-w-5xl px-5 py-8">
          <ErrorState href="/" />
        </div>
      );
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-5 py-8">
      <section className="border-b border-line pb-6">
        <p className="text-sm font-semibold text-accent">종목 검색</p>
        <h1 className="mt-2 text-3xl font-semibold text-ink">회사명이나 종목 코드로 찾기</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
          검색 결과에서 종목을 선택하면 점수, 추천 이유, 근거, 리스크를 바로 확인할 수 있습니다.
        </p>
      </section>

      <form action="/search" className="py-6">
        <label className="block max-w-xl">
          <span className="text-xs font-medium text-muted">검색어</span>
          <div className="mt-1 flex flex-col gap-2 sm:flex-row">
            <input
              name="q"
              defaultValue={query}
              placeholder="예: 삼성전자 또는 005930"
              className="min-w-0 flex-1 rounded-md border border-line bg-field px-3 py-2 text-sm text-ink outline-none transition focus:bg-white focus:shadow-focus"
            />
            <button
              type="submit"
              className="rounded-md bg-ink px-4 py-2 text-sm font-semibold text-white transition hover:bg-accent focus:outline-none focus:shadow-focus"
            >
              검색
            </button>
          </div>
        </label>
      </form>

      <section>
        <div className="mb-3 text-sm text-muted">
          {query ? `"${query}" 검색 결과 ${results.count}개` : "검색어를 입력해 주세요"}
        </div>
        <StockSearchResults query={query} items={results.items} />
      </section>
    </div>
  );
}

function readQuery(value: string | string[] | undefined) {
  const rawValue = Array.isArray(value) ? value[0] : value;
  return (rawValue ?? "").trim();
}
