import { NextRequest, NextResponse } from "next/server";
import { fetchNews } from "@/lib/news-client";

export async function POST(req: NextRequest) {
  try {
    const { tickers } = await req.json();
    if (!Array.isArray(tickers) || tickers.length === 0) {
      return NextResponse.json({ error: "tickers required" }, { status: 400 });
    }
    const articles = await fetchNews(tickers);
    return NextResponse.json({ articles });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to fetch news";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
