# Deeter Intelligence

> Real-time AI co-pilot for trading desks. Live news signals, multi-model consensus scoring, RAG chat, SEC EDGAR integration, and JARVIS voice interface — built as a live application for the Head of Applied AI & Trading Systems role at Deeter Analytics.

**Live demo:** https://deeter-intelligence.vercel.app  
**GitHub:** https://github.com/dsvxmedia/deeter-intelligence

---

## What This Is

The Deeter Analytics JD asks candidates to submit "a short note on how you would architect a real-time news filter for a trading desk." This is the note — but working, deployed, and demonstrating every system described in the JD.

| JD Mandate | Feature |
|---|---|
| Kill the F5 key | Live news pipeline + Finnhub WebSocket quotes, auto-refreshes every 90s |
| Live analyst on the desk | Streaming RAG chat grounded in earnings transcripts, FOMC minutes, macro scenarios |
| Protect attention | Multi-LLM signal scoring, relevance threshold slider, entity → exposure alerts, regime indicator |
| Own the stack | Knowledge graph, vector store, Python pipeline, all APIs wired end-to-end |
| Iron Man suit | JARVIS — push-to-talk voice commands, proactive spoken alerts for relevance ≥9 signals |

---

## Architecture

```
NewsAPI → SEC EDGAR → Finnhub WS
  ↓
Claude fast-path scoring (relevance + sentiment)
  ↓ borderline 5-7 only
LLM Council (Claude + GPT-5.4 + Gemini → chairman synthesis)
  ↓
Entity Knowledge Graph (ticker/executive/event traversal)
  ↓
Portfolio Exposure Alerts + Regime Engine (RISK-ON / RISK-OFF / UNCERTAIN)
  ↓
Trader Interface: News Feed | Chat (RAG) | JARVIS Voice
```

### LLM Council — why it exists

Articles scoring 1-4 are noise. Articles scoring 8-10 are clearly signal. The 5-7 zone is where models genuinely disagree — that's where we run a parallel 3-model vote and a chairman synthesis pass. Inspired by TradingAgents, which validated bull/bear/chairman patterns at scale.

### Knowledge Graph — why not just string matching

Naive ticker matching misses that a TSMC supply constraint item is a direct risk to NVDA and AAPL positions. The entity graph traverses edges (supplier → customer, CEO → ticker) and surfaces indirect exposure.

---

## Tech Stack

| Layer | Tech |
|---|---|
| Framework | Next.js 16, App Router, Turbopack |
| Language | TypeScript + Python |
| UI | shadcn/ui v4 (Base UI), Tailwind v4, Framer Motion 12 |
| AI | AI SDK v7, direct providers (Anthropic / OpenAI / Google) |
| Signals | LLM Council: Claude + GPT-5.4 + Gemini parallel vote |
| Knowledge | TF-IDF cosine similarity RAG, entity knowledge graph |
| Data | NewsAPI, Finnhub WebSocket (live quotes), SEC EDGAR (free) |
| Voice | Web Speech API input + ElevenLabs / SpeechSynthesis output |
| Python | pandas normalization, numpy backtest, Anthropic Python SDK |

---

## Quick Start

```bash
git clone https://github.com/dsvxmedia/deeter-intelligence
cd deeter-intelligence
npm install
cp .env.local.example .env.local
# Add API keys (see below)
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Required keys

```env
ANTHROPIC_API_KEY=           # Claude signal scoring and RAG
NEWSAPI_KEY=                  # Live news pipeline (free tier: 100 req/day)
NEXT_PUBLIC_FINNHUB_API_KEY=  # Finnhub WebSocket live quotes (free tier)
```

### Optional keys (degrade gracefully without them)

```env
ELEVENLABS_API_KEY=           # JARVIS voice quality (falls back to browser TTS)
OPENAI_API_KEY=               # LLM Council GPT vote
GOOGLE_GENERATIVE_AI_API_KEY= # LLM Council Gemini vote
```

---

## Python Layer

Answers "Python is non-negotiable" from the JD directly:

```bash
cd analysis
pip install -r requirements.txt

python news_pipeline.py       # pandas: fetch → normalize → deduplicate
python backtest.py            # numpy: macro scenario return analysis (4 scenarios)
python sentiment_score.py     # Anthropic SDK: batch article scoring
```

**Backtest scenarios:** 2022 hiking cycle, COVID 2020 drawdown, 2023 debt ceiling, 2015-18 normalization.

---

## Project Structure

```
src/
├── app/
│   ├── page.tsx                    # 3-column Bloomberg terminal dashboard
│   ├── research/page.tsx           # Filing analyzer + entity graph viz
│   └── api/                        # 6 route handlers
├── components/                     # 8 UI components
├── lib/                            # 10 library modules
├── data/seed-data.ts               # 10 seed docs: earnings, FOMC, macro
└── types/index.ts                  # All TypeScript types
analysis/                           # Python data pipeline
docs/
├── ARCHITECTURE.md                 # Full ASCII diagram + component map
├── SKILLS.md                       # 30 skills used, 11 discarded
└── LEARNING.md                     # Research findings, bugs caught, decisions
```

---

## What "Production Grade" Means Here

This is a demo, but every production concern is documented:

| Concern | Demo | Production upgrade path |
|---|---|---|
| Vector search | TF-IDF cosine similarity | Swap `simpleEmbed()` in `vector-store.ts` for a real embeddings call |
| Persistence | In-memory (resets on deploy) | Vercel KV or Pinecone, same `store.search()` interface |
| RAG hallucination | Source citations on every response | + confidence scores, retrieval audit log |
| LLM Council failure | `allSettled` — exclude failing models | + retry with exponential backoff |
| WebSocket reconnect | Auto-reconnect, 5s delay | + circuit breaker, exponential backoff |

---

## JARVIS Voice Flow

```
Hold mic button
  → Web Speech API captures audio, interim transcript displayed
  → onend fires → transcript → /api/chat via streaming
  → Claude responds with portfolio + news RAG context
  → ElevenLabs or browser SpeechSynthesis reads response aloud

Proactive: article relevance ≥9 → onHighSignal() → JARVIS speaks alert automatically
```

---

*Built by [@dsvxmedia](https://github.com/dsvxmedia)*
