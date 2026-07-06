"use client";

import { useState, useRef, useEffect } from "react";
import { ChatMessage, DatasetProfile } from "@/lib/types";

interface ChatPanelProps {
  profile: DatasetProfile;
  fileName: string;
}

export default function ChatPanel({ profile, fileName }: ChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  async function handleSend() {
    const question = input.trim();
    if (!question || isLoading) return;

    const nextMessages: ChatMessage[] = [...messages, { role: "user", content: question }];
    setMessages(nextMessages);
    setInput("");
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile, fileName, messages: nextMessages }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Something went wrong.");
      setMessages([...nextMessages, { role: "assistant", content: data.answer }]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setIsLoading(false);
    }
  }

  const suggestions = [
    "What's the biggest driver of the numbers here?",
    "Are there any outliers I should know about?",
    "Summarize this in one sentence for a client.",
  ];

  return (
    <div className="flex h-full flex-col rounded-xl2 bg-white shadow-card">
      <div className="border-b border-ink-900/10 px-5 py-4">
        <p className="font-display text-sm font-medium text-ink-900">Ask your data</p>
        <p className="text-xs text-ink-900/40">Answers are grounded in the file you uploaded.</p>
      </div>

      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-5 py-4" style={{ maxHeight: 360 }}>
        {messages.length === 0 && (
          <div className="space-y-2">
            {suggestions.map((s) => (
              <button
                key={s}
                onClick={() => setInput(s)}
                className="focus-ring block w-full rounded-lg border border-ink-900/10 px-3 py-2 text-left text-sm text-ink-900/60 transition-colors hover:border-signal-teal/40 hover:text-ink-900"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {messages.map((m, i) => (
          <div
            key={i}
            className={`max-w-[85%] rounded-lg px-3 py-2 text-sm leading-relaxed ${
              m.role === "user"
                ? "ml-auto bg-ink-900 text-white"
                : "bg-paper-100 text-ink-900"
            }`}
          >
            {m.content}
          </div>
        ))}

        {isLoading && (
          <div className="max-w-[85%] rounded-lg bg-paper-100 px-3 py-2 text-sm text-ink-900/40">
            Thinking…
          </div>
        )}

        {error && <p className="text-xs text-signal-coral">{error}</p>}
      </div>

      <div className="flex items-center gap-2 border-t border-ink-900/10 px-4 py-3">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder="Ask a question about this data…"
          className="focus-ring flex-1 rounded-lg border border-ink-900/10 px-3 py-2 text-sm outline-none placeholder:text-ink-900/30"
        />
        <button
          onClick={handleSend}
          disabled={isLoading || !input.trim()}
          className="focus-ring rounded-lg bg-ink-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-ink-800 disabled:opacity-40"
        >
          Ask
        </button>
      </div>
    </div>
  );
}
