import {
  convertToModelMessages,
  createUIMessageStreamResponse,
  streamText,
  toUIMessageStream,
  type UIMessage,
} from "ai";
import { getVectorStore } from "@/lib/vector-store";
import { CLAUDE_MODEL, SYSTEM_PROMPT } from "@/lib/ai-client";

export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();

  const lastUser = [...messages].reverse().find((m) => m.role === "user");
  const query = lastUser?.parts?.find((p) => p.type === "text")?.text ?? "";

  const store = getVectorStore();
  const sources = store.search(query, 4);
  const context = sources
    .map((s) => `[Source: ${s.source}]\n${s.content.slice(0, 800)}`)
    .join("\n\n---\n\n");

  const sourceList = sources
    .map((s, i) => `${i + 1}. ${s.source} (similarity: ${s.similarity.toFixed(2)})`)
    .join("\n");

  const systemWithContext = `${SYSTEM_PROMPT}

You have access to the following research context. Use it to ground your answers. Always cite which sources you used.

CONTEXT:
${context}

SOURCES AVAILABLE:
${sourceList}

When answering, end your response with a brief "Sources used:" line listing the relevant sources.`;

  const result = streamText({
    model: CLAUDE_MODEL,
    system: systemWithContext,
    messages: await convertToModelMessages(messages),
  });

  return createUIMessageStreamResponse({
    stream: toUIMessageStream({ stream: result.stream }),
  });
}
