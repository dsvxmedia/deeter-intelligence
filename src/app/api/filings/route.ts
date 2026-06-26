import { NextRequest, NextResponse } from "next/server";
import { getFilingsByTicker } from "@/lib/edgar-client";

export async function GET(req: NextRequest) {
  const ticker = req.nextUrl.searchParams.get("ticker");
  if (!ticker) {
    return NextResponse.json({ error: "ticker required" }, { status: 400 });
  }

  try {
    const filings = await getFilingsByTicker(ticker.toUpperCase());
    return NextResponse.json({ filings });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to fetch filings";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
