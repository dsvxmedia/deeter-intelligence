# Architecture — Deeter Intelligence

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    DEETER INTELLIGENCE                           │
│                     "The Iron Man Suit"                          │
└─────────────────────────────────────────────────────────────────┘

DATA INGESTION LAYER
┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────┐
│  NewsAPI     │  │ SEC EDGAR    │  │ Finnhub WS   │  │ Social * │
│  REST poll   │  │ REST (free)  │  │ WebSocket    │  │  stub    │
└──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └────┬─────┘
       └──────────────────┴──────────────────┴──────────────┘
                                   │
                    ───────────────▼───────────────
                         AI SCORING ENGINE
                    Fast path: Claude (relevance + sentiment)
                    Council path: Claude + GPT-5.4 + Gemini
                         (borderline signals 5-7, peer review)
                    ───────────────┬───────────────
                                   │
              ┌────────────────────┼─────────────────────┐
              │                    │                     │
       ENTITY GRAPH           PORTFOLIO ENGINE      REGIME ENGINE
     (graphify-powered)       exposure mapping      aggregate sentiment
     ticker relationships     position alerts       → RISK-ON/OFF
              │                    │                     │
              └────────────────────┴─────────────────────┘
                                   │
                         ──────────▼──────────
                              TRADER INTERFACE
                         News Feed | Chat | Voice
                                   │
                          ┌────────┴────────┐
                          │                 │
                        TYPE              SPEAK
                      (ChatDesk)        (JARVIS)
                                          │
                                   Human Decision

* Social: architectural stub (Reddit/X integration point)
```

## Component Map

| Layer | File | Purpose |
|---|---|---|
| Data | `lib/news-client.ts` | NewsAPI REST wrapper, 90s poll |
| Data | `lib/finnhub-ws.ts` | Finnhub WebSocket, singleton, auto-reconnect |
| Data | `lib/edgar-client.ts` | SEC EDGAR filing search + retrieval |
| AI | `app/api/signal/route.ts` | Fast path: Claude structured scoring |
| AI | `app/api/signal-council/route.ts` | Council: 3-model parallel vote + chairman synthesis |
| AI | `app/api/chat/route.ts` | Streaming RAG chat with source citations |
| AI | `app/api/analyze/route.ts` | Document analysis: bull/bear/risk |
| Knowledge | `lib/vector-store.ts` | TF-IDF in-memory RAG, cosine similarity |
| Knowledge | `lib/entity-graph.ts` | Entity knowledge graph, indirect relationship traversal |
| Portfolio | `lib/portfolio.ts` | Mock positions, exposure calculation |
| Regime | `lib/regime.ts` | 2-hour sentiment aggregation → RISK-ON/OFF/UNCERTAIN |
| Voice | `lib/tts.ts` | ElevenLabs + browser SpeechSynthesis unified interface |
| UI | `components/WatchlistPanel.tsx` | Tickers, live prices, GSAP tick flash |
| UI | `components/NewsFeed.tsx` | Scored articles, regime, exposure alerts, signal bars |
| UI | `components/RegimeIndicator.tsx` | Animated regime state badge |
| UI | `components/ChatDesk.tsx` | AI SDK v7 streaming chat |
| UI | `components/JarvisVoice.tsx` | Web Speech API + waveform + proactive alerts |
| UI | `components/FilingAnalyzer.tsx` | EDGAR integration + AI analysis |
| Pages | `app/page.tsx` | 3-column dashboard |
| Pages | `app/research/page.tsx` | Filing analyzer + entity graph viz |
| Python | `analysis/news_pipeline.py` | Pandas normalization + dedup |
| Python | `analysis/backtest.py` | Numpy macro scenario returns |
| Python | `analysis/sentiment_score.py` | Anthropic Python SDK batch scoring |

## LLM Council Detail

Articles scoring 5-7 on first pass (borderline signal) go to a 3-model consensus:

1. **Stage 1 — Independent votes**: Claude, GPT-5.4, and Gemini each score independently in parallel (`Promise.allSettled`)
2. **Stage 2 — Peer review**: Each model's vote is shared with the chairman
3. **Stage 3 — Chairman synthesis**: Claude synthesizes votes → final score + confidence level

If any council member fails (API down, timeout), it's excluded from synthesis via `allSettled`. If all fail, fallback to the fast-path score.

## Signal Tier Rendering

| Relevance | Visual treatment |
|---|---|
| 8-10 | `signal-high` — green left border, green tinted background |
| 5-7 | `signal-mid` — amber left border |
| 1-4 | `signal-low` — 40% opacity (filtered by default slider threshold) |

## RAG Architecture

Seed corpus: 5 earnings transcripts, 3 sell-side notes, 2 FOMC minutes, 3 macro scenario histories.

Live news is added to the store on fetch (`addNewsToStore`), making it queryable by the chat assistant in real time.

Retrieval is TF-IDF cosine similarity (demo-appropriate). Production upgrade path: swap `simpleEmbed()` with a real embedding model call.

## JARVIS Voice Flow

```
User holds mic button
  ↓
Web Speech API captures audio → interim transcript displayed
  ↓
onend fires → transcript sent to /api/chat via ChatDesk.sendMessage()
  ↓
Claude streams response back
  ↓
tts.speak() reads response chunk-by-chunk via ElevenLabs or browser SpeechSynthesis
  ↓
JarvisVoice shows "SPEAKING" state with amber waveform
```

Proactive alerts: when `NewsFeed` scores an article relevance ≥ 9, it calls `onHighSignal(article)`. The Dashboard passes this to `JarvisVoice` via `pendingAlert` prop, which speaks a summary automatically.
