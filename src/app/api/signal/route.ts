import { NextRequest, NextResponse } from "next/server";
import { generateText, Output } from "ai";
import { z } from "zod";
import { CLAUDE_HAIKU_MODEL, SYSTEM_PROMPT } from "@/lib/ai-client";
import { matchEntities } from "@/lib/entity-graph";
import { addNewsToStore } from "@/lib/vector-store";
import type { Article, ScoredArticle } from "@/types";

const SignalSchema = z.object({
  relevance: z.number().min(1).max(10),
  sentiment: z.enum(["bullish", "bearish", "neutral"]),
  entities: z.array(z.string()),
  summary: z.string(),
});

export async function POST(req: NextRequest) {
  try {
    const { article, tickers }: { article: Article; tickers: string[] } = await req.json();

    const text = `${article.title}\n\n${article.description ?? ""}\n\n${article.content ?? ""}`;
    const watchlistContext = `Portfolio tickers: ${tickers.join(", ")}`;

    const { output } = await generateText({
      model: CLAUDE_HAIKU_MODEL,
      system: SYSTEM_PROMPT,
      prompt: `Score this news article for a trading desk.\n${watchlistContext}\n\nArticle:\n${text}\n\nProvide: relevance (1-10 where 10=critical market-moving event), sentiment, entities mentioned (tickers/companies), and a 1-sentence summary.`,
      output: Output.object({ schema: SignalSchema }),
    });

    const graphEntities = matchEntities(text);
    const allEntities = Array.from(new Set([...(output?.entities ?? []), ...graphEntities]));

    const scored: ScoredArticle = {
      ...article,
      relevance: output?.relevance ?? 5,
      sentiment: output?.sentiment ?? "neutral",
      entities: allEntities,
      summary: output?.summary ?? article.description ?? "",
      scoredAt: new Date().toISOString(),
    };

    addNewsToStore(article.id, text, article.source, allEntities[0]);

    return NextResponse.json({ signal: scored });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Signal scoring failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
