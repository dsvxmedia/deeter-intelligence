# Deeter Intelligence — Loom Demo Script

**Target length:** 3:30 — 4:00  
**URL:** https://deeter-intelligence.vercel.app  
**Goal:** Show the full system in action — data ingestion, AI scoring, entity graph, JARVIS, research page. Hiring manager watches once.

---

## Pre-Flight Checklist

- [ ] Open `https://deeter-intelligence.vercel.app` in Chrome
- [ ] Watchlist pre-loaded: **AAPL, NVDA, MSFT, JPM**
- [ ] Hit refresh to fetch live news — wait for articles to load before recording
- [ ] Confirm at least one article shows a "council" badge (relevance 5-7)
- [ ] Browser mic permission granted, test JARVIS mic before recording
- [ ] Chrome: hide dock, full-screen browser, clear all notification badges
- [ ] Loom: set to record full screen, HD, no countdown

---

## Scene 1 — Intro (0:00 — 0:15)

**Screen:** Dashboard loaded with articles scored  
**Say:**
> "This is Deeter Intelligence — a trading desk AI co-pilot I built as a live demo. Next.js, three live data sources, multi-LLM signal scoring, an entity knowledge graph, and a voice layer I'm calling JARVIS. Let me walk through it."

---

## Scene 2 — Live Dashboard Overview (0:15 — 1:00)

**Screen:** Main dashboard — all three panels visible  
**Do:** Point to each panel left to right  
**Say:**
> "Three panels. Left: watchlist with live Finnhub WebSocket prices — those ticks are real. Center: news feed, every article scored for relevance 1-10 and sentiment by Claude. Right: Intelligence Desk for RAG chat and JARVIS."

**Do:** Click the threshold slider, drag from 3 to 7  
**Say:**
> "The threshold slider filters noise. I'm moving it from 3 to 7 — now only high-signal items. The green scores are bullish, red are bearish, amber neutral. Articles are sorted by relevance so the most critical information is always at the top."

**Do:** Drag slider back to 3

---

## Scene 3 — LLM Council (1:00 — 1:30)

**Screen:** Find or point to an article with a "council" badge  
**Say:**
> "Articles scoring 5 to 7 — borderline relevance — go to the LLM Council. Claude, GPT-4o, and Gemini each score independently. Then they do a peer review pass on each other's scores. A Chairman model synthesizes the final verdict with a confidence level: high, medium, or low."

**Point to:** the "council" badge on the article  
**Say:**
> "This prevents one model's blind spots from reaching the desk. If all three agree, confidence is high. If they diverge, it surfaces explicitly — the trader knows the signal is contested."

---

## Scene 4 — Exposure Alert (1:30 — 1:50)

**Screen:** Dashboard — point to the exposure alert section if one fired, or explain while pointing to the news feed  
**Say:**
> "When a high-signal article — relevance 8 or above — touches something in the portfolio, the system fires an exposure alert. It traverses the entity graph, so a TSMC supply chain article can surface as NVDA exposure even if NVDA isn't in the headline. Indirect relationships, not just string matching."

---

## Scene 5 — JARVIS (1:50 — 2:30)

**Screen:** Right panel, JARVIS section visible  
**Say:**
> "Push-to-talk — same RAG corpus as the Intelligence Desk. Let me ask it something."

**Do:** Click mic button, speak clearly:  
> "What's the bear case on NVDA?"

**Wait:** For text transcript to appear, then for spoken TTS response to play  
**Say (after response):**
> "Spoken response is browser TTS — ElevenLabs in production. The system prompt is calibrated to sound like a sharp desk analyst, not an AI. Responses flag uncertainty explicitly. If the answer isn't in the corpus, JARVIS says so."

---

## Scene 6 — Intelligence Desk / RAG Chat (2:30 — 3:00)

**Screen:** Chat panel, type a question  
**Do:** Type: `What happened at the last FOMC meeting and how does it affect my positions?`  
**Wait:** For streaming response  
**Say:**
> "Thirteen documents in the RAG corpus — FOMC minutes, earnings call excerpts from AAPL, NVDA, MSFT, META, JPM, macro scenario analyses. The response includes source citations at the bottom. Every fact traces back to a document. No hallucinated data."

**Point to:** Source citation section in the response

---

## Scene 7 — Research Page (3:00 — 3:30)

**Do:** Navigate to `/research`  
**Say:**
> "Research page — two panels. EDGAR integration on the left. I'll pull real SEC filings."

**Do:** Type `AAPL` in the ticker input, click Fetch  
**Wait:** For filings to load  
**Say:**
> "Those are live from EDGAR — real filings. I can click one to load it into the analyzer, or paste any text directly."

**Do:** Click Analyze on one of the filings OR paste excerpt  
**Say:**
> "Claude returns a structured analysis: executive summary, bull case, bear case, key risks, sentiment score. Right side is the entity knowledge graph — 20 nodes, 17 edges, sector groupings, executive relationships, how each position connects to macro events."

---

## Scene 8 — Outro (3:30 — 3:45)

**Screen:** Back to main dashboard  
**Say:**
> "Everything live at deeter-intelligence.vercel.app. There's also a Python layer in the repo — pandas normalization, NumPy macro backtest, batch Claude scoring — full stack, not just the frontend. GitHub link is in the README. Happy to go deeper on any piece."

---

## Notes

- Don't rush. Let the scoring load, let JARVIS finish speaking.
- If an API call is slow, fill with natural commentary about what it's doing.
- Keep the camera off — screen only. The product is the pitch.
- If you flub a line, pause 3 seconds and restart the sentence — Loom trim handles it.
