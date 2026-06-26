import { MOCK_PORTFOLIO } from "@/data/seed-data";
import type { Portfolio, Position, ExposureAlert, ScoredArticle } from "@/types";

let portfolioCache: Portfolio | null = null;

export function getPortfolio(liveQuotes?: Record<string, number>): Portfolio {
  const positions: Position[] = MOCK_PORTFOLIO.map((p) => {
    const currentPrice = liveQuotes?.[p.ticker] ?? p.avgCost * 1.1;
    const pctChange = ((currentPrice - p.avgCost) / p.avgCost) * 100;
    return { ...p, currentPrice, pctChange };
  });

  const totalValue = positions.reduce(
    (sum, p) => sum + p.shares * (p.currentPrice ?? p.avgCost),
    0
  );

  portfolioCache = { positions, totalValue, lastUpdated: new Date().toISOString() };
  return portfolioCache;
}

export function checkExposure(
  article: ScoredArticle,
  portfolio: Portfolio
): ExposureAlert | null {
  if (article.relevance < 8) return null;

  const match = portfolio.positions.find(
    (p) =>
      article.entities.includes(p.ticker) ||
      article.title.toUpperCase().includes(p.ticker) ||
      article.summary?.toUpperCase().includes(p.ticker)
  );

  if (!match) return null;

  const exposureUsd = match.shares * (match.currentPrice ?? match.avgCost);
  const exposurePct = (exposureUsd / portfolio.totalValue) * 100;

  return {
    ticker: match.ticker,
    name: match.name,
    exposureUsd,
    exposurePct,
    article,
  };
}

export function formatCurrency(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K`;
  return `$${value.toFixed(0)}`;
}
