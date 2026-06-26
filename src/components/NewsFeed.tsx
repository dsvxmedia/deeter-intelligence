"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ExternalLink, RefreshCw, Sliders, Users } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { computeRegime } from "@/lib/regime";
import { checkExposure, getPortfolio } from "@/lib/portfolio";
import { ExposureAlert } from "@/components/ExposureAlert";
import { RegimeIndicator } from "@/components/RegimeIndicator";
import { SignalBar } from "@/components/SignalBar";
import type { ScoredArticle, ExposureAlert as ExposureAlertType, RegimeScore, SignalBarData } from "@/types";

// Cost controls:
// - 8 articles per fetch (was 15)
// - 5-minute auto-refresh (was 90s)
// - Article cache: never re-score an already-scored article
// - Council is manual-only (button on article), not automatic
const MAX_ARTICLES = 8;
const REFRESH_INTERVAL_MS = 5 * 60 * 1000;

interface Props {
  tickers: string[];
  onHighSignal?: (article: ScoredArticle) => void;
}

const SENTIMENT_COLORS = {
  bullish: "oklch(0.60 0.17 142)",
  bearish: "oklch(0.58 0.22 25)",
  neutral: "oklch(0.78 0.18 85)",
};

function ArticleSkeleton() {
  return (
    <div className="px-3 py-2.5 border-b border-border/50 animate-pulse">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 space-y-1.5">
          <div className="h-2.5 rounded bg-secondary w-4/5" />
          <div className="h-2 rounded bg-secondary w-3/5" />
        </div>
        <div className="w-5 h-5 rounded bg-secondary flex-shrink-0" />
      </div>
      <div className="flex items-center gap-2 mt-2">
        <div className="h-2 rounded bg-secondary w-10" />
        <div className="h-2 rounded bg-secondary w-8" />
        <div className="h-3.5 rounded bg-secondary w-9" />
        <div className="h-3.5 rounded bg-secondary w-9" />
      </div>
    </div>
  );
}

