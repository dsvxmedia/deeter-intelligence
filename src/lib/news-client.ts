import type { Article } from "@/types";

const BASE = "https://newsapi.org/v2";

// Shown when NewsAPI is unavailable (rate limit, missing key, network error)
const MOCK_ARTICLES: Article[] = [
  {
    id: "mock-1",
    title: "NVIDIA Q4 earnings beat estimates on record data center revenue",
    description: "NVDA reported $22.1B in data center revenue, up 409% year-over-year, driven by Hopper GPU shipments and early Blackwell demand.",
    url: "https://investor.nvidia.com",
    source: "NVIDIA IR",
    publishedAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    content: "NVDA reported $22.1B in data center revenue driven by Hopper GPU demand and Blackwell ramp.",
  },
  {
    id: "mock-2",
    title: "Fed minutes: rate cut path depends on inflation trajectory, committee divided",
    description: "FOMC minutes reveal split between members favoring two cuts in 2025 versus those holding for more data before easing.",
    url: "https://www.federalreserve.gov",
    source: "Federal Reserve",
    publishedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    content: "Federal Reserve divided on rate trajectory. JPM and rate-sensitive equities watching closely.",
  },
  {
    id: "mock-3",
    title: "TSMC CoWoS capacity fully booked through 2026 as AI demand accelerates",
    description: "Taiwan Semiconductor's advanced packaging capacity is sold out through mid-2026, constraining Blackwell production for NVIDIA and limiting AMD MI300X ramp.",
    url: "https://www.tsmc.com",
    source: "Reuters",
    publishedAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    content: "TSMC CoWoS supply constraint directly affects NVDA Blackwell production timeline and AMD AI chip ramp.",
  },
  {
    id: "mock-4",
    title: "Apple Intelligence adoption drives 12% iPhone upgrade cycle acceleration",
    description: "Channel checks show iOS 18.2 AI feature adoption triggering earlier-than-expected upgrade cycle, particularly in enterprise accounts.",
    url: "https://www.apple.com/investor-relations",
    source: "Bloomberg",
    publishedAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    content: "AAPL sees accelerated upgrade cycle from Apple Intelligence rollout. Services revenue also benefiting.",
  },
  {
    id: "mock-5",
    title: "Microsoft Azure AI revenue run rate crosses $10B as Copilot seats scale",
    description: "MSFT reports Azure AI growing at 3x the rate of core cloud, with Copilot reaching 1.3M enterprise seats in Q3.",
    url: "https://investor.microsoft.com",
    source: "Microsoft IR",
    publishedAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    content: "MSFT Azure AI revenue accelerating. NVDA and MSFT supply chain closely linked on H100 cluster deployments.",
  },
  {
    id: "mock-6",
    title: "JPMorgan raises NVDA price target to $1,200 on supply chain checks",
    description: "Jamie Dimon's firm lifts NVDA PT citing strong Blackwell demand signals from hyperscaler capex commitments in Q4 channel checks.",
    url: "https://www.jpmorganchase.com",
    source: "JPMorgan Research",
    publishedAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    content: "JPM upgrades NVDA. Hyperscaler capex budgets for 2025 remain robust despite macro uncertainty.",
  },
];

export async function fetchNews(tickers: string[]): Promise<Article[]> {
  const key = process.env.NEWSAPI_KEY;
  if (!key) {
    console.warn("NEWSAPI_KEY not set — returning mock articles");
    return MOCK_ARTICLES;
  }

  const query = tickers.join(" OR ");
  const from = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split("T")[0];

  const url = `${BASE}/everything?q=${encodeURIComponent(query)}&from=${from}&sortBy=publishedAt&language=en&pageSize=20&apiKey=${key}`;

  try {
    const res = await fetch(url, { next: { revalidate: 90 } });
    if (!res.ok) throw new Error(`NewsAPI ${res.status}`);

    const data = await res.json();
    if (data.status !== "ok") throw new Error(data.message ?? "NewsAPI error");

    const articles = (data.articles ?? []).map(
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

    return articles.length > 0 ? articles : MOCK_ARTICLES;
  } catch (err) {
    console.warn("NewsAPI unavailable, using mock articles:", err);
    return MOCK_ARTICLES;
  }
}
