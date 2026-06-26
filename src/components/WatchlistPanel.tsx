"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, X, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getFinnhubWS } from "@/lib/finnhub-ws";
import { getPortfolio, formatCurrency } from "@/lib/portfolio";
import { DEFAULT_WATCHLIST } from "@/data/seed-data";
import type { WatchlistItem, Quote, Position } from "@/types";

interface Props {
  onWatchlistChange?: (tickers: string[]) => void;
}

export function WatchlistPanel({ onWatchlistChange }: Props) {
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>(DEFAULT_WATCHLIST);
  const [quotes, setQuotes] = useState<Record<string, Quote>>({});
  const [positions, setPositions] = useState<Position[]>([]);
  const [addInput, setAddInput] = useState("");
  const [flashMap, setFlashMap] = useState<Record<string, "up" | "down">>({});
  const prevPrices = useRef<Record<string, number>>({});

  useEffect(() => {
    const portfolio = getPortfolio();
    setPositions(portfolio.positions);
  }, []);

  useEffect(() => {
    const tickers = watchlist.map((w) => w.ticker);
    onWatchlistChange?.(tickers);

    const ws = getFinnhubWS();
    ws.connect(tickers);

    const unsub = ws.onQuote((q) => {
      const prev = prevPrices.current[q.ticker];
      const dir = prev ? (q.price > prev ? "up" : "down") : undefined;

      setQuotes((prev) => ({ ...prev, [q.ticker]: q }));

      if (dir) {
        setFlashMap((m) => ({ ...m, [q.ticker]: dir }));
        setTimeout(() => {
          setFlashMap((m) => {
            const next = { ...m };
            delete next[q.ticker];
            return next;
          });
        }, 900);
      }

      prevPrices.current[q.ticker] = q.price;
    });

    return unsub;
  }, [watchlist, onWatchlistChange]);

  const addTicker = useCallback(() => {
    const ticker = addInput.trim().toUpperCase();
    if (!ticker || watchlist.some((w) => w.ticker === ticker)) return;
    setWatchlist((w) => [...w, { ticker, name: ticker }]);
    setAddInput("");
  }, [addInput, watchlist]);

  const removeTicker = useCallback((ticker: string) => {
    setWatchlist((w) => w.filter((x) => x.ticker !== ticker));
  }, []);

  const portfolio = getPortfolio(
    Object.fromEntries(Object.entries(quotes).map(([t, q]) => [t, q.price]))
  );

  const totalCost = portfolio.positions.reduce((sum, p) => sum + p.shares * p.avgCost, 0);
  const unrealizedPnl = portfolio.totalValue - totalCost;
  const unrealizedPct = totalCost > 0 ? (unrealizedPnl / totalCost) * 100 : 0;
  const pnlPositive = unrealizedPnl >= 0;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border flex items-center justify-between">
        <span className="text-xs font-mono text-muted-foreground uppercase tracking-widest">
          Watchlist
        </span>
        <Badge variant="outline" className="text-[10px] font-mono">
          {formatCurrency(portfolio.totalValue)}
        </Badge>
      </div>

      {/* Watchlist tickers */}
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-0.5">
          {watchlist.map((item) => {
            const q = quotes[item.ticker];
            const pos = positions.find((p) => p.ticker === item.ticker);
            const flash = flashMap[item.ticker];
            const pct = q?.pctChange ?? pos?.pctChange ?? 0;

            return (
              <div
                key={item.ticker}
                className={`group flex items-center justify-between px-2 py-2 rounded hover:bg-secondary transition-colors ${
                  flash === "up" ? "tick-up" : flash === "down" ? "tick-down" : ""
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <button
                    onClick={() => removeTicker(item.ticker)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                  >
                    <X size={10} />
                  </button>
                  <div className="min-w-0">
                    <div className="font-mono text-xs font-semibold">{item.ticker}</div>
                    <div className="text-[10px] text-muted-foreground truncate max-w-[110px]">
                      {item.name}
                    </div>
                  </div>
                </div>

                <div className="text-right flex-shrink-0">
                  <div className="font-mono text-xs tabular-nums">
                    {q?.price ? `$${q.price.toFixed(2)}` : pos?.currentPrice ? `$${pos.currentPrice.toFixed(2)}` : "---"}
                  </div>
                  <div
                    className={`font-mono text-[10px] flex items-center gap-0.5 justify-end tabular-nums ${
                      pct > 0
                        ? "text-[oklch(0.60_0.17_142)]"
                        : pct < 0
                        ? "text-destructive"
                        : "text-muted-foreground"
                    }`}
                  >
                    {pct > 0 ? (
                      <TrendingUp size={9} />
                    ) : pct < 0 ? (
                      <TrendingDown size={9} />
                    ) : (
                      <Minus size={9} />
                    )}
                    {pct !== 0 ? `${Math.abs(pct).toFixed(2)}%` : "—"}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>

      {/* Portfolio P&L section */}
      <div className="border-t border-border">
        <div className="px-4 py-2 flex items-center justify-between">
          <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">
            Portfolio
          </span>
          <AnimatePresence mode="wait">
            <motion.div
              key={`${Math.round(unrealizedPnl)}-${pnlPositive}`}
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              transition={{ duration: 0.18 }}
              className="text-[10px] font-mono tabular-nums flex items-center gap-1"
              style={{ color: pnlPositive ? "oklch(0.60 0.17 142)" : "oklch(0.58 0.22 25)" }}
            >
              {pnlPositive ? <TrendingUp size={9} /> : <TrendingDown size={9} />}
              {pnlPositive ? "+" : ""}{formatCurrency(unrealizedPnl)} ({unrealizedPct >= 0 ? "+" : ""}{unrealizedPct.toFixed(1)}%)
            </motion.div>
          </AnimatePresence>
        </div>
        <div className="px-2 pb-2 space-y-0.5 max-h-28 overflow-y-auto">
          {portfolio.positions.map((p) => {
            const positionValue = p.shares * (p.currentPrice ?? p.avgCost);
            const positionPnl = positionValue - p.shares * p.avgCost;
            const posPositive = positionPnl >= 0;
            return (
              <div key={p.ticker} className="flex items-center justify-between px-2 py-1 rounded hover:bg-secondary/50 transition-colors">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="font-mono text-[10px] font-semibold w-10 flex-shrink-0">{p.ticker}</span>
                  <span className="text-[9px] text-muted-foreground tabular-nums">{p.shares.toLocaleString()} sh</span>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="font-mono text-[10px] tabular-nums">{formatCurrency(positionValue)}</div>
                  <div
                    className="font-mono text-[9px] tabular-nums"
                    style={{ color: posPositive ? "oklch(0.60 0.17 142)" : "oklch(0.58 0.22 25)" }}
                  >
                    {posPositive ? "+" : ""}{formatCurrency(positionPnl)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Add ticker */}
      <div className="p-3 border-t border-border">
        <div className="flex gap-1.5">
          <Input
            value={addInput}
            onChange={(e) => setAddInput(e.target.value.toUpperCase())}
            onKeyDown={(e) => e.key === "Enter" && addTicker()}
            placeholder="Add ticker…"
            className="h-7 text-xs font-mono bg-secondary border-border"
            maxLength={6}
          />
          <button
            onClick={addTicker}
            className="flex-shrink-0 w-7 h-7 flex items-center justify-center rounded bg-secondary hover:bg-accent hover:text-accent-foreground transition-colors"
          >
            <Plus size={13} />
          </button>
        </div>
      </div>
    </div>
  );
}
