import { NextRequest, NextResponse } from "next/server";
import { generateText, Output } from "ai";
import type { LanguageModelV4 } from "@ai-sdk/provider";
import { z } from "zod";
import { CLAUDE_MODEL, GPT_MODEL, GEMINI_MODEL, SYSTEM_PROMPT } from "@/lib/ai-client";
import type { Article, CouncilVote, CouncilResult } from "@/types";

const VoteSchema = z.object({
  relevance: z.number().min(1).max(10),
  sentiment: z.enum(["bullish", "bearish", "neutral"]),
  reasoning: z.string(),
});

const SynthesisSchema = z.object({
  finalRelevance: z.number().min(1).max(10),
  finalSentiment: z.enum(["bullish", "bearish", "neutral"]),
  confidence: z.enum(["high", "medium", "low"]),
  synthesis: z.string(),
});

async function getVote(
  model: LanguageModelV4,
  modelName: string,
  article: Article,
  tickers: string[]
): Promise<CouncilVote> {
  const text = `${article.title}\n\n${article.description ?? ""}\n\n${article.content ?? ""}`;
  const { output } = await generateText({
    model,
    system: SYSTEM_PROMPT,
    prompt: `You are one of three trading desk analysts providing an independent assessment.\nPortfolio tickers: ${tickers.join(", ")}\n\nScore this article:\n${text}`,
    output: Output.object({ schema: VoteSchema }),
  });
  return {
    model: modelName,
    relevance: output?.relevance ?? 5,
    sentiment: output?.sentiment ?? "neutral",
    reasoning: output?.reasoning ?? "",
  };
}

export async function POST(req: NextRequest) {
  try {
    const { article, tickers }: { article: Article; tickers: string[] } = await req.json();

    const [claudeVote, gptVote, geminiVote] = await Promise.allSettled([
      getVote(CLAUDE_MODEL, "claude-sonnet-4-6", article, tickers),
      getVote(GPT_MODEL, "gpt-4o", article, tickers),
      getVote(GEMINI_MODEL, "gemini-2.0-flash-exp", article, tickers),
    ]);

    const votes: CouncilVote[] = [claudeVote, gptVote, geminiVote]
      .filter((r): r is PromiseFulfilledResult<CouncilVote> => r.status === "fulfilled")
      .map((r) => r.value);

    if (votes.length === 0) {
      return NextResponse.json({ error: "All council members failed" }, { status: 500 });
    }

    const text = `${article.title}\n${article.description ?? ""}`;
    const voteSummary = votes
      .map(
        (v) =>
          `${v.model}: relevance=${v.relevance}, sentiment=${v.sentiment}. Reasoning: ${v.reasoning}`
      )
      .join("\n");

    const { output: synthesis } = await generateText({
      model: CLAUDE_MODEL,
      system: SYSTEM_PROMPT,
      prompt: `You are the Chairman synthesizing three analyst votes.\n\nArticle: ${text}\n\nVotes:\n${voteSummary}\n\nSynthesize a final signal.`,
      output: Output.object({ schema: SynthesisSchema }),
    });

    const result: CouncilResult = {
      votes,
      finalRelevance: synthesis?.finalRelevance ?? 5,
      finalSentiment: synthesis?.finalSentiment ?? "neutral",
      confidence: synthesis?.confidence ?? "medium",
      synthesis: synthesis?.synthesis ?? "",
    };

    return NextResponse.json({ council: result });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Council failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
