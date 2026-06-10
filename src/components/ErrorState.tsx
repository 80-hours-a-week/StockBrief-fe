import Link from "next/link";

export function ErrorState({
  title = "데이터를 불러오지 못했습니다.",
  message = "API 서버 상태와 환경변수를 확인해 주세요.",
  href = "/",
}: {
  title?: string;
  message?: string;
  href?: string;
}) {
  return (
    <section className="rounded-md border border-line bg-white p-6">
      <h2 className="text-lg font-semibold text-ink">{title}</h2>
      <p className="mt-2 text-sm text-muted">{message}</p>
      <Link
        href={href}
        className="mt-5 inline-flex rounded-md bg-ink px-4 py-2 text-sm font-semibold text-white transition hover:bg-accent focus:outline-none focus:shadow-focus"
      >
        돌아가기
      </Link>
    </section>
  );
}
