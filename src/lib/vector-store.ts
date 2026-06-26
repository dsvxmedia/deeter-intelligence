import type { VectorDoc, RAGSource } from "@/types";
import { SEED_CORPUS } from "@/data/seed-data";

function simpleEmbed(text: string): number[] {
  const words = text.toLowerCase().split(/\W+/).filter(Boolean);
  const vocab = new Map<string, number>();
  let idx = 0;
  for (const w of words) {
    if (!vocab.has(w)) vocab.set(w, idx++);
  }
  const vec = new Array(Math.min(vocab.size, 512)).fill(0);
  for (const w of words) {
    const i = vocab.get(w)!;
    if (i < 512) vec[i] += 1;
  }
  const mag = Math.sqrt(vec.reduce((s, v) => s + v * v, 0)) || 1;
  return vec.map((v) => v / mag);
}

function cosineSim(a: number[], b: number[]): number {
  const len = Math.min(a.length, b.length);
  let dot = 0;
  for (let i = 0; i < len; i++) dot += a[i] * b[i];
  return dot;
}

class VectorStore {
  private docs: VectorDoc[] = [];

  constructor() {
    for (const item of SEED_CORPUS) {
      this.add(item.id, item.content, {
        source: item.source,
        type: item.type,
        ticker: item.ticker,
        date: item.date,
      });
    }
  }

  add(
    id: string,
    content: string,
    metadata: VectorDoc["metadata"]
  ): void {
    this.docs.push({ id, content, embedding: simpleEmbed(content), metadata });
  }

  search(query: string, topK = 4): RAGSource[] {
    const qEmbed = simpleEmbed(query);
    return this.docs
      .map((d) => ({
        id: d.id,
        content: d.content,
        source: d.metadata.source,
        similarity: cosineSim(qEmbed, d.embedding),
      }))
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, topK);
  }

  searchByTickers(tickers: string[]): RAGSource[] {
    if (tickers.length === 0) return [];
    return this.docs
      .filter((d) => d.metadata.ticker && tickers.includes(d.metadata.ticker))
      .map((d) => ({ id: d.id, content: d.content, source: d.metadata.source, similarity: 1.0 }));
  }
}

let store: VectorStore | null = null;

export function getVectorStore(): VectorStore {
  if (!store) store = new VectorStore();
  return store;
}

export function addNewsToStore(
  id: string,
  content: string,
  source: string,
  ticker?: string
): void {
  getVectorStore().add(id, content, { source, type: "news", ticker });
}
