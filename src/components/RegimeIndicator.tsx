"use client";

import { AnimatePresence, motion } from "framer-motion";
import { TrendingUp, TrendingDown, Minus, Activity } from "lucide-react";
import type { RegimeScore } from "@/types";

interface Props {
  regime: RegimeScore | null;
}

const STATE_CONFIG = {
  "RISK-ON": {
    label: "RISK-ON",
    icon: TrendingUp,
    color: "oklch(0.60 0.17 142)",
    bg: "oklch(0.60 0.17 142 / 0.1)",
    border: "oklch(0.60 0.17 142 / 0.3)",
  },
  "RISK-OFF": {
    label: "RISK-OFF",
    icon: TrendingDown,
    color: "oklch(0.58 0.22 25)",
    bg: "oklch(0.58 0.22 25 / 0.1)",
    border: "oklch(0.58 0.22 25 / 0.3)",
  },
  UNCERTAIN: {
    label: "UNCERTAIN",
    icon: Minus,
    color: "oklch(0.78 0.18 85)",
    bg: "oklch(0.78 0.18 85 / 0.1)",
    border: "oklch(0.78 0.18 85 / 0.3)",
  },
};

export function RegimeIndicator({ regime }: Props) {
  const state = regime?.state ?? "UNCERTAIN";
  const cfg = STATE_CONFIG[state];
  const Icon = cfg.icon;

  return (
    <div
      className="rounded px-3 py-2 flex items-center justify-between"
      style={{
        background: cfg.bg,
        border: `1px solid ${cfg.border}`,
      }}
    >
      <div className="flex items-center gap-2">
        <Activity size={11} style={{ color: cfg.color }} className="flex-shrink-0" />
        <span className="text-[10px] text-muted-foreground font-mono uppercase tracking-widest">
          Regime
        </span>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={state}
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 4 }}
          transition={{ duration: 0.2 }}
          className="flex items-center gap-1.5"
        >
          <Icon size={11} style={{ color: cfg.color }} />
          <span
            className="text-xs font-mono font-bold tracking-wider"
            style={{ color: cfg.color }}
          >
            {cfg.label}
          </span>
        </motion.div>
      </AnimatePresence>

      {regime && (
        <div className="flex gap-2 text-[10px] font-mono text-muted-foreground">
          <span style={{ color: "oklch(0.60 0.17 142)" }}>{regime.bullCount}↑</span>
          <span style={{ color: "oklch(0.58 0.22 25)" }}>{regime.bearCount}↓</span>
        </div>
      )}
    </div>
  );
}
