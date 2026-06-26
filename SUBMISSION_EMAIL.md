# Submission Email

**Subject:** Head of Applied AI — live demo: deeter-intelligence

---

Hi,

You asked for a short note on how I'd architect a real-time news filter for a trading desk. I built it instead.

Live: https://deeter-intelligence.vercel.app  
Code: https://github.com/dsvxmedia/deeter-intelligence  
Architecture: https://deeter-intelligence.vercel.app/architecture.html

A signal that gets misclassified costs real money. The hard part isn't filtering noise — it's knowing when you're uncertain. This system is built around that: a fast Claude scoring pass surfaces the clear calls, and a three-model LLM council (Claude + GPT-4o + Gemini) handles the borderline zone where a single model shouldn't be trusted. It traverses an entity knowledge graph to catch indirect exposure — a TSMC supply story surfaces your NVDA position even if the ticker never appears in the headline. JARVIS speaks proactive alerts for high-relevance items so nothing critical dies in a feed. The Python layer handles news normalization and macro scenario backtesting — `python backtest.py` runs four historical shock scenarios against a sample portfolio.

Everything in the JD is wired end-to-end and deployed.

— D. Jackson  
djackson@thelouestcompany.com
