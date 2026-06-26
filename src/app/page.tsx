"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { speak } from "@/lib/tts";
import Link from "next/link";
import { BarChart2, BookOpen } from "lucide-react";
import { WatchlistPanel } from "@/components/WatchlistPanel";
import { NewsFeed } from "@/components/NewsFeed";
import { ChatDesk } from "@/components/ChatDesk";
import { JarvisVoice } from "@/components/JarvisVoice";
import type { ScoredArticle } from "@/types";

export default function Dashboard() {
  const [watchlistTickers, setWatchlistTickers] = useState<string[]>([]);
  const [clockTime, setClockTime] = useState("");

  useEffect(() => {
    const fmt = () =>
      new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", timeZoneName: "short" });
    setClockTime(fmt());
    const id = setInterval(() => setClockTime(fmt()), 60_000);
    return () => clearInterval(id);
  }, []);
  const [pendingAlert, setPendingAlert] = useState<ScoredArticle | null>(null);
  const [voiceInput, setVoiceInput] = useState<string | undefined>();

  const handleHighSignal = useCallback((article: ScoredArticle) => {
    setPendingAlert(article);
  }, []);

  const handleVoiceCommand = useCallback((text: string) => {
    setVoiceInput(text);
    setTimeout(() => setVoiceInput(undefined), 100);
  }, []);

  const greetingFired = useRef(false);
  const handleFirstInteraction = () => {
    if (greetingFired.current) return;
    greetingFired.current = true;
    const hour = new Date().getHours();
    const t = hour < 12 ? "morning" : hour < 17 ? "afternoon" : "evening";
    speak(`Good ${t}, sir. Systems online. Four positions loaded. I'll alert you on anything critical.`).catch(() => {});
  };

  return (
    <div
      className="flex flex-col h-screen bg-background overflow-hidden"
      onPointerDown={handleFirstInteraction}
    >
      {/* Top bar */}
      <header className="flex-shrink-0 h-9 border-b border-border flex items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <BarChart2 size={13} className="text-primary" />
            <span className="text-xs font-mono font-semibold tracking-wider text-foreground">
              DEETER INTELLIGENCE
            </span>
          </div>
          <div
            className="flex items-center gap-1.5 text-[9px] font-mono px-1.5 py-0.5 rounded"
            style={{
              background: "oklch(0.60 0.17 142 / 0.12)",
              color: "oklch(0.60 0.17 142)",
              border: "1px solid oklch(0.60 0.17 142 / 0.25)",
            }}
          >
            <span
              className="live-dot w-1.5 h-1.5 rounded-full flex-shrink-0"
              style={{ background: "oklch(0.60 0.17 142)" }}
            />
            LIVE
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/research"
            className="flex items-center gap-1 text-[10px] font-mono text-muted-foreground hover:text-foreground transition-colors"
          >
            <BookOpen size={11} />
            Research
          </Link>
          <span className="text-[10px] font-mono text-muted-foreground">
            {clockTime}
          </span>
        </div>
      </header>

      {/* Main 3-column layout */}
      <main className="flex-1 overflow-hidden grid grid-cols-[260px_1fr_310px] min-h-0">
        {/* Left: Watchlist */}
        <aside className="border-r border-border overflow-hidden flex flex-col min-h-0 bg-card">
          <WatchlistPanel onWatchlistChange={setWatchlistTickers} />
        </aside>

        {/* Center: News Feed */}
        <section className="border-r border-border overflow-hidden flex flex-col min-h-0">
          <NewsFeed
            tickers={watchlistTickers}
            onHighSignal={handleHighSignal}
          />
        </section>

        {/* Right: Chat + JARVIS */}
        <aside className="overflow-hidden flex flex-col min-h-0 bg-card">
          <div className="flex flex-col h-full">
            {/* Chat takes ~70% */}
            <div className="flex-1 min-h-0 border-b border-border overflow-hidden">
              <ChatDesk
                initialMessage={voiceInput}
                onMessageSent={() => {}}
              />
            </div>
            {/* JARVIS takes ~30% */}
            <div className="h-44 flex-shrink-0 overflow-hidden">
              <JarvisVoice
                onVoiceCommand={handleVoiceCommand}
                pendingAlert={pendingAlert}
              />
            </div>
          </div>
        </aside>
      </main>
    </div>
  );
}
