export function RiskTag({ tag }: { tag: string }) {
  return (
    <span className="inline-flex items-center rounded-full bg-[#f4eee6] px-2.5 py-1 text-xs font-medium text-caution">
      {tag.replaceAll("_", " ")}
    </span>
  );
}
