"use client";

export type TTSProvider = "elevenlabs" | "browser";

export async function speak(text: string): Promise<void> {
  const key = (window as Window & { __ELEVENLABS_KEY__?: string }).__ELEVENLABS_KEY__;

  if (key) {
    try {
      await elevenLabsSpeak(text, key);
      return;
    } catch {}
  }

  await browserSpeak(text);
}

async function elevenLabsSpeak(text: string, apiKey: string): Promise<void> {
  const voiceId = "21m00Tcm4TlvDq8ikWAM";
  const res = await fetch(`/api/tts`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, voiceId }),
  });
  if (!res.ok) throw new Error("ElevenLabs TTS failed");
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const audio = new Audio(url);
  await audio.play();
  audio.onended = () => URL.revokeObjectURL(url);
}

function browserSpeak(text: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!("speechSynthesis" in window)) {
      reject(new Error("SpeechSynthesis not supported"));
      return;
    }

    window.speechSynthesis.cancel();
    const utt = new SpeechSynthesisUtterance(text);

    const voices = window.speechSynthesis.getVoices();
    const preferred = voices.find(
      (v) => v.lang === "en-US" && (v.name.includes("Google") || v.name.includes("Samantha"))
    );
    if (preferred) utt.voice = preferred;

    utt.rate = 1.05;
    utt.pitch = 1.0;
    utt.volume = 1.0;
    utt.onend = () => resolve();
    utt.onerror = (e) => reject(e);
    window.speechSynthesis.speak(utt);
  });
}

export function stopSpeaking(): void {
  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }
}
