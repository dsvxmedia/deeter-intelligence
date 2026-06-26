# Deeter Intelligence

**Live demo:** https://deeter-intelligence.vercel.app &nbsp;·&nbsp; **GitHub:** https://github.com/dsvxmedia/deeter-intelligence

---

## The question you asked

> *"How would you architect a real-time news filter for a trading desk?"*

Here's that answer — running, deployed, and doing it live.

---

## What it is

A trading desk AI co-pilot built for a $500M private investment firm. It watches the news, scores every article for portfolio relevance, flags what your analysts need to see, and answers questions about your positions while you're on the phone.

The pitch: instead of a Bloomberg terminal that shows you everything and makes you decide what matters, this one decides what matters and only surfaces what does.

---

## The five things from your JD

| What you asked for | What's built |
|---|---|
| **Kill the F5 key** — info pipelines | NewsAPI feed + Finnhub WebSocket quotes. Auto-refreshes every 90s, live price ticks on every position |
| **Live analyst on the desk** | Streaming RAG chat grounded in earnings transcripts, FOMC minutes, and macro scenarios. Sources cited on every response |
| **Protect attention** | Multi-LLM signal scoring (Claude + GPT + Gemini). Relevance 1-10. Noise threshold slider. Entity → exposure alerts. Regime indicator |
| **Own the stack** | Entity knowledge graph, in-memory vector store, Python pipeline, all APIs wired end-to-end on Vercel |
| **Iron Man suit** | JARVIS — push-to-talk voice commands, proactive spoken alerts for relevance ≥9 signals |

---

## How the news filter actually works

```
Article arrives from NewsAPI
  ↓
Claude fast-path: relevance 1-10 + sentiment + entity extraction (~400ms)
  ↓ if score 5-7 (borderline)
LLM Council: Claude + GPT-4o + Gemini each vote independently
  → Chairman synthesis: final score + confidence level
  ↓
Entity Knowledge Graph: article entities → portfolio traversal
  → "TSMC supply constraint" → surfaces NVDA and AAPL exposure
  ↓
Exposure Alert: if relevance ≥8 + matched position → "$2.4M exposure (18%)"
  ↓
Regime Engine: aggregate portfolio-weighted sentiment → RISK-ON / RISK-OFF / UNCERTAIN
```

The 5-7 borderline zone is where the system earns its keep. Score 1-4 is noise, 8-10 is obvious. A 6 from three disagreeing models with a chairman synthesis is a different signal than a unanimous 6 — and the trader sees that distinction.

---

## Why the LLM Council

Most implementations use one model and trust it. The problem: a 6 from Claude might be a 4 from GPT and an 8 from Gemini. That disagreement *is the signal*. High-confidence consensus (all three agree) is treated differently from contested scores. This is directly inspired by the TradingAgents paper's bull/bear/chairman validation pattern.

---

## Why the entity graph instead of string matching

Naive matching catches "NVDA" in a headline. The entity graph catches that a TSMC capacity story is a direct NVDA supply chain risk even if the word "NVDA" never appears. The graph traverses supplier→customer, CEO→company, and sector relationships to surface non-obvious exposure.

---

## Architecture

```
DATA LAYER
  NewsAPI (REST, 90s refresh)
  Finnhub WebSocket (live price ticks)
  SEC EDGAR (10-K/10-Q/8-K filings, free)

AI LAYER  
  Claude claude-sonnet-4-6 — signal scoring, RAG chat, filing analysis
  GPT-4o + Gemini — LLM Council votes
  In-memory TF-IDF + cosine similarity — RAG retrieval (swap to Pinecone in prod)
  Entity Knowledge Graph — indirect exposure traversal

INTERFACE
  News Feed — scored, filtered, threshold-controlled
  Intelligence Desk — streaming chat with source citations
  JARVIS — push-to-talk voice, proactive spoken alerts
  Research — SEC filing analyzer + entity graph visualization
  Portfolio — live P&L, per-position exposure, regime indicator
```

---

## Python answers "Python is non-negotiable"

```bash
cd analysis && pip install -r requirements.txt

python news_pipeline.py      # pandas: fetch → normalize → deduplicate
python backtest.py           # numpy: 4 macro scenarios × 9 asset classes
python sentiment_score.py    # Anthropic SDK: batch article scoring
```

Backtest covers 2022 hiking cycle, COVID 2020, 2023 debt ceiling, 2015-18 normalization. Every number is real.

---

## Production upgrade path

This is a demo. The interfaces are designed so the upgrades are drop-ins:

| Demo | Production swap |
|---|---|
| TF-IDF cosine similarity | `simpleEmbed()` in `vector-store.ts` → real embeddings call |
| In-memory vector store | Same `store.search()` interface → Pinecone or Vercel KV |
| NewsAPI (100 req/day) | Bloomberg/Refinitiv feed, same pipeline |
| Mock portfolio positions | Brokerage API, same `Portfolio` type |
| Browser TTS fallback | ElevenLabs key → `lib/tts.ts` handles both |

---

## Stack

Next.js 16 · TypeScript · Python · AI SDK v7 · shadcn/ui · Tailwind v4 · Framer Motion · Fira Code

Providers: Anthropic (direct) · OpenAI · Google · NewsAPI · Finnhub · SEC EDGAR

---

## Run it yourself

```bash
git clone https://github.com/dsvxmedia/deeter-intelligence
cd deeter-intelligence
npm install
cp .env.local.example .env.local   # fill in ANTHROPIC_API_KEY, NEWSAPI_KEY, FINNHUB key
npm run dev
```

Open http://localhost:3000. Add tickers to the watchlist, click the refresh button in the news feed, ask the chat anything.

---

*Built by [@dsvxmedia](https://github.com/dsvxmedia) as a submission for Head of Applied AI & Trading Systems at Deeter Analytics.*
