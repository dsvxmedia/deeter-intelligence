import { NextRequest, NextResponse } from "next/server";
import { generateText, Output } from "ai";
import { z } from "zod";
import { CLAUDE_MODEL, SYSTEM_PROMPT } from "@/lib/ai-client";

const AnalysisSchema = z.object({
  executiveSummary: z.string(),
  bullCases: z.array(z.string()).length(3),
  bearCases: z.array(z.string()).length(3),
  keyRisks: z.array(z.string()),
  sentimentScore: z.number().min(1).max(10),
  sentiment: z.enum(["bullish", "bearish", "neutral"]),
});

export async function POST(req: NextRequest) {
  try {
    const { text, ticker } = await req.json();
    if (!text || text.length < 100) {
      return NextResponse.json({ error: "Text too short" }, { status: 400 });
    }

    const { output } = await generateText({
      model: CLAUDE_MODEL,
      system: SYSTEM_PROMPT,
      prompt: `Analyze this filing or document${ticker ? ` for ${ticker}` : ""}.\n\nProvide: executive summary, 3 bull cases, 3 bear cases, key risks, and a sentiment score (1=very bearish, 5=neutral, 10=very bullish).\n\nDocument:\n${text.slice(0, 8000)}`,
      output: Output.object({ schema: AnalysisSchema }),
    });

    return NextResponse.json({ analysis: output });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Analysis failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
