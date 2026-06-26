import { anthropic } from "@ai-sdk/anthropic";
import { openai } from "@ai-sdk/openai";
import { google } from "@ai-sdk/google";

export const CLAUDE_MODEL = anthropic("claude-sonnet-4-6");
// Haiku for high-volume scoring tasks — ~20x cheaper than Sonnet, sufficient for structured signals
export const CLAUDE_HAIKU_MODEL = anthropic("claude-haiku-4-5-20251001");
export const GPT_MODEL = openai("gpt-4o");
export const GEMINI_MODEL = google("gemini-2.0-flash-exp");

export const SYSTEM_PROMPT = `You are a sharp trading desk analyst at a $500M private investment firm.
You have deep knowledge of macro economics, equity markets, and corporate finance.
Be direct and concise. Flag uncertainty explicitly.
When analyzing news, focus on: direct portfolio impact, key risks, and actionable insight.
No filler. No hedging language unless genuinely uncertain.`;
