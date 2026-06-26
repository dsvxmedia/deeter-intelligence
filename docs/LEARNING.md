# Learning Log — Deeter Intelligence Build

Ground zero to shipped. Every insight captured as we built it.

---

## Research Phase (Phase 0)

**What the research revealed:**
- Standard batch RAG fails in finance — hallucination = compliance liability. The right 2026 architecture is Agentic RAG + Knowledge Graph RAG.
- TradingAgents (89K GitHub stars) validates our multi-agent approach — bull agent, bear agent, chairman synthesis. That's exactly our LLM Council.
- Voice on the trading desk is real and shipping. Trumid "Smart Voice" launched Dec 2025 — auto-populates credit trade tickets from unstructured voice. JARVIS is not a gimmick.
- "AI bots auditioning for Wall Street are mostly losing" — augmentation beats automation. HITL is the dominant design philosophy. We built to this.

---

## Architecture Decisions

### Why AI SDK v7 gateway strings instead of direct providers

The Vercel AI SDK v7 routes plain strings like `"anthropic/claude-sonnet-4.6"` through the AI Gateway automatically. This gives us observability, failover, and cost tracking at zero code cost. Direct providers (`@ai-sdk/anthropic`) are still installed as fallback for local dev without gateway keys.

### Why generateText + Output.object instead of generateObject

`generateObject` was removed in AI SDK v6. The v7 pattern is `generateText` with `output: Output.object({ schema })`. The result is in `result.output`. This is a breaking change that the hooks caught — important to know for future AI SDK work.

### Why the LLM Council only triggers at relevance 5-7

Articles scoring 1-4 are noise — no point running a 3-model consensus on irrelevant content. Articles scoring 8-10 are clearly high-signal — one model is authoritative enough. The gray zone (5-7) is where models genuinely disagree, which is exactly where multi-model consensus adds value.

### Why cosine similarity over proper embeddings

For a demo, a TF-IDF style in-memory store is sufficient and avoids requiring an embeddings API. The architecture is designed to swap in a real embeddings model (e.g., `@ai-sdk/anthropic` embeddings) with one function change in `vector-store.ts`.

### Why Next.js 16 + Turbopack

Turbopack is the default bundler in Next.js 16. `cacheComponents: true` replaces `experimental.ppr` for Partial Prerendering. The API routes use Fluid Compute by default (300s timeout, Active CPU pricing).

---

## Stack Decisions

| Decision | Why |
|---|---|
| Framer Motion for regime transitions | AnimatePresence for state change animations; lighter than GSAP for simple state-driven transitions |
| GSAP for JARVIS waveform | GSAP's `staggerTo` and timeline control is better for the waveform bar animation |
| TailwindCSS oklch colors | oklch gives perceptually uniform color space — the bull green and bear red look equally vivid at different lightness levels |
| `server-only` not used | We don't have database connections or secrets in server components; the lib files that hit external APIs are only called from route handlers |
| Zod v4 | Installed with `"zod": "^4.4.3"` — compatible with AI SDK v7's `Output.object({ schema: zodSchema })` |

---

## Bugs Caught + Fixed

1. **generateObject removed** — AI SDK v7 uses `generateText + Output.object`. Caught by post-write validation hook. Fixed in signal, signal-council, and analyze routes.
2. **ai-client.ts using direct provider imports** — Changed to plain gateway strings (`"anthropic/claude-sonnet-4.6"`) per AI Gateway skill recommendation.
3. **globals.css shadcn/tailwind.css import** — The shadcn init adds `@import "shadcn/tailwind.css"` which must stay for component theming.

---

## Skills Used in This Build

See `docs/SKILLS.md` for the complete mapping.

---

## What We'd Add With More Time

- Real embedding model (sentence-transformers via Python API or `@ai-sdk/anthropic` embeddings) for semantic RAG
- Persistent vector store (Vercel KV or Pinecone) instead of in-memory
- Real-time WebSocket for score delivery to client (currently polling)
- Reddit/X sentiment pipeline (social-sentiment.ts stub documents the integration point)
- Authentication so Deeter can create a personalized watchlist
- Proper EDGAR full-text fetching (currently uses metadata; full document needs HTML parsing)
