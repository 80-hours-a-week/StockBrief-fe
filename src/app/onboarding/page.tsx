import { OnboardingForm } from "@/components/OnboardingForm";

export default function OnboardingPage() {
  return (
    <div className="py-8">
      <section className="mx-auto max-w-3xl px-5 pb-8">
        <p className="text-sm font-semibold text-accent">온보딩</p>
        <h1 className="mt-3 text-3xl font-semibold text-ink">MVP 선호 설정</h1>
        <p className="mt-3 text-sm leading-6 text-muted">
          로그인 없이 브라우저 저장소에 관심 시장과 리스크 성향을 저장합니다.
        </p>
      </section>
      <OnboardingForm />
    </div>
  );
}
