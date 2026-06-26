import type { EntityGraph, EntityNode, EntityEdge } from "@/types";

const GRAPH: EntityGraph = {
  nodes: [
    { id: "NVDA", type: "ticker", label: "NVIDIA Corp." },
    { id: "AAPL", type: "ticker", label: "Apple Inc." },
    { id: "MSFT", type: "ticker", label: "Microsoft Corp." },
    { id: "META", type: "ticker", label: "Meta Platforms" },
    { id: "JPM", type: "ticker", label: "JPMorgan Chase" },
    { id: "AMZN", type: "ticker", label: "Amazon.com" },
    { id: "TSLA", type: "ticker", label: "Tesla Inc." },
    { id: "GOOGL", type: "ticker", label: "Alphabet Inc." },
    { id: "AMD", type: "ticker", label: "Advanced Micro Devices" },
    { id: "jensen-huang", type: "executive", label: "Jensen Huang", tickers: ["NVDA"] },
    { id: "tim-cook", type: "executive", label: "Tim Cook", tickers: ["AAPL"] },
    { id: "satya-nadella", type: "executive", label: "Satya Nadella", tickers: ["MSFT"] },
    { id: "mark-zuckerberg", type: "executive", label: "Mark Zuckerberg", tickers: ["META"] },
    { id: "jamie-dimon", type: "executive", label: "Jamie Dimon", tickers: ["JPM"] },
    { id: "elon-musk", type: "executive", label: "Elon Musk", tickers: ["TSLA"] },
    { id: "ai-infrastructure", type: "sector", label: "AI Infrastructure", tickers: ["NVDA", "MSFT", "GOOGL", "AMZN", "AMD"] },
    { id: "data-center", type: "sector", label: "Data Center", tickers: ["NVDA", "AMZN", "MSFT", "GOOGL"] },
    { id: "semiconductors", type: "sector", label: "Semiconductors", tickers: ["NVDA", "AMD"] },
    { id: "big-tech", type: "sector", label: "Big Tech", tickers: ["AAPL", "MSFT", "META", "GOOGL", "AMZN"] },
    { id: "blackwell", type: "event", label: "Blackwell Architecture", tickers: ["NVDA"] },
    { id: "fed-rate", type: "event", label: "Federal Reserve Rate Decision", tickers: ["JPM"] },
    { id: "apple-intelligence", type: "event", label: "Apple Intelligence AI", tickers: ["AAPL"] },
    // Supply chain nodes — TSMC supplies NVDA, AAPL, AMD (enables indirect exposure)
    { id: "TSMC", type: "supplier", label: "Taiwan Semiconductor", tickers: ["NVDA", "AAPL", "AMD"] },
    { id: "tsmc-capacity", type: "event", label: "TSMC Capacity Constraint", tickers: ["NVDA", "AAPL", "AMD"] },
    { id: "CoWoS", type: "event", label: "CoWoS Advanced Packaging", tickers: ["NVDA"] },
    { id: "ASML", type: "supplier", label: "ASML Holding", tickers: ["NVDA", "AMD"] },
    { id: "AMAT", type: "supplier", label: "Applied Materials", tickers: ["NVDA", "AMD"] },
  ],
  edges: [
    { from: "jensen-huang", to: "NVDA", relation: "CEO" },
    { from: "tim-cook", to: "AAPL", relation: "CEO" },
    { from: "satya-nadella", to: "MSFT", relation: "CEO" },
    { from: "mark-zuckerberg", to: "META", relation: "CEO" },
    { from: "jamie-dimon", to: "JPM", relation: "CEO" },
    { from: "elon-musk", to: "TSLA", relation: "CEO" },
    { from: "blackwell", to: "NVDA", relation: "product" },
    { from: "apple-intelligence", to: "AAPL", relation: "product" },
    { from: "fed-rate", to: "JPM", relation: "affects" },
    { from: "NVDA", to: "ai-infrastructure", relation: "member" },
    { from: "MSFT", to: "ai-infrastructure", relation: "member" },
    { from: "GOOGL", to: "ai-infrastructure", relation: "member" },
    { from: "AMZN", to: "ai-infrastructure", relation: "member" },
    { from: "AMD", to: "ai-infrastructure", relation: "member" },
    { from: "NVDA", to: "data-center", relation: "member" },
    { from: "NVDA", to: "semiconductors", relation: "member" },
    { from: "AMD", to: "semiconductors", relation: "member" },
    { from: "AAPL", to: "big-tech", relation: "member" },
    { from: "MSFT", to: "big-tech", relation: "member" },
    { from: "META", to: "big-tech", relation: "member" },
    // Supply chain edges — TSMC story → surfaces NVDA/AAPL/AMD exposure
    { from: "TSMC", to: "NVDA", relation: "supplier" },
    { from: "TSMC", to: "AAPL", relation: "supplier" },
    { from: "TSMC", to: "AMD", relation: "supplier" },
    { from: "tsmc-capacity", to: "NVDA", relation: "affects" },
    { from: "tsmc-capacity", to: "AAPL", relation: "affects" },
    { from: "tsmc-capacity", to: "AMD", relation: "affects" },
    { from: "CoWoS", to: "NVDA", relation: "affects" },
    { from: "ASML", to: "NVDA", relation: "supplier" },
    { from: "ASML", to: "AMD", relation: "supplier" },
    { from: "AMAT", to: "NVDA", relation: "supplier" },
    { from: "AMAT", to: "AMD", relation: "supplier" },
  ],
};

export function getEntityGraph(): EntityGraph {
  return GRAPH;
}

export function matchEntities(text: string): string[] {
  const upper = text.toUpperCase();
  const found = new Set<string>();

  for (const node of GRAPH.nodes) {
    // Direct ticker mention
    if (node.type === "ticker" && upper.includes(node.id)) {
      found.add(node.id);
    }
    // Label match — executives, events, and supply chain nodes surface related tickers
    if (upper.includes(node.label.toUpperCase())) {
      if (node.type === "ticker") {
        found.add(node.id);
      } else if (node.tickers) {
        node.tickers.forEach((t) => found.add(t));
      }
    }
  }

  // Edge traversal: supplier/event node mentioned → surface downstream ticker exposure
  for (const edge of GRAPH.edges) {
    if (found.has(edge.from) && edge.to && isTickerNode(edge.to)) {
      found.add(edge.to);
    }
  }

  return Array.from(found);
}

function isTickerNode(id: string): boolean {
  return GRAPH.nodes.some((n) => n.id === id && n.type === "ticker");
}