function ArticleCard({
  article,
  onRequestCouncil,
}: {
  article: ScoredArticle;
  onRequestCouncil?: () => void;
}) {
  const [councilLoading, setCouncilLoading] = useState(false);
  const tierClass =
    article.relevance >= 8
      ? "signal-high"
      : article.relevance >= 5
      ? "signal-mid"
      : "signal-low";

  const handleCouncil = async () => {
    if (!onRequestCouncil || councilLoading) return;
    setCouncilLoading(true);
    try {
      await onRequestCouncil();
    } finally {
      setCouncilLoading(false);
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, height: 0, overflow: "hidden", paddingTop: 0, paddingBottom: 0 }}
      transition={{ duration: 0.22, ease: "easeOut" }}
      className={`px-3 py-2.5 border-b border-border/50 ${tierClass}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <a
            href={article.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[11px] font-medium leading-snug hover:text-primary transition-colors line-clamp-2 flex items-start gap-1"
          >
            {article.title}
            <ExternalLink size={8} className="flex-shrink-0 mt-0.5 text-muted-foreground" />
          </a>
          {article.summary && (
            <p className="text-[10px] text-muted-foreground mt-1 line-clamp-1">
              {article.summary}
            </p>
          )}
        </div>
        <div className="flex flex-col items-end gap-1 flex-shrink-0">
          <div
            className="w-5 h-5 rounded text-[9px] font-mono font-bold flex items-center justify-center"
            style={{
              background: `${SENTIMENT_COLORS[article.sentiment]}20`,
              color: SENTIMENT_COLORS[article.sentiment],
            }}
          >
            {article.relevance}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2 mt-1.5">
        <span className="text-[9px] text-muted-foreground">{article.source}</span>
        <span className="text-[9px] text-muted-foreground">·</span>
        <span className="text-[9px] text-muted-foreground">
          {new Date(article.publishedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </span>
        {article.entities.slice(0, 3).map((e) => (
          <Badge
            key={e}
            variant="outline"
            className="text-[9px] py-0 px-1 h-4 font-mono"
          >
            {e}
          </Badge>
        ))}
        {article.councilConfidence ? (
          <Badge
            variant="outline"
            className="text-[9px] py-0 px-1 h-4"
            style={{ borderColor: "oklch(0.55 0.15 260 / 0.4)", color: "oklch(0.65 0.12 260)" }}
          >
            council · {article.councilConfidence}
          </Badge>
        ) : onRequestCouncil ? (
          <Tooltip>
            <TooltipTrigger
              onClick={handleCouncil}
              disabled={councilLoading}
              className="flex items-center gap-0.5 text-[9px] text-muted-foreground hover:text-foreground transition-colors disabled:opacity-40"
            >
              <Users size={9} className={councilLoading ? "animate-pulse" : ""} />
              {councilLoading ? "…" : "council"}
            </TooltipTrigger>
            <TooltipContent side="bottom">Run 3-model consensus on this signal</TooltipContent>
          </Tooltip>
        ) : null}
      </div>
    </motion.div>
  );
}

export function NewsFeed({ tickers, onHighSignal }: Props) {
  const [articles, setArticles] = useState<ScoredArticle[]>([]);
  const [loading, setLoading] = useState(false);
  const [threshold, setThreshold] = useState(3);
  const [alerts, setAlerts] = useState<ExposureAlertType[]>([]);
  const [regime, setRegime] = useState<RegimeScore | null>(null);
  const [signalBars, setSignalBars] = useState<SignalBarData[]>([]);
  const [showFilter, setShowFilter] = useState(false);
  // Persistent cache: articleId → scored result. Survives re-renders, cleared on unmount.
  const scoreCache = useRef<Map<string, ScoredArticle>>(new Map());

  const computeSignalBars = useCallback((scored: ScoredArticle[]) => {
    const byTicker = new Map<string, ScoredArticle[]>();
    for (const a of scored) {
      for (const e of a.entities) {
        if (tickers.includes(e)) {
          const existing = byTicker.get(e) ?? [];
          byTicker.set(e, [...existing, a]);
        }
      }
    }
    return tickers
      .filter((t) => byTicker.has(t))
      .map((t) => {
        const arts = byTicker.get(t)!;
        return {
          ticker: t,
          bullCount: arts.filter((a) => a.sentiment === "bullish").length,
          bearCount: arts.filter((a) => a.sentiment === "bearish").length,
          neutralCount: arts.filter((a) => a.sentiment === "neutral").length,
          avgRelevance: arts.reduce((s, a) => s + a.relevance, 0) / arts.length,
        };
      });
  }, [tickers]);

  const scoreArticle = useCallback(
    async (article: import("@/types").Article): Promise<ScoredArticle> => {
      // Return cached result — never call the API twice for the same article
      const cached = scoreCache.current.get(article.id);
      if (cached) return cached;

      const res = await fetch("/api/signal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ article, tickers }),
      });

      if (!res.ok) throw new Error("Scoring failed");
      const data = await res.json();
      const result = data.signal as ScoredArticle;

      scoreCache.current.set(article.id, result);
      return result;
    },
    [tickers]
  );

  const requestCouncil = useCallback(
    async (article: ScoredArticle) => {
      const res = await fetch("/api/signal-council", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ article, tickers }),
      });
      if (!res.ok) return;
      const data = await res.json();
      if (!data.council) return;

      const upgraded: ScoredArticle = {
        ...article,
        relevance: data.council.finalRelevance,
        sentiment: data.council.finalSentiment,
        summary: data.council.synthesis,
        councilScore: data.council.finalRelevance,
        councilConfidence: data.council.confidence,
      };

      scoreCache.current.set(article.id, upgraded);
      setArticles((prev) =>
        prev.map((a) => (a.id === article.id ? upgraded : a))
      );
    },
    [tickers]
  );

  const fetchAndScore = useCallback(async () => {
    if (tickers.length === 0) return;
    setLoading(true);
    try {
      const res = await fetch("/api/news", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tickers }),
      });
      if (!res.ok) throw new Error("News fetch failed");
      const { articles: raw } = await res.json();

      const scored = await Promise.allSettled(
        raw.slice(0, MAX_ARTICLES).map((a: import("@/types").Article) => scoreArticle(a))
      );

      const successful = scored
        .filter((r): r is PromiseFulfilledResult<ScoredArticle> => r.status === "fulfilled")
        .map((r) => r.value)
        .sort((a, b) => b.relevance - a.relevance);

      setArticles(successful);
      setRegime(computeRegime(successful));
      setSignalBars(computeSignalBars(successful));

      const portfolio = getPortfolio();
      const newAlerts: ExposureAlertType[] = [];
      for (const a of successful) {
        const alert = checkExposure(a, portfolio);
        if (alert && !newAlerts.some((ex) => ex.ticker === alert.ticker)) {
          newAlerts.push(alert);
        }
      }
      setAlerts(newAlerts);

      for (const a of successful) {
        if (a.relevance >= 9) onHighSignal?.(a);
      }
    } catch (err) {
      console.error("NewsFeed error:", err);
    } finally {
      setLoading(false);
    }
  }, [tickers, scoreArticle, computeSignalBars, onHighSignal]);

  const fetchAndScoreRef = useRef(fetchAndScore);
  useEffect(() => { fetchAndScoreRef.current = fetchAndScore; }, [fetchAndScore]);

  const tickersKey = tickers.join(",");
  useEffect(() => {
    if (!tickersKey) return;
    fetchAndScoreRef.current();
    const interval = setInterval(() => fetchAndScoreRef.current(), REFRESH_INTERVAL_MS);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tickersKey]);

  const filtered = articles.filter((a) => a.relevance >= threshold);

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b border-border flex items-center justify-between gap-2">
        <span className="text-xs font-mono text-muted-foreground uppercase tracking-widest flex-shrink-0">
          News Feed
        </span>
        <div className="flex-1 min-w-0">
          <RegimeIndicator regime={regime} />
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <Tooltip>
            <TooltipTrigger
              onClick={() => setShowFilter((v) => !v)}
              className="w-6 h-6 flex items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            >
              <Sliders size={12} />
            </TooltipTrigger>
            <TooltipContent side="bottom">Signal threshold</TooltipContent>
          </Tooltip>
          <button
            onClick={fetchAndScore}
            disabled={loading}
            className="w-6 h-6 flex items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors disabled:opacity-40"
          >
            <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {showFilter && (
        <div className="px-4 py-2 border-b border-border bg-secondary/30 flex items-center gap-3">
          <span className="text-[10px] font-mono text-muted-foreground">Min signal</span>
          <Slider
            value={[threshold]}
            onValueChange={(v) => setThreshold(Array.isArray(v) ? v[0] : (v as number))}
            min={1}
            max={9}
            step={1}
            className="flex-1"
          />
          <span className="text-[10px] font-mono w-4">{threshold}</span>
        </div>
      )}

      {alerts.length > 0 && (
        <div className="px-3 py-2 border-b border-border">
          <ExposureAlert
            alerts={alerts}
            onDismiss={(ticker) =>
              setAlerts((prev) => prev.filter((a) => a.ticker !== ticker))
            }
          />
        </div>
      )}

      {signalBars.length > 0 && (
        <div className="px-3 py-2 border-b border-border">
          <SignalBar data={signalBars} />
        </div>
      )}

      <ScrollArea className="flex-1">
        {loading && articles.length === 0 ? (
          <div>
            {Array.from({ length: 5 }).map((_, i) => <ArticleSkeleton key={i} />)}
          </div>
        ) : filtered.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center justify-center h-32 text-[11px] text-muted-foreground"
          >
            No articles above threshold
          </motion.div>
        ) : (
          <AnimatePresence mode="popLayout" initial={false}>
            {filtered.map((a) => (
              <ArticleCard
                key={a.id}
                article={a}
                onRequestCouncil={() => requestCouncil(a)}
              />
            ))}
          </AnimatePresence>
        )}
      </ScrollArea>

      <div className="px-3 py-1.5 border-t border-border flex items-center justify-between">
        <span className="text-[9px] text-muted-foreground font-mono">
          {filtered.length}/{articles.length} signals
        </span>
        <span className="text-[9px] text-muted-foreground font-mono">
          refreshes every 5m
        </span>
      </div>
    </div>
  );
}
