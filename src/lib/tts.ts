"use client";

export type TTSProvider = "elevenlabs" | "browser";

export async function speak(text: string): Promise<void> {
  try {
    const res = await fetch("/api/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
    if (!res.ok) throw new Error("TTS API failed");
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);
    await audio.play();
    audio.onended = () => URL.revokeObjectURL(url);
    return;
  } catch {
    // fall through to browser TTS
  }

  await browserSpeak(text);
}

function browserSpeak(text: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!("speechSynthesis" in window)) {
      reject(new Error("SpeechSynthesis not supported"));
      return;
    }

    const synth = window.speechSynthesis;
    // Chrome bug: synth can get stuck in paused state; resume() unsticks it
    synth.resume();

    const utt = new SpeechSynthesisUtterance(text);
    utt.rate = 1.0;
    utt.pitch = 0.95;
    utt.volume = 1.0;
    utt.onend = () => resolve();
    utt.onerror = (e) => reject(e);

    // Set preferred voice if voices are already loaded — but never wait for
    // voiceschanged because that fires async and breaks Chrome's user activation.
    const voices = synth.getVoices();
    const preferred = voices.find(
      (v) => v.lang.startsWith("en") && (
        v.name.includes("Google") ||
        v.name.includes("Samantha") ||
        v.name.includes("Daniel")
      )
    );
    if (preferred) utt.voice = preferred;

    // speak() MUST run synchronously inside the user gesture tick.
    // Calling it from voiceschanged (async) loses user activation and Chrome
    // silently drops the utterance. Default system voice is fine as fallback.
    synth.speak(utt);
  });
}

export function stopSpeaking(): void {
  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }
}
