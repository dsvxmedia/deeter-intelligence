"""
Batch sentiment scoring via Anthropic Python SDK.
Demonstrates Python AI integration per JD requirement.
"""
from __future__ import annotations

import json
import os
from dataclasses import dataclass, asdict
from typing import Literal

import anthropic
from dotenv import load_dotenv

load_dotenv()

client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY", ""))

Sentiment = Literal["bullish", "bearish", "neutral"]


@dataclass
class ScoredArticle:
    title: str
    source: str
    relevance: int
    sentiment: Sentiment
    entities: list[str]
    summary: str


SCORING_PROMPT = """You are a trading desk analyst. Score this news article.

Article: {title}
Content: {content}

Respond with JSON only:
{{
  "relevance": <1-10, where 10=critical market-moving event>,
  "sentiment": "<bullish|bearish|neutral>",
  "entities": ["<ticker1>", "<ticker2>"],
  "summary": "<1 sentence summary>"
}}"""


def score_article(title: str, content: str, source: str = "unknown") -> ScoredArticle:
    msg = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=256,
        messages=[
            {
                "role": "user",
                "content": SCORING_PROMPT.format(title=title, content=content[:2000]),
            }
        ],
    )

    text = msg.content[0].text.strip()
    if text.startswith("```"):
        text = text.split("```")[1]
        if text.startswith("json"):
            text = text[4:]

    data = json.loads(text)
    return ScoredArticle(
        title=title,
        source=source,
        relevance=int(data.get("relevance", 5)),
        sentiment=data.get("sentiment", "neutral"),
        entities=data.get("entities", []),
        summary=data.get("summary", ""),
    )


def batch_score(articles: list[dict]) -> list[ScoredArticle]:
    results = []
    for i, article in enumerate(articles):
        print(f"Scoring {i + 1}/{len(articles)}: {article['title'][:60]}…")
        try:
            scored = score_article(
                title=article.get("title", ""),
                content=article.get("content", article.get("description", "")),
                source=article.get("source", "unknown"),
            )
            results.append(scored)
        except Exception as e:
            print(f"  Error: {e}")
    return results


SAMPLE_ARTICLES = [
    {
        "title": "NVIDIA Reports Record Data Center Revenue, Blackwell Shipments Accelerating",
        "content": "NVIDIA Corporation announced record quarterly data center revenue of $30.8 billion, up 112% year-over-year. CEO Jensen Huang said Blackwell architecture shipments are accelerating ahead of schedule.",
        "source": "Reuters",
    },
    {
        "title": "Federal Reserve Minutes Signal Fewer Rate Cuts in 2025",
        "content": "Minutes from the latest Federal Open Market Committee meeting revealed that several participants believe the neutral rate may have risen, implying fewer rate cuts in 2025 than previously anticipated.",
        "source": "WSJ",
    },
    {
        "title": "Apple Intelligence Features Driving iPhone Upgrade Cycle",
        "content": "Apple's on-device AI features are creating a meaningful upgrade super-cycle according to sell-side analysts. Services revenue hit an all-time record driven by subscriptions.",
        "source": "Bloomberg",
    },
]


if __name__ == "__main__":
    print("Batch scoring sample articles with Claude...\n")
    scored = batch_score(SAMPLE_ARTICLES)

    for s in scored:
        print(f"\nTitle:     {s.title[:70]}")
        print(f"Relevance: {s.relevance}/10")
        print(f"Sentiment: {s.sentiment.upper()}")
        print(f"Entities:  {', '.join(s.entities) or 'none'}")
        print(f"Summary:   {s.summary}")

    output_file = "scored_articles.json"
    with open(output_file, "w") as f:
        json.dump([asdict(s) for s in scored], f, indent=2)
    print(f"\nSaved {len(scored)} scored articles to {output_file}")
