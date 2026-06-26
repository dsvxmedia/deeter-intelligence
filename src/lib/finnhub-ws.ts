"use client";

import type { Quote } from "@/types";

type QuoteHandler = (quote: Quote) => void;

class FinnhubWebSocket {
  private ws: WebSocket | null = null;
  private handlers: Set<QuoteHandler> = new Set();
  private subscribed: Set<string> = new Set();
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;

  connect(tickers: string[]): void {
    const key = process.env.NEXT_PUBLIC_FINNHUB_API_KEY;
    if (!key || typeof window === "undefined") return;

    if (this.ws?.readyState === WebSocket.OPEN) {
      this.updateSubscriptions(tickers);
      return;
    }

    this.ws = new WebSocket(`wss://ws.finnhub.io?token=${key}`);

    this.ws.onopen = () => {
      tickers.forEach((t) => this.subscribe(t));
    };

    this.ws.onmessage = (evt) => {
      try {
        const msg = JSON.parse(evt.data);
        if (msg.type === "trade" && Array.isArray(msg.data)) {
          for (const trade of msg.data) {
            this.handlers.forEach((h) =>
              h({ ticker: trade.s, price: trade.p, pctChange: 0, timestamp: trade.t })
            );
          }
        }
      } catch {}
    };

    this.ws.onclose = () => {
      this.reconnectTimer = setTimeout(() => this.connect(Array.from(this.subscribed)), 5000);
    };

    this.ws.onerror = () => this.ws?.close();
  }

  private subscribe(ticker: string): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: "subscribe", symbol: ticker }));
      this.subscribed.add(ticker);
    }
  }

  private updateSubscriptions(tickers: string[]): void {
    tickers.filter((t) => !this.subscribed.has(t)).forEach((t) => this.subscribe(t));
  }

  onQuote(handler: QuoteHandler): () => void {
    this.handlers.add(handler);
    return () => this.handlers.delete(handler);
  }

  disconnect(): void {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.ws?.close();
    this.ws = null;
    this.subscribed.clear();
  }
}

let instance: FinnhubWebSocket | null = null;

export function getFinnhubWS(): FinnhubWebSocket {
  if (!instance) instance = new FinnhubWebSocket();
  return instance;
}
