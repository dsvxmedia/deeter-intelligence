export type Sentiment = "bullish" | "bearish" | "neutral";

export type RegimeState = "RISK-ON" | "RISK-OFF" | "UNCERTAIN";

export interface Article {
  id: string;
  title: string;
  description: string;
  url: string;
  source: string;
  publishedAt: string;
  content?: string;
}

export interface ScoredArticle extends Article {
  relevance: number;
  sentiment: Sentiment;
  entities: string[];
  summary: string;
  councilScore?: number;
  councilConfidence?: "high" | "medium" | "low";
  scoredAt: string;
}

export interface CouncilVote {
  model: string;
  relevance: number;
  sentiment: Sentiment;
  reasoning: string;
}

export interface CouncilResult {
  votes: CouncilVote[];
  finalRelevance: number;
  finalSentiment: Sentiment;
  confidence: "high" | "medium" | "low";
  synthesis: string;
}

export interface Position {
  ticker: string;
  name: string;
  shares: number;
  avgCost: number;
  currentPrice?: number;
  pctChange?: number;
}

export interface Portfolio {
  positions: Position[];
  totalValue: number;
  lastUpdated: string;
}

export interface ExposureAlert {
  ticker: string;
  name: string;
  exposureUsd: number;
  exposurePct: number;
  article: ScoredArticle;
}

export interface RegimeScore {
  state: RegimeState;
  score: number;
  bullCount: number;
  bearCount: number;
  neutralCount: number;
  updatedAt: string;
}

export interface VectorDoc {
  id: string;
  content: string;
  embedding: number[];
  metadata: {
    source: string;
    type: "earnings" | "fomc" | "sellside" | "macro" | "news";
    ticker?: string;
    date?: string;
  };
}

export interface RAGSource {
  id: string;
  content: string;
  source: string;
  similarity: number;
}

export interface EntityNode {
  id: string;
  type: "ticker" | "executive" | "event" | "sector" | "supplier";
  label: string;
  tickers?: string[];
}

export interface EntityEdge {
  from: string;
  to: string;
  relation: string;
}

export interface EntityGraph {
  nodes: EntityNode[];
  edges: EntityEdge[];
}

export interface Quote {
  ticker: string;
  price: number;
  pctChange: number;
  timestamp: number;
}

export interface Filing {
  accessionNo: string;
  filedAt: string;
  form: string;
  description?: string;
  linkToHtmlAnnouncement?: string;
}

export interface WatchlistItem {
  ticker: string;
  name: string;
}

export interface SignalBarData {
  ticker: string;
  bullCount: number;
  bearCount: number;
  neutralCount: number;
  avgRelevance: number;
}
