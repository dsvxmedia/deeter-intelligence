import type { ScoredArticle, RegimeScore, RegimeState } from "@/types";

const TWO_HOURS = 2 * 60 * 60 * 1000;

export function computeRegime(articles: ScoredArticle[]): RegimeScore {
  const cutoff = Date.now() - TWO_HOURS;
  const recent = articles.filter(
    (a) => new Date(a.scoredAt).getTime() > cutoff && a.relevance >= 5
  );

  if (recent.length === 0) {
    return {
      state: "UNCERTAIN",
      score: 0,
      bullCount: 0,
      bearCount: 0,
      neutralCount: 0,
      updatedAt: new Date().toISOString(),
    };
  }

  let bullCount = 0;
  let bearCount = 0;
  let neutralCount = 0;
  let weightedScore = 0;
  let totalWeight = 0;

  for (const a of recent) {
    const weight = a.relevance / 10;
    totalWeight += weight;

    if (a.sentiment === "bullish") {
      bullCount++;
      weightedScore += weight;
    } else if (a.sentiment === "bearish") {
      bearCount++;
      weightedScore -= weight;
    } else {
      neutralCount++;
    }
  }

  const normalized = totalWeight > 0 ? weightedScore / totalWeight : 0;

  let state: RegimeState;
  if (normalized > 0.2) state = "RISK-ON";
  else if (normalized < -0.2) state = "RISK-OFF";
  else state = "UNCERTAIN";

  return {
    state,
    score: Math.round(normalized * 100),
    bullCount,
    bearCount,
    neutralCount,
    updatedAt: new Date().toISOString(),
  };
}
