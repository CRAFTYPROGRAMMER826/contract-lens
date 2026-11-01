"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { queryContract } from "@/lib/api";
import ChatMessage from "@/components/ChatMessage";
import LoadingSpinner from "@/components/LoadingSpinner";
import type { ChatMessageType } from "@/lib/types";

const SUGGESTED_QUESTIONS = [
  "What are the key obligations of each party?",
  "Are there any termination clauses?",
  "What penalties exist for breach of contract?",
  "What is the governing law and jurisdiction?",
  "Are there any confidentiality requirements?",
  "What are the payment terms?",
];

export default function ChatPage() {
  const params = useParams();
  const router = useRouter();
  const documentId = params.documentId as string;

  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const sendMessage = useCallback(
    async (question: string) => {
      if (!question.trim() || isLoading) return;

      const userMessage: ChatMessageType = {
        id: crypto.randomUUID(),
        role: "user",
        content: question.trim(),
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setInput("");
      setError(null);
      setIsLoading(true);

      try {
        const response = await queryContract(documentId, question.trim());
        const aiMessage: ChatMessageType = {
          id: crypto.randomUUID(),
          role: "assistant",
          content: response.answer,
          sourceChunks: response.source_chunks,
          confidence: response.confidence,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, aiMessage]);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to get a response."
        );
      } finally {
        setIsLoading(false);
        inputRef.current?.focus();
      }
    },
    [documentId, isLoading]
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col">
      {/* Header */}
      <div className="border-b border-white/10 bg-navy-900/80 px-4 py-3 backdrop-blur-xl sm:px-6">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/")}
              className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-white/5 hover:text-white"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
            <div>
              <h1 className="text-lg font-semibold text-white">
                Contract Q&amp;A
              </h1>
              <p className="font-mono text-xs text-slate-500">
                {documentId}
              </p>
            </div>
          </div>
          <button
            onClick={() => router.push(`/analyze/${documentId}`)}
            className="rounded-lg border border-white/10 px-3 py-1.5 text-xs font-medium text-slate-300 transition-colors hover:bg-white/5 hover:text-white"
          >
            View Analysis
          </button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 py-6 sm:px-6">
        <div className="mx-auto max-w-4xl space-y-6">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-accent/10">
                <svg
                  className="h-8 w-8 text-accent"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                  />
                </svg>
              </div>
              <h2 className="mb-2 text-xl font-bold text-white">
                Ask anything about your contract
              </h2>
              <p className="mb-8 max-w-md text-center text-sm text-slate-400">
                Our AI will search through the contract and provide answers
                backed by specific clauses and sections.
              </p>

              {/* Suggested questions */}
              <div className="grid w-full max-w-2xl gap-2 sm:grid-cols-2">
                {SUGGESTED_QUESTIONS.map((question) => (
                  <button
                    key={question}
                    onClick={() => sendMessage(question)}
                    className="rounded-xl border border-white/10 bg-navy-800/50 px-4 py-3 text-left text-sm text-slate-300 transition-all hover:border-accent/30 hover:bg-navy-800 hover:text-white"
                  >
                    <span className="mr-2 text-accent">→</span>
                    {question}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((message) => (
              <ChatMessage key={message.id} message={message} />
            ))
          )}

          {/* Loading indicator */}
          {isLoading && (
            <div className="flex items-start gap-3 animate-fade-in">
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-purple-500/20 text-sm font-bold text-purple-400">
                AI
              </div>
              <div className="rounded-2xl rounded-tl-sm border border-white/10 bg-navy-800 px-4 py-3">
                <div className="flex items-center gap-2">
                  <LoadingSpinner size="sm" />
                  <span className="text-sm text-slate-400">
                    Searching contract...
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="mx-auto max-w-md animate-fade-in rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-center">
              <p className="text-sm text-red-300">{error}</p>
              <button
                onClick={() => setError(null)}
                className="mt-2 text-xs text-red-400 underline underline-offset-2 hover:text-red-300"
              >
                Dismiss
              </button>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="border-t border-white/10 bg-navy-900/80 px-4 py-4 backdrop-blur-xl sm:px-6">
        <form
          onSubmit={handleSubmit}
          className="mx-auto flex max-w-4xl items-center gap-3"
        >
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a question about the contract..."
            disabled={isLoading}
            className="flex-1 rounded-xl border border-white/10 bg-navy-800 px-4 py-3 text-sm text-white placeholder-slate-500 outline-none transition-colors focus:border-accent/50 focus:ring-1 focus:ring-accent/30 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="flex h-[46px] w-[46px] flex-shrink-0 items-center justify-center rounded-xl bg-accent text-white shadow-lg shadow-accent/25 transition-all hover:bg-accent-dark hover:shadow-accent/40 disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
              />
            </svg>
          </button>
        </form>
      </div>
    </div>
  );
}
