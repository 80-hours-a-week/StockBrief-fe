const DEFAULT_DISCLAIMER = "공개 데이터 기반 검토 후보이며 최종 투자 판단은 사용자에게 있습니다.";

export function DisclaimerBanner({ text = DEFAULT_DISCLAIMER }: { text?: string }) {
  return (
    <section className="border-b border-line bg-[#fff8e8]">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-3 text-sm text-ink">
        <p>{text}</p>
        <span className="hidden rounded-full border border-[#e4c98f] px-2.5 py-1 text-xs text-caution sm:inline">
          공개 데이터 기준
        </span>
      </div>
    </section>
  );
}
