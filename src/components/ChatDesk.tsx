"use client";

import { useRef } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { Send, Loader2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";

const transport = new DefaultChatTransport({ api: "/api/chat" });

interface Props {
  initialMessage?: string;
  onMessageSent?: (text: string) => void;
}

export function ChatDesk({ initialMessage, onMessageSent }: Props) {
  const { messages, sendMessage, status } = useChat({ transport });
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const pendingInitial = useRef(initialMessage);

  const handleSend = () => {
    const text = inputRef.current?.value.trim();
    if (!text || status !== "ready") return;

    sendMessage({ text });
    onMessageSent?.(text);

    if (inputRef.current) inputRef.current.value = "";

    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const sendVoice = (text: string) => {
    if (status !== "ready") return;
    sendMessage({ text });
    if (inputRef.current) inputRef.current.value = "";
  };

  if (pendingInitial.current && messages.length === 0) {
    const msg = pendingInitial.current;
    pendingInitial.current = undefined;
    setTimeout(() => sendVoice(msg), 100);
  }

  return (
    <div className="flex flex-col h-full" id="chat-desk">
      <div className="px-4 py-3 border-b border-border">
        <span className="text-xs font-mono text-muted-foreground uppercase tracking-widest">
          Intelligence Desk
        </span>
      </div>

      <ScrollArea className="flex-1" ref={scrollRef as React.RefObject<HTMLDivElement>}>
        <div className="p-3 space-y-3">
          {messages.length === 0 && (
            <div className="text-center py-8 space-y-2">
              <p className="text-xs text-muted-foreground">Ask anything about the market.</p>
              <div className="flex flex-wrap gap-1.5 justify-center">
                {[
                  "What's the bear case on NVDA?",
                  "Summarize FOMC impact",
                  "What's my biggest risk?",
                  "Compare AAPL vs MSFT",
                ].map((q) => (
                  <button
                    key={q}
                    onClick={() => {
                      if (inputRef.current) inputRef.current.value = q;
                      handleSend();
                    }}
                    className="text-[10px] px-2 py-1 rounded border border-border hover:border-primary hover:text-primary transition-colors text-muted-foreground"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] rounded px-3 py-2 text-xs ${
                  message.role === "user"
                    ? "bg-primary text-primary-foreground font-mono"
                    : "bg-secondary text-foreground"
                }`}
              >
                {message.parts.map((part, i) =>
                  part.type === "text" ? (
                    <span key={i} className="whitespace-pre-wrap leading-relaxed">
                      {part.text}
                    </span>
                  ) : null
                )}
              </div>
            </div>
          ))}

          {status === "streaming" && (
            <div className="flex justify-start">
              <div className="bg-secondary rounded px-3 py-2">
                <Loader2 size={12} className="animate-spin text-muted-foreground" />
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="p-3 border-t border-border">
        <div className="flex gap-1.5">
          <Input
            ref={inputRef}
            onKeyDown={handleKeyDown}
            placeholder="Ask the desk…"
            disabled={status !== "ready"}
            className="h-8 text-xs bg-secondary border-border"
          />
          <button
            onClick={handleSend}
            disabled={status !== "ready"}
            className="w-8 h-8 flex items-center justify-center rounded bg-primary text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-40"
          >
            {status === "streaming" ? (
              <Loader2 size={13} className="animate-spin" />
            ) : (
              <Send size={13} />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
