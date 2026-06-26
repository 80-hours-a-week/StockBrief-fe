import Link from "next/link";

import type { StockSearchItem } from "@/types/api";

interface StockSearchResultsProps {
  query: string;
  items: StockSearchItem[];
}

export function StockSearchResults({ query, items }: StockSearchResultsProps) {
  if (items.length === 0) {
    return (
      <div className="border-y border-line py-10 text-sm text-muted">
        {query ? "검색 결과가 없습니다." : "종목명이나 6자리 종목 코드를 입력해 주세요."}
      </div>
    );
  }

  return (
    <ul className="divide-y divide-line border-y border-line bg-white">
      {items.map((item) => (
        <li key={item.ticker}>
          <Link
            href={`/stocks/${item.ticker}`}
            className="block px-4 py-4 transition hover:bg-field focus:outline-none focus:shadow-focus sm:px-5"
          >
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <div className="text-lg font-semibold text-ink">{item.name}</div>
                <div className="mt-1 text-sm text-muted">
                  {item.ticker} · {item.market}
                </div>
              </div>
              <div className="text-sm text-muted">{item.sector ?? "분류 없음"}</div>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
