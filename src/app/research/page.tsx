"use client";

export const dynamic = "force-dynamic";

import Link from "next/link";
import { ArrowLeft, BarChart2 } from "lucide-react";
import { FilingAnalyzer } from "@/components/FilingAnalyzer";
import { getEntityGraph } from "@/lib/entity-graph";

function EntityGraphViz() {
  const graph = getEntityGraph();
  const tickers = graph.nodes.filter((n) => n.type === "ticker");
  const executives = graph.nodes.filter((n) => n.type === "executive");
  const events = graph.nodes.filter((n) => n.type === "event");
  const sectors = graph.nodes.filter((n) => n.type === "sector");

  return (
    <div className="h-full overflow-y-auto p-4 space-y-4">
      <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">
        Entity Knowledge Graph
      </p>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <p className="text-[9px] font-mono text-muted-foreground mb-2">TICKERS ({tickers.length})</p>
          <div className="flex flex-wrap gap-1">
            {tickers.map((n) => (
              <span
                key={n.id}
                className="text-[10px] font-mono px-1.5 py-0.5 rounded"
                style={{
                  background: "oklch(0.60 0.17 142 / 0.1)",
                  color: "oklch(0.60 0.17 142)",
                  border: "1px solid oklch(0.60 0.17 142 / 0.25)",
                }}
              >
                {n.id}
              </span>
            ))}
          </div>
        </div>

        <div>
          <p className="text-[9px] font-mono text-muted-foreground mb-2">EXECUTIVES ({executives.length})</p>
          <div className="space-y-0.5">
            {executives.map((n) => (
              <div key={n.id} className="flex items-center gap-1.5 text-[10px]">
                <span className="text-foreground">{n.label}</span>
                <span className="text-muted-foreground">→</span>
                <span className="font-mono text-muted-foreground">{n.tickers?.join(", ")}</span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <p className="text-[9px] font-mono text-muted-foreground mb-2">EVENTS ({events.length})</p>
          <div className="space-y-0.5">
            {events.map((n) => (
              <div key={n.id} className="flex items-center gap-1.5 text-[10px]">
                <span className="text-foreground">{n.label}</span>
                <span className="text-muted-foreground">→</span>
                <span className="font-mono text-muted-foreground">{n.tickers?.join(", ")}</span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <p className="text-[9px] font-mono text-muted-foreground mb-2">SECTORS ({sectors.length})</p>
          <div className="space-y-0.5">
            {sectors.map((n) => (
              <div key={n.id} className="text-[10px]">
                <span className="text-foreground">{n.label}</span>
                <div className="flex flex-wrap gap-0.5 mt-0.5">
                  {n.tickers?.map((t) => (
                    <span key={t} className="text-[9px] font-mono text-muted-foreground">
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div>
        <p className="text-[9px] font-mono text-muted-foreground mb-2">EDGES ({graph.edges.length})</p>
        <div className="space-y-0.5 max-h-32 overflow-y-auto">
          {graph.edges.slice(0, 20).map((e, i) => (
            <div key={i} className="text-[9px] font-mono text-muted-foreground flex gap-1">
              <span>{e.from}</span>
              <span>—[{e.relation}]→</span>
              <span>{e.to}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function ResearchPage() {
  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden">
      <header className="flex-shrink-0 h-9 border-b border-border flex items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="flex items-center gap-1 text-[10px] font-mono text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft size={11} />
            Dashboard
          </Link>
          <div className="w-px h-3 bg-border" />
          <div className="flex items-center gap-1.5">
            <BarChart2 size={13} className="text-primary" />
            <span className="text-xs font-mono font-semibold tracking-wider text-foreground">
              RESEARCH
            </span>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-hidden grid grid-cols-2 min-h-0">
        <section className="border-r border-border overflow-hidden flex flex-col min-h-0">
          <FilingAnalyzer />
        </section>

        <section className="overflow-hidden flex flex-col min-h-0 bg-card">
          <EntityGraphViz />
        </section>
      </main>
    </div>
  );
}
