"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, MicOff } from "lucide-react";
import { speak, stopSpeaking } from "@/lib/tts";
import type { ScoredArticle } from "@/types";

interface Props {
  onVoiceCommand?: (text: string) => void;
  pendingAlert?: ScoredArticle | null;
}

type JarvisState = "idle" | "listening" | "processing" | "speaking";

const WAVE_HEIGHTS = [30, 55, 80, 60, 90, 45, 70, 85, 50, 75, 40, 65];

const ORB_GLOW: Record<JarvisState, string> = {
  idle:       "0 0 0 1px oklch(0.22 0 0), 0 0 16px oklch(0.60 0.17 142 / 0.08)",
  listening:  "0 0 0 2px oklch(0.60 0.17 142 / 0.7), 0 0 32px oklch(0.60 0.17 142 / 0.35)",
  processing: "0 0 0 2px oklch(0.65 0.12 260 / 0.6), 0 0 24px oklch(0.65 0.12 260 / 0.25)",
  speaking:   "0 0 0 2px oklch(0.78 0.18 85 / 0.65), 0 0 32px oklch(0.78 0.18 85 / 0.30)",
};

const ORB_BG: Record<JarvisState, string> = {
  idle:       "oklch(0.10 0 0)",
  listening:  "oklch(0.12 0.03 142)",
  processing: "oklch(0.11 0.02 260)",
  speaking:   "oklch(0.12 0.03 85)",
};

const ORB_COLOR: Record<JarvisState, string> = {
  idle:       "oklch(0.40 0.05 142)",
  listening:  "oklch(0.60 0.17 142)",
  processing: "oklch(0.65 0.12 260)",
  speaking:   "oklch(0.78 0.18 85)",
};

const STATE_BADGE_BG: Record<JarvisState, string> = {
  idle:       "transparent",
  listening:  "oklch(0.60 0.17 142 / 0.12)",
  processing: "oklch(0.65 0.12 260 / 0.12)",
  speaking:   "oklch(0.78 0.18 85 / 0.12)",
};

const STATE_BADGE_BORDER: Record<JarvisState, string> = {
  idle:       "transparent",
  listening:  "oklch(0.60 0.17 142 / 0.28)",
  processing: "oklch(0.65 0.12 260 / 0.28)",
  speaking:   "oklch(0.78 0.18 85 / 0.28)",
};

