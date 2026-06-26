"use client";

import Link from "next/link";
import { ArrowLeft, BarChart2 } from "lucide-react";
import { FilingAnalyzer } from "@/components/FilingAnalyzer";
import { getEntityGraph } from "@/lib/entity-graph";

const RELATION_STYLE: Record<string, { label: string; color: string }> = {
  CEO:     { label: "CEO of",  color: "oklch(0.78 0.18 85)" },
  product: { label: "drives",  color: "oklch(0.65 0.12 260)" },
  affects: { label: "affects", color: "oklch(0.58 0.22 25)" },
  member:  { label: "in",      color: "oklch(0.45 0.01 200)" },
};

function NodeChip({ id, label, isTicker }: { id: string; label: string; isTicker: boolean }) {
  return (
    <span
      className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-mono"
      style={{
        background: isTicker ? "oklch(0.60 0.17 142 / 0.10)" : "oklch(0.14 0 0)",
        color: isTicker ? "oklch(0.60 0.17 142)" : "oklch(0.65 0.01 200)",
        border: `1px solid ${isTicker ? "oklch(0.60 0.17 142 / 0.22)" : "oklch(0.22 0 0)"}`,
        fontWeight: isTicker ? 600 : 400,
      }}
    >
      {isTicker ? id : label}
    </span>
  );
}

function EntityGraphViz() {
  const graph = getEntityGraph();

  const nodeMap = new Map(graph.nodes.map((n) => [n.id, n]));
  const isTickerNode = (id: string) => nodeMap.get(id)?.type === "ticker";
  const getLabel = (id: string) => nodeMap.get(id)?.label ?? id;

  const keyEdges = graph.edges.filter((e) => e.relation !== "member");
  const sectorEdges = graph.edges.filter((e) => e.relation === "member");
  const tickers = graph.nodes.filter((n) => n.type === "ticker");

  const sectorGroups = ["ai-infrastructure", "data-center", "big-tech", "semiconductors"].map((sid) => ({
    node: nodeMap.get(sid),
    members: sectorEdges.filter((e) => e.to === sid).map((e) => e.from),
  })).filter((g) => g.node && g.members.length > 0);

  return (
    <div className="h-full overflow-y-auto p-4 space-y-5">
      <div>
        <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">
          Entity Knowledge Graph
        </p>
        <p className="text-[10px] text-muted-foreground mt-0.5">
          {graph.nodes.length} nodes · {graph.edges.length} edges · traverses indirect exposure
        </p>
      </div>

      {/* Portfolio nodes */}
      <div>
        <p className="text-[9px] font-mono text-muted-foreground uppercase tracking-widest mb-2">
          Portfolio Positions
        </p>
        <div className="flex flex-wrap gap-1.5">
          {tickers.map((n) => (
            <div
              key={n.id}
              className="flex items-center gap-1.5 px-2 py-1 rounded"
              style={{
                background: "oklch(0.60 0.17 142 / 0.07)",
                border: "1px solid oklch(0.60 0.17 142 / 0.18)",
              }}
            >
              <span className="text-[10px] font-mono font-semibold" style={{ color: "oklch(0.60 0.17 142)" }}>
                {n.id}
              </span>
              <span className="text-[9px] text-muted-foreground">{n.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Key relationships */}
      <div>
        <p className="text-[9px] font-mono text-muted-foreground uppercase tracking-widest mb-2">
          Key Relationships
        </p>
        <div className="space-y-1.5">
          {keyEdges.map((e, i) => {
            const rel = RELATION_STYLE[e.relation] ?? { label: e.relation, color: "oklch(0.50 0.01 200)" };
            return (
              <div key={i} className="flex items-center gap-1.5 flex-wrap">
                <NodeChip id={e.from} label={getLabel(e.from)} isTicker={isTickerNode(e.from)} />
                <span className="text-[8px] font-mono uppercase tracking-widest" style={{ color: rel.color }}>
                  — {rel.label} →
                </span>
                <NodeChip id={e.to} label={getLabel(e.to)} isTicker={isTickerNode(e.to)} />
              </div>
            );
          })}
        </div>
      </div>

      {/* Sector exposure */}
      <div>
        <p className="text-[9px] font-mono text-muted-foreground uppercase tracking-widest mb-2">
          Sector Exposure
        </p>
        <div className="space-y-2">
          {sectorGroups.map(({ node, members }) => (
            <div key={node!.id} className="flex items-start gap-3">
              <span className="text-[9px] font-mono text-muted-foreground w-32 flex-shrink-0 mt-0.5 leading-tight">
                {node!.label}
              </span>
              <div className="flex flex-wrap gap-1">
                {members.map((m) => (
                  <span
                    key={m}
                    className="text-[9px] font-mono px-1 py-0.5 rounded"
                    style={{
                      background: "oklch(0.60 0.17 142 / 0.07)",
                      color: "oklch(0.60 0.17 142)",
                    }}
                  >
                    {m}
                  </span>
                ))}
              </div>
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
