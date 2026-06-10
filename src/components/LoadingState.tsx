export function LoadingState({ label = "데이터를 불러오는 중입니다." }: { label?: string }) {
  return (
    <div className="space-y-3 py-8" aria-live="polite">
      <div className="h-4 w-56 animate-pulse rounded bg-line" />
      <div className="h-20 w-full animate-pulse rounded-md bg-white" />
      <p className="text-sm text-muted">{label}</p>
    </div>
  );
}
