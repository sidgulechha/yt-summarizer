"use client";

import { useEffect, useRef, useState } from "react";

type Message = { role: "user" | "assistant"; content: string };

interface Props {
  videoId: string;
  videoTitle: string;
}

const SUGGESTIONS = [
  "What is the main argument of this video?",
  "What are the most important timestamps?",
  "Who is the target audience for this video?",
];

export default function VideoChat({ videoId, videoTitle: _videoTitle }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend(question: string) {
    const trimmed = question.trim();
    if (!trimmed || isStreaming) return;

    setError("");
    setInput("");

    const historyForApi = [...messages];
    setMessages((prev) => [
      ...prev,
      { role: "user", content: trimmed },
      { role: "assistant", content: "" },
    ]);
    setIsStreaming(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: trimmed, videoId, history: historyForApi }),
      });

      if (res.status === 401) {
        throw new Error("Session expired. Please sign in again.");
      }
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error || "Something went wrong. Please try again.");
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error("No response stream.");

      const decoder = new TextDecoder();
      let accumulated = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        accumulated += decoder.decode(value, { stream: true });

        const errorIndex = accumulated.lastIndexOf("\n__ERROR__");
        if (errorIndex !== -1) {
          throw new Error(accumulated.slice(errorIndex + "\n__ERROR__".length).trim());
        }

        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = { role: "assistant", content: accumulated };
          return updated;
        });
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong. Please try again.";
      setError(msg);
      setMessages((prev) => {
        const updated = [...prev];
        if (
          updated[updated.length - 1]?.role === "assistant" &&
          updated[updated.length - 1].content === ""
        ) {
          return updated.slice(0, -1);
        }
        return updated;
      });
    } finally {
      setIsStreaming(false);
      inputRef.current?.focus();
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend(input);
    }
  }

  return (
    <div className="max-w-3xl mx-auto mt-10 mb-16">
      <div className="mb-4">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
          Ask anything about this video
        </h2>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
          Answers are based on the video transcript only
        </p>
      </div>

      <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 flex flex-col overflow-hidden shadow-sm">
        <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-[200px] max-h-[500px]">
          {/* Suggestion chips */}
          {messages.length === 0 && (
            <div className="flex flex-col items-start gap-2 py-4">
              <p className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-1">
                Suggested questions
              </p>
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => handleSend(s)}
                  disabled={isStreaming}
                  className="px-4 py-2 rounded-full border border-gray-200 dark:border-gray-700 text-sm text-gray-700 dark:text-gray-300 hover:bg-red-50 hover:border-red-300 dark:hover:bg-red-950/30 dark:hover:border-red-700 transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* Messages */}
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                  msg.role === "user"
                    ? "bg-red-500 text-white rounded-br-sm"
                    : "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-bl-sm"
                }`}
              >
                {msg.role === "assistant" && msg.content === "" && isStreaming ? (
                  <TypingIndicator />
                ) : (
                  <span className="whitespace-pre-wrap">{msg.content}</span>
                )}
              </div>
            </div>
          ))}

          {error && (
            <div className="flex justify-start">
              <div className="max-w-[80%] rounded-2xl px-4 py-2.5 text-sm bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-bl-sm">
                {error}
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        <div className="border-t border-gray-100 dark:border-gray-800 p-3 flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isStreaming}
            placeholder="Ask a question about this video…"
            className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent transition-all disabled:opacity-50"
          />
          <button
            onClick={() => handleSend(input)}
            disabled={isStreaming || !input.trim()}
            className="px-4 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0 cursor-pointer"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <span className="flex items-center gap-1 h-4">
      <span className="w-1.5 h-1.5 rounded-full bg-gray-400 dark:bg-gray-500 animate-bounce [animation-delay:0ms]" />
      <span className="w-1.5 h-1.5 rounded-full bg-gray-400 dark:bg-gray-500 animate-bounce [animation-delay:150ms]" />
      <span className="w-1.5 h-1.5 rounded-full bg-gray-400 dark:bg-gray-500 animate-bounce [animation-delay:300ms]" />
    </span>
  );
}
