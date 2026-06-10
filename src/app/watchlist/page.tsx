import { WatchlistClient } from "@/components/WatchlistClient";

export default function WatchlistPage() {
  return (
    <div className="py-8">
      <section className="mx-auto max-w-4xl px-5 pb-6">
        <p className="text-sm font-semibold text-accent">관심종목</p>
        <h1 className="mt-3 text-3xl font-semibold text-ink">브라우저에 저장된 종목</h1>
        <p className="mt-3 text-sm leading-6 text-muted">
          MVP에서는 관심종목을 localStorage에 저장합니다.
        </p>
      </section>
      <WatchlistClient />
    </div>
  );
}
