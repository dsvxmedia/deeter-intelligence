"use client";

import { useState } from "react";
import { Search, FileText, Loader2, TrendingUp, TrendingDown, AlertTriangle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Filing } from "@/types";

interface AnalysisResult {
  executiveSummary: string;
  bullCases: string[];
  bearCases: string[];
  keyRisks: string[];
  sentimentScore: number;
  sentiment: "bullish" | "bearish" | "neutral";
}

export function FilingAnalyzer() {
  const [ticker, setTicker] = useState("");
  const [filings, setFilings] = useState<Filing[]>([]);
  const [selectedFiling, setSelectedFiling] = useState<Filing | null>(null);
  const [pastedText, setPastedText] = useState("");
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [loadingFilings, setLoadingFilings] = useState(false);
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchFilings = async () => {
    if (!ticker.trim()) return;
    setLoadingFilings(true);
    setError(null);
    try {
      const res = await fetch(`/api/filings?ticker=${ticker.trim().toUpperCase()}`);
      if (!res.ok) throw new Error("Failed to fetch filings");
      const { filings: data } = await res.json();
      setFilings(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setLoadingFilings(false);
    }
  };

  const analyze = async (text: string) => {
    if (!text || text.length < 100) {
      setError("Paste or load a document first");
      return;
    }
    setLoadingAnalysis(true);
    setError(null);
    setAnalysis(null);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, ticker: ticker || undefined }),
      });
      if (!res.ok) throw new Error("Analysis failed");
      const { analysis: data } = await res.json();
      setAnalysis(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Analysis failed");
    } finally {
      setLoadingAnalysis(false);
    }
  };

  const sentimentColor =
    analysis?.sentiment === "bullish"
      ? "oklch(0.60 0.17 142)"
      : analysis?.sentiment === "bearish"
      ? "oklch(0.58 0.22 25)"
      : "oklch(0.78 0.18 85)";

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b border-border">
        <span className="text-xs font-mono text-muted-foreground uppercase tracking-widest">
          Filing Analyzer
        </span>
      </div>

      <div className="p-3 border-b border-border space-y-2">
        <div className="flex gap-1.5">
          <Input
            value={ticker}
            onChange={(e) => setTicker(e.target.value.toUpperCase())}
            onKeyDown={(e) => e.key === "Enter" && fetchFilings()}
            placeholder="Ticker (e.g. NVDA)"
            className="h-7 text-xs font-mono bg-secondary border-border"
            maxLength={6}
          />
          <button
            onClick={fetchFilings}
            disabled={loadingFilings || !ticker.trim()}
            className="flex items-center gap-1 px-2.5 h-7 text-[10px] rounded bg-secondary hover:bg-accent hover:text-accent-foreground transition-colors disabled:opacity-40"
          >
            {loadingFilings ? <Loader2 size={10} className="animate-spin" /> : <Search size={10} />}
            EDGAR
          </button>
        </div>

        {filings.length > 0 && (
          <div className="space-y-0.5 max-h-24 overflow-y-auto">
            {filings.map((f) => (
              <button
                key={f.accessionNo}
                onClick={() => {
                  setSelectedFiling(f);
                  if (f.linkToHtmlAnnouncement) {
                    setPastedText(`Filing: ${f.form} filed ${f.filedAt}\n${f.description ?? ""}`);
                  }
                }}
                className={`w-full text-left px-2 py-1 rounded text-[10px] font-mono flex items-center justify-between hover:bg-secondary transition-colors ${
                  selectedFiling?.accessionNo === f.accessionNo ? "bg-secondary" : ""
                }`}
              >
                <span className="flex items-center gap-1.5">
                  <FileText size={9} />
                  {f.form}
                </span>
                <span className="text-muted-foreground">{f.filedAt}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="px-3 py-2 border-b border-border">
        <textarea
          value={pastedText}
          onChange={(e) => setPastedText(e.target.value)}
          placeholder="Paste 10-K, earnings call transcript, or press release here…"
          className="w-full h-20 text-[10px] font-mono bg-secondary border border-border rounded px-2 py-1.5 resize-none focus:outline-none focus:ring-1 focus:ring-ring text-foreground placeholder:text-muted-foreground"
        />
        <button
          onClick={() => analyze(pastedText)}
          disabled={loadingAnalysis || pastedText.length < 100}
          className="mt-1.5 w-full h-7 text-xs rounded bg-primary text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-40 flex items-center justify-center gap-1.5"
        >
          {loadingAnalysis ? (
            <>
              <Loader2 size={11} className="animate-spin" /> Analyzing…
            </>
          ) : (
            "Analyze with AI"
          )}
        </button>
        {error && <p className="text-[10px] text-destructive mt-1">{error}</p>}
      </div>

      <ScrollArea className="flex-1">
        {analysis && (
          <div className="p-3 space-y-3">
            <div
              className="rounded px-3 py-2 flex items-center justify-between"
              style={{
                background: `${sentimentColor}10`,
                border: `1px solid ${sentimentColor}30`,
              }}
            >
              <span className="text-[10px] text-muted-foreground">Sentiment</span>
              <div className="flex items-center gap-1.5">
                {analysis.sentiment === "bullish" ? (
                  <TrendingUp size={11} style={{ color: sentimentColor }} />
                ) : (
                  <TrendingDown size={11} style={{ color: sentimentColor }} />
                )}
                <span className="text-xs font-mono font-bold" style={{ color: sentimentColor }}>
                  {analysis.sentiment.toUpperCase()} {analysis.sentimentScore}/10
                </span>
              </div>
            </div>

            <div>
              <p className="text-[9px] font-mono text-muted-foreground uppercase tracking-widest mb-1">
                Summary
              </p>
              <p className="text-[11px] leading-relaxed">{analysis.executiveSummary}</p>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <p className="text-[9px] font-mono uppercase tracking-widest mb-1" style={{ color: "oklch(0.60 0.17 142)" }}>
                  Bull Cases
                </p>
                <ul className="space-y-1">
                  {analysis.bullCases.map((c, i) => (
                    <li key={i} className="text-[10px] flex gap-1.5">
                      <span style={{ color: "oklch(0.60 0.17 142)" }}>+</span>
                      {c}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-[9px] font-mono uppercase tracking-widest mb-1" style={{ color: "oklch(0.58 0.22 25)" }}>
                  Bear Cases
                </p>
                <ul className="space-y-1">
                  {analysis.bearCases.map((c, i) => (
                    <li key={i} className="text-[10px] flex gap-1.5">
                      <span style={{ color: "oklch(0.58 0.22 25)" }}>−</span>
                      {c}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {analysis.keyRisks.length > 0 && (
              <div>
                <p className="text-[9px] font-mono uppercase tracking-widest mb-1 text-muted-foreground">
                  Key Risks
                </p>
                <ul className="space-y-0.5">
                  {analysis.keyRisks.map((r, i) => (
                    <li key={i} className="text-[10px] text-muted-foreground flex gap-1.5 items-start">
                      <AlertTriangle size={9} className="flex-shrink-0 mt-0.5" style={{ color: "oklch(0.78 0.18 85)" }} />
                      {r}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
