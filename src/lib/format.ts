export function formatScore(score: number): string {
  return score.toFixed(1);
}

export function formatDate(value: unknown): string {
  if (typeof value !== "string" || value.length === 0) {
    return "확인 필요";
  }
  return value.slice(0, 10);
}

export function riskProfileLabel(value: string): string {
  const labels: Record<string, string> = {
    conservative: "안정형",
    balanced: "균형형",
    aggressive: "적극형",
  };
  return labels[value] ?? "확인 필요";
}

export function componentLabel(name: string): string {
  const labels: Record<string, string> = {
    financial_stability: "재무 안정성",
    profitability: "수익성",
    growth: "성장성",
    valuation: "가치 지표",
    news_attention: "뉴스 관심도",
    disclosure_event: "공시 이벤트",
    liquidity: "유동성",
    momentum_volatility: "모멘텀/변동성",
  };
  return labels[name] ?? name;
}

export function evidenceTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    financial: "재무",
    news: "뉴스",
    disclosure: "공시",
    price: "가격",
  };
  return labels[type] ?? type;
}