export function JarvisOrb({ onVoiceCommand, pendingAlert }: Props) {
  const [state, setState] = useState<JarvisState>("idle");
  const [transcript, setTranscript] = useState("");
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const transcriptRef = useRef("");
  const prevAlertId = useRef<string | null>(null);

  useEffect(() => {
    if (
      pendingAlert &&
      pendingAlert.id !== prevAlertId.current &&
      pendingAlert.relevance >= 9
    ) {
      prevAlertId.current = pendingAlert.id;
      const text = `Heads up — ${pendingAlert.entities[0] ?? "breaking news"}: ${pendingAlert.summary ?? pendingAlert.title}. Relevance ${pendingAlert.relevance} out of 10.`;
      setState("speaking");
      speak(text).finally(() => setState("idle"));
    }
  }, [pendingAlert]);

  const startListening = useCallback(() => {
    if (!("webkitSpeechRecognition" in window) && !("SpeechRecognition" in window)) return;
    stopSpeaking();

    const SR =
      (window as Window & { SpeechRecognition?: typeof SpeechRecognition; webkitSpeechRecognition?: typeof SpeechRecognition })
        .SpeechRecognition ??
      (window as Window & { webkitSpeechRecognition?: typeof SpeechRecognition })
        .webkitSpeechRecognition;
    if (!SR) return;

    const recognition = new SR();
    recognition.lang = "en-US";
    recognition.continuous = false;
    recognition.interimResults = true;
    recognitionRef.current = recognition;
    setState("listening");
    setTranscript("");
    transcriptRef.current = "";

    recognition.onresult = (evt: SpeechRecognitionEvent) => {
      const interim = Array.from(evt.results)
        .map((r: SpeechRecognitionResult) => r[0].transcript)
        .join("");
      setTranscript(interim);
      transcriptRef.current = interim;
    };

    recognition.onend = () => {
      const final = transcriptRef.current;
      if (final.trim()) {
        setState("processing");
        onVoiceCommand?.(final.trim());
        setTranscript("");
        transcriptRef.current = "";
        setTimeout(() => setState("idle"), 1800);
      } else {
        setState("idle");
        setTranscript("");
      }
    };

    recognition.onerror = () => {
      setState("idle");
      setTranscript("");
    };

    recognition.start();
  }, [onVoiceCommand]);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
  }, []);

  const toggle = () => {
    if (state === "listening") stopListening();
    else if (state === "idle") startListening();
  };

  const isActive = state === "listening" || state === "speaking";
  const color = ORB_COLOR[state];

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2 pointer-events-none">
      {/* Transcript bubble */}
      <AnimatePresence>
        {transcript && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.94 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="pointer-events-none max-w-[200px] px-3 py-2 rounded-xl text-[10px] font-mono italic"
            style={{
              background: "oklch(0.12 0 0)",
              border: "1px solid oklch(0.20 0 0)",
              color: "oklch(0.70 0.01 200)",
            }}
          >
            &ldquo;{transcript}&rdquo;
          </motion.div>
        )}
      </AnimatePresence>

      {/* State badge */}
      <AnimatePresence mode="wait">
        {state !== "idle" && (
          <motion.div
            key={state}
            initial={{ opacity: 0, y: 4, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 3, scale: 0.95 }}
            transition={{ duration: 0.14 }}
            className="pointer-events-none text-[8px] font-mono tracking-widest uppercase px-2 py-0.5 rounded-full"
            style={{
              background: STATE_BADGE_BG[state],
              border: `1px solid ${STATE_BADGE_BORDER[state]}`,
              color,
            }}
          >
            JARVIS · {state}
          </motion.div>
        )}
      </AnimatePresence>

      {/* The Orb */}
      <motion.button
        onClick={toggle}
        disabled={state === "processing" || state === "speaking"}
        className="pointer-events-auto relative w-14 h-14 rounded-full flex items-center justify-center overflow-hidden disabled:cursor-not-allowed select-none"
        animate={{
          scale: state === "idle" ? [1, 1.045, 1] : state === "listening" ? 1.12 : 1,
          boxShadow: state === "idle"
            ? [ORB_GLOW.idle, "0 0 0 1px oklch(0.22 0 0), 0 0 24px oklch(0.60 0.17 142 / 0.16)", ORB_GLOW.idle]
            : ORB_GLOW[state],
        }}
        transition={
          state === "idle"
            ? { duration: 3.2, repeat: Infinity, ease: "easeInOut" }
            : { duration: 0.22, ease: "easeOut" }
        }
        style={{ background: ORB_BG[state] }}
      >
        {/* Outer ring pulse when listening */}
        <AnimatePresence>
          {state === "listening" && (
            <motion.span
              key="ring"
              className="absolute inset-0 rounded-full"
              initial={{ opacity: 0.6, scale: 1 }}
              animate={{ opacity: 0, scale: 1.55 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.1, repeat: Infinity, ease: "easeOut" }}
              style={{ border: "1.5px solid oklch(0.60 0.17 142 / 0.5)" }}
            />
          )}
        </AnimatePresence>

        {/* Waveform bars at bottom of orb when active */}
        {isActive && (
          <div className="absolute inset-x-2 bottom-2 flex items-end justify-center gap-[2px] h-5 overflow-hidden">
            {WAVE_HEIGHTS.slice(0, 9).map((h, i) => (
              <div
                key={i}
                className="wave-bar rounded-full"
                style={{
                  width: "2px",
                  height: `${Math.max(16, h * 0.22)}px`,
                  background: color,
                  opacity: 0.65,
                  animationDelay: `${i * 0.055}s`,
                  transformOrigin: "bottom",
                }}
              />
            ))}
          </div>
        )}

        {/* Mic icon */}
        <div className="relative z-10 mb-3">
          {state === "listening" ? (
            <MicOff size={17} style={{ color }} />
          ) : (
            <Mic size={17} style={{ color }} />
          )}
        </div>
      </motion.button>
    </div>
  );
}
