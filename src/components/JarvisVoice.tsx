"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Mic, MicOff, Volume2 } from "lucide-react";
import { speak, stopSpeaking } from "@/lib/tts";
import type { ScoredArticle } from "@/types";

interface Props {
  onVoiceCommand?: (text: string) => void;
  pendingAlert?: ScoredArticle | null;
}

type JarvisState = "idle" | "listening" | "processing" | "speaking";

export function JarvisVoice({ onVoiceCommand, pendingAlert }: Props) {
  const [state, setState] = useState<JarvisState>("idle");
  const [transcript, setTranscript] = useState("");
  const [lastAlert, setLastAlert] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const prevAlertId = useRef<string | null>(null);

  useEffect(() => {
    if (
      pendingAlert &&
      pendingAlert.id !== prevAlertId.current &&
      pendingAlert.relevance >= 9
    ) {
      prevAlertId.current = pendingAlert.id;
      const alertText = `Heads up — ${pendingAlert.entities[0] ?? "breaking news"}: ${pendingAlert.summary ?? pendingAlert.title}. Relevance score ${pendingAlert.relevance} out of 10. Want me to pull more context?`;
      setLastAlert(alertText);
      setState("speaking");
      speak(alertText).finally(() => setState("idle"));
    }
  }, [pendingAlert]);

  const startListening = useCallback(() => {
    if (!("webkitSpeechRecognition" in window) && !("SpeechRecognition" in window)) {
      alert("Speech recognition not supported in this browser.");
      return;
    }

    stopSpeaking();

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
      setTranscript(interim);
    };

    recognition.onend = () => {
      const final = transcript || "";
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
  }, [transcript, onVoiceCommand]);

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
                  ? "oklch(0.65 0.12 260)"
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
          {Array.from({ length: 12 }).map((_, i) => (
            <div
              key={i}
              className={`w-0.5 rounded-full origin-bottom ${isActive ? "wave-bar" : ""}`}
              style={{
                height: isActive ? `${Math.random() * 100}%` : "20%",
                background: isActive
                  ? "oklch(0.60 0.17 142)"
                  : "oklch(0.30 0 0)",
                animationDelay: `${i * 0.05}s`,
                transition: "background 0.3s",
              }}
            />
          ))}
        </div>

        <button
          onClick={toggleListen}
          disabled={state === "processing" || state === "speaking"}
          className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 ${
            state === "listening"
              ? "bg-[oklch(0.60_0.17_142)] text-[oklch(0.07_0_0)] scale-110"
              : "bg-secondary hover:bg-secondary/80 text-foreground"
          } disabled:opacity-40`}
        >
          {state === "listening" ? <MicOff size={20} /> : <Mic size={20} />}
        </button>

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
          {state === "idle" && "Press to speak"}
          {state === "listening" && "Listening…"}
          {state === "processing" && "Processing…"}
          {state === "speaking" && "Speaking…"}
        </p>
      </div>
    </div>
  );
}
