# Submission Email

**Subject:** Head of Applied AI — live demo: deeter-intelligence

---

Hi,

You asked for a short note on how I'd architect a real-time news filter for a trading desk. I built it instead.

Live: https://deeter-intelligence.vercel.app  
Code: https://github.com/dsvxmedia/deeter-intelligence

It scores every incoming article for portfolio relevance (1-10), runs borderline signals through a three-model LLM council with chairman synthesis, traverses an entity knowledge graph to surface indirect exposure, and speaks proactive alerts for high-relevance items via a JARVIS voice layer. The Python analysis layer handles news normalization and macro scenario backtesting — `python backtest.py` runs four historical shock scenarios against a sample portfolio.

Everything in the JD is wired end-to-end and deployed.

— D. Jackson  
dsvxmedia@gmail.com
