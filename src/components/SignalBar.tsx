"use client";

import type { SignalBarData } from "@/types";

interface Props {
  data: SignalBarData[];
}

export function SignalBar({ data }: Props) {
  if (data.length === 0) return null;

  return (
    <div className="space-y-1">
      {data.map((d) => {
        const total = d.bullCount + d.bearCount + d.neutralCount || 1;
        const bullPct = (d.bullCount / total) * 100;
        const bearPct = (d.bearCount / total) * 100;
        const neutralPct = (d.neutralCount / total) * 100;

        return (
          <div key={d.ticker} className="flex items-center gap-2">
            <span className="text-[10px] font-mono w-10 flex-shrink-0 text-muted-foreground">
              {d.ticker}
            </span>
            <div className="flex-1 h-1.5 rounded-full overflow-hidden bg-secondary flex">
              <div
                className="h-full transition-all duration-500"
                style={{
                  width: `${bullPct}%`,
                  background: "oklch(0.60 0.17 142)",
                }}
              />
              <div
                className="h-full transition-all duration-500"
                style={{
                  width: `${neutralPct}%`,
                  background: "oklch(0.78 0.18 85)",
                }}
              />
              <div
                className="h-full transition-all duration-500"
                style={{
                  width: `${bearPct}%`,
                  background: "oklch(0.58 0.22 25)",
                }}
              />
            </div>
            <span className="text-[9px] font-mono text-muted-foreground w-6 flex-shrink-0">
              {d.avgRelevance.toFixed(0)}
            </span>
          </div>
        );
      })}
    </div>
  );
}
