"""
News pipeline: fetch, normalize, and deduplicate articles using pandas.
Demonstrates the Python data engineering layer required by the JD.
"""
from __future__ import annotations

import hashlib
import os
from datetime import datetime, timedelta, timezone

import pandas as pd
import requests
from dotenv import load_dotenv

load_dotenv()

NEWSAPI_KEY = os.getenv("NEWSAPI_KEY", "")
BASE_URL = "https://newsapi.org/v2/everything"


def fetch_articles(tickers: list[str], hours_back: int = 24) -> pd.DataFrame:
    if not NEWSAPI_KEY:
        raise ValueError("NEWSAPI_KEY not set in .env")

    since = (datetime.now(timezone.utc) - timedelta(hours=hours_back)).strftime("%Y-%m-%dT%H:%M:%SZ")
    query = " OR ".join(tickers)

    resp = requests.get(
        BASE_URL,
        params={
            "q": query,
            "from": since,
            "sortBy": "publishedAt",
            "language": "en",
            "pageSize": 50,
            "apiKey": NEWSAPI_KEY,
        },
        timeout=15,
    )
    resp.raise_for_status()
    data = resp.json()

    if data.get("status") != "ok":
        raise RuntimeError(f"NewsAPI error: {data.get('message')}")

    articles = data.get("articles", [])
    return pd.DataFrame(articles)


def normalize(df: pd.DataFrame) -> pd.DataFrame:
    if df.empty:
        return df

    df = df.copy()
    df["source_name"] = df["source"].apply(lambda s: s.get("name", "Unknown") if isinstance(s, dict) else str(s))
    df = df.drop(columns=["source"], errors="ignore")
    df["publishedAt"] = pd.to_datetime(df["publishedAt"], utc=True, errors="coerce")
    df["title"] = df["title"].fillna("").str.strip()
    df["description"] = df["description"].fillna("").str.strip()
    df["content"] = df["content"].fillna("").str.strip()
    df["full_text"] = df["title"] + " " + df["description"]
    df = df.dropna(subset=["title"])
    df = df[df["title"].str.len() > 10]
    return df.reset_index(drop=True)


def deduplicate(df: pd.DataFrame, similarity_threshold: float = 0.85) -> pd.DataFrame:
    if df.empty:
        return df

    def _fingerprint(text: str) -> str:
        words = sorted(set(text.lower().split()))[:20]
        return hashlib.md5(" ".join(words).encode()).hexdigest()

    df = df.copy()
    df["fingerprint"] = df["title"].apply(_fingerprint)
    df = df.drop_duplicates(subset=["fingerprint"])
    df = df.drop(columns=["fingerprint"])
    return df.reset_index(drop=True)


def run_pipeline(tickers: list[str]) -> pd.DataFrame:
    print(f"Fetching news for: {tickers}")
    raw = fetch_articles(tickers)
    print(f"Fetched {len(raw)} raw articles")

    normalized = normalize(raw)
    print(f"Normalized to {len(normalized)} articles")

    deduped = deduplicate(normalized)
    print(f"After dedup: {len(deduped)} articles")

    return deduped


if __name__ == "__main__":
    tickers = ["NVDA", "AAPL", "MSFT", "META", "JPM"]
    df = run_pipeline(tickers)
    print("\nSample output:")
    print(df[["title", "source_name", "publishedAt"]].head(10).to_string(index=False))
    df.to_csv("news_output.csv", index=False)
    print(f"\nSaved {len(df)} articles to news_output.csv")
