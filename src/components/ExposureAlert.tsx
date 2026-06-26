"use client";

import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, X } from "lucide-react";
import { formatCurrency } from "@/lib/portfolio";
import type { ExposureAlert as ExposureAlertType } from "@/types";

interface Props {
  alerts: ExposureAlertType[];
  onDismiss: (ticker: string) => void;
}

export function ExposureAlert({ alerts, onDismiss }: Props) {
  if (alerts.length === 0) return null;

  return (
    <div className="space-y-1.5">
      <AnimatePresence>
        {alerts.map((alert) => (
          <motion.div
            key={alert.ticker}
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 12 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="rounded px-3 py-2 flex items-start gap-2"
            style={{
              background: "oklch(0.78 0.18 85 / 0.08)",
              border: "1px solid oklch(0.78 0.18 85 / 0.25)",
            }}
          >
            <AlertTriangle
              size={12}
              className="flex-shrink-0 mt-0.5"
              style={{ color: "oklch(0.78 0.18 85)" }}
            />
            <div className="flex-1 min-w-0">
              <div className="text-[11px] font-mono font-semibold" style={{ color: "oklch(0.78 0.18 85)" }}>
                {alert.ticker}: {formatCurrency(alert.exposureUsd)} exposure ({alert.exposurePct.toFixed(1)}%)
              </div>
              <div className="text-[10px] text-muted-foreground truncate mt-0.5">
                {alert.article.title}
              </div>
            </div>
            <button
              onClick={() => onDismiss(alert.ticker)}
              className="flex-shrink-0 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X size={10} />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
