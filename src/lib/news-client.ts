import type { Article } from "@/types";

const BASE = "https://newsapi.org/v2";

export async function fetchNews(tickers: string[]): Promise<Article[]> {
  const key = process.env.NEWSAPI_KEY;
  if (!key) throw new Error("NEWSAPI_KEY not set");

  const query = tickers.join(" OR ");
  const from = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split("T")[0];

  const url = `${BASE}/everything?q=${encodeURIComponent(query)}&from=${from}&sortBy=publishedAt&language=en&pageSize=20&apiKey=${key}`;

  const res = await fetch(url, { next: { revalidate: 90 } });
  if (!res.ok) throw new Error(`NewsAPI error ${res.status}`);

  const data = await res.json();
  if (data.status !== "ok") throw new Error(data.message ?? "NewsAPI error");

  return (data.articles ?? []).map(
    (a: Record<string, unknown>, i: number): Article => ({
      id: `news-${Date.now()}-${i}`,
      title: (a.title as string) ?? "",
      description: (a.description as string) ?? "",
      url: (a.url as string) ?? "",
      source: (a.source as Record<string, string>)?.name ?? "Unknown",
      publishedAt: (a.publishedAt as string) ?? new Date().toISOString(),
      content: ((a.content ?? a.description) as string) ?? "",
    })
  );
}
