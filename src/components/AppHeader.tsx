import Link from "next/link";

const navItems = [
  { href: "/", label: "홈" },
  { href: "/explore", label: "탐색" },
  { href: "/search", label: "검색" },
  { href: "/watchlist", label: "관심종목" },
  { href: "/chat", label: "챗봇" },
  { href: "/onboarding", label: "선호 설정" },
  { href: "/account", label: "계정" },
];

export function AppHeader() {
  return (
    <header className="border-b border-line bg-white/90 backdrop-blur">
      <div className="mx-auto flex min-h-16 w-full max-w-7xl flex-col items-start gap-2 px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
        <Link href="/" className="flex items-baseline gap-2">
          <span className="text-xl font-semibold text-ink">StockBrief</span>
          <span className="hidden text-sm text-muted sm:inline">국내 종목 검토 후보</span>
        </Link>
        <nav className="flex w-full items-center gap-1 overflow-x-auto sm:w-auto">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="shrink-0 rounded-md px-3 py-2 text-sm font-medium text-muted transition hover:bg-field hover:text-ink focus:outline-none focus:shadow-focus"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
