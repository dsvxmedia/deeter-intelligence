"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Mic, MicOff, Volume2 } from "lucide-react";
import { speak, stopSpeaking } from "@/lib/tts";
import type { ScoredArticle } from "@/types";

interface Props {
  onVoiceCommand?: (text: string) => void;
  pendingAlert?: ScoredArticle | null;
}

type JarvisState = "idle" | "listening" | "processing" | "speaking";

const WAVE_HEIGHTS = [30, 55, 80, 60, 90, 45, 70, 85, 50, 75, 40, 65];
const GREETING = "Deeter Intelligence online. Monitoring positions and live signals. Ready when you are.";

export function JarvisVoice({ onVoiceCommand, pendingAlert }: Props) {
  const [state, setState] = useState<JarvisState>("idle");
  const [transcript, setTranscript] = useState("");
  const [lastAlert, setLastAlert] = useState<string | null>(null);
  const [voiceSupported, setVoiceSupported] = useState(true);

  useEffect(() => {
    setVoiceSupported(
      typeof window !== "undefined" &&
      ("webkitSpeechRecognition" in window || "SpeechRecognition" in window)
    );
  }, []);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const prevAlertId = useRef<string | null>(null);
  const transcriptRef = useRef("");
  const hasGreeted = useRef(false);
  // Prefetch greeting audio on mount so play() fires synchronously on first click
  const greetingBlobUrl = useRef<string | null>(null);

  useEffect(() => {
    fetch("/api/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: GREETING }),
    })
      .then((r) => (r.ok ? r.blob() : null))
      .then((blob) => {
        if (blob) greetingBlobUrl.current = URL.createObjectURL(blob);
      })
      .catch(() => {});

    return () => {
      if (greetingBlobUrl.current) URL.revokeObjectURL(greetingBlobUrl.current);
    };
  }, []);

  useEffect(() => {
    if (
      pendingAlert &&
      pendingAlert.id !== prevAlertId.current &&
      pendingAlert.relevance >= 9
    ) {
      prevAlertId.current = pendingAlert.id;
      const alertText = `Heads up: ${pendingAlert.entities[0] ?? "breaking news"}: ${pendingAlert.summary ?? pendingAlert.title}. Relevance ${pendingAlert.relevance} of 10.`;
      setLastAlert(alertText);
      // Display alert visually regardless; attempt audio (requires prior user activation)
      setState("speaking");
      speak(alertText).catch(() => {}).finally(() => setState("idle"));
    }
  }, [pendingAlert]);

  const startListening = useCallback(() => {
    if (!("webkitSpeechRecognition" in window) && !("SpeechRecognition" in window)) {
      setTranscript("Voice requires Chrome or Edge.");
      return;
    }

    stopSpeaking();

    // First click: play greeting (prefetched blob fires synchronously inside user gesture)
    if (!hasGreeted.current) {
      hasGreeted.current = true;
      setState("speaking");
      setLastAlert(GREETING);
      const playGreeting = async () => {
        if (greetingBlobUrl.current) {
          const audio = new Audio(greetingBlobUrl.current);
          await audio.play();
          await new Promise<void>((res) => { audio.onended = () => res(); });
        } else {
          await speak(GREETING);
        }
      };
      playGreeting()
        .catch(() => {})
        .finally(() => setState("idle"));
      return;
    }

    const SR = (window as Window & { SpeechRecognition?: typeof SpeechRecognition; webkitSpeechRecognition?: typeof SpeechRecognition }).SpeechRecognition ??
      (window as Window & { webkitSpeechRecognition?: typeof SpeechRecognition }).webkitSpeechRecognition;

    if (!SR) return;

    const recognition = new SR();
    recognition.lang = "en-US";
    recognition.continuous = false;
    recognition.interimResults = true;

    recognitionRef.current = recognition;
    setState("listening");
    setTranscript("");

    recognition.onresult = (evt: SpeechRecognitionEvent) => {
      const interim = Array.from(evt.results)
        .map((r: SpeechRecognitionResult) => r[0].transcript)
        .join("");
      transcriptRef.current = interim;
      setTranscript(interim);
    };

    recognition.onend = () => {
      const final = transcriptRef.current;
      transcriptRef.current = "";
      if (final.trim()) {
        setState("processing");
        onVoiceCommand?.(final.trim());
        setTranscript("");
      } else {
        setState("idle");
      }
    };

    recognition.onerror = () => setState("idle");

    recognition.start();
  }, [onVoiceCommand]);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setState("idle");
  }, []);

  const toggleListen = () => {
    if (state === "listening") stopListening();
    else if (state === "idle") startListening();
  };

  const isActive = state === "listening" || state === "speaking";

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b border-border flex items-center justify-between">
        <span className="text-xs font-mono text-muted-foreground uppercase tracking-widest">
          JARVIS
        </span>
        <div className="flex items-center gap-1.5">
          {state === "speaking" && (
            <Volume2 size={11} style={{ color: "oklch(0.78 0.18 85)" }} className="animate-pulse" />
          )}
          <span
            className="text-[10px] font-mono"
            style={{
              color:
                state === "listening"
                  ? "oklch(0.60 0.17 142)"
                  : state === "speaking"
                  ? "oklch(0.78 0.18 85)"
                  : state === "processing"
                  ? "oklch(0.55 0.12 220)"
                  : "oklch(0.50 0.01 200)",
            }}
          >
            {state.toUpperCase()}
          </span>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center gap-4 px-4">
        {/* JARVIS waveform */}
        <div className="flex items-end gap-0.5 h-8">
          {WAVE_HEIGHTS.map((h, i) => (
            <div
              key={i}
              className={`w-0.5 rounded-full origin-bottom ${isActive ? "wave-bar" : ""}`}
              style={{
                height: isActive ? `${h}%` : "30%",
                background: isActive
                  ? state === "speaking"
                    ? "oklch(0.78 0.18 85)"
                    : "oklch(0.60 0.17 142)"
                  : "oklch(0.28 0 0)",
                animationDelay: `${i * 0.05}s`,
                transition: "background 0.3s, height 0.3s",
              }}
            />
          ))}
        </div>

        <motion.button
          onClick={toggleListen}
          disabled={!voiceSupported || state === "processing" || state === "speaking"}
          animate={
            voiceSupported && state === "idle"
              ? { scale: [1, 1.04, 1], opacity: [0.7, 1, 0.7] }
              : state === "listening"
              ? { scale: 1.1 }
              : { scale: 1 }
          }
          transition={
            voiceSupported && state === "idle"
              ? { duration: 3, repeat: Infinity, ease: "easeInOut" }
              : { duration: 0.15 }
          }
          className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
            state === "listening"
              ? "bg-[oklch(0.60_0.17_142)] text-[oklch(0.07_0_0)]"
              : !voiceSupported
              ? "bg-secondary/40 text-muted-foreground cursor-not-allowed"
              : "bg-secondary hover:bg-secondary/80 text-foreground"
          } disabled:opacity-40`}
        >
          {state === "listening" ? <MicOff size={20} /> : <Mic size={20} />}
        </motion.button>

        {transcript && (
          <p className="text-[10px] font-mono text-center text-muted-foreground italic max-w-full truncate">
            &ldquo;{transcript}&rdquo;
          </p>
        )}

        {lastAlert && state !== "speaking" && (
          <p className="text-[9px] text-muted-foreground text-center line-clamp-2 px-2">
            {lastAlert}
          </p>
        )}

        <p className="text-[9px] text-muted-foreground text-center">
          {!voiceSupported && "Voice requires Chrome or Edge"}
          {voiceSupported && state === "idle" && "Ask about any position or signal"}
          {state === "listening" && "Listening…"}
          {state === "processing" && "Processing…"}
          {state === "speaking" && "Speaking…"}
        </p>
      </div>
    </div>
  );
}
