"use client";

import { useState } from "react";
import ChunkCard from "./ChunkCard";
import type { ChatMessageType } from "@/lib/types";

interface ChatMessageProps {
  message: ChatMessageType;
}

export default function ChatMessage({ message }: ChatMessageProps) {
  const [showSources, setShowSources] = useState(false);
  const isUser = message.role === "user";

  return (
    <div
      className={`flex animate-slide-up ${isUser ? "justify-end" : "justify-start"}`}
    >
      <div
        className={`max-w-[85%] sm:max-w-[75%] ${
          isUser ? "order-1" : "order-1"
        }`}
      >
        {/* Avatar + bubble */}
        <div className={`flex items-start gap-3 ${isUser ? "flex-row-reverse" : ""}`}>
          {/* Avatar */}
          <div
            className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-sm font-bold ${
              isUser
                ? "bg-accent/20 text-accent"
                : "bg-purple-500/20 text-purple-400"
            }`}
          >
            {isUser ? "U" : "AI"}
          </div>

          {/* Message content */}
          <div>
            <div
              className={`rounded-2xl px-4 py-3 ${
                isUser
                  ? "rounded-tr-sm bg-accent/20 text-white"
                  : "rounded-tl-sm border border-white/10 bg-navy-800 text-slate-200"
              }`}
            >
              <p className="whitespace-pre-wrap text-sm leading-relaxed">
                {message.content}
              </p>
            </div>

            {/* Confidence + Sources for AI messages */}
            {!isUser && (
              <div className="mt-2 flex items-center gap-3">
                {message.confidence !== undefined && (
                  <span className="text-xs text-slate-500">
                    Confidence:{" "}
                    <span
                      className={`font-semibold ${
                        message.confidence >= 0.7
                          ? "text-emerald-400"
                          : message.confidence >= 0.4
                            ? "text-yellow-400"
                            : "text-red-400"
                      }`}
                    >
                      {Math.round(message.confidence * 100)}%
                    </span>
                  </span>
                )}

                {message.sourceChunks && message.sourceChunks.length > 0 && (
                  <button
                    onClick={() => setShowSources(!showSources)}
                    className="flex items-center gap-1 text-xs text-accent/70 transition-colors hover:text-accent"
                  >
                    <svg
                      className={`h-3 w-3 transition-transform ${showSources ? "rotate-180" : ""}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                    {showSources ? "Hide" : "Show"} Sources (
                    {message.sourceChunks.length})
                  </button>
                )}
              </div>
            )}

            {/* Expandable source chunks */}
            {showSources && message.sourceChunks && (
              <div className="mt-3 space-y-2 animate-fade-in">
                {message.sourceChunks.map((chunk) => (
                  <ChunkCard
                    key={chunk.id}
                    id={chunk.id}
                    text={chunk.text}
                    level={chunk.level}
                    section={chunk.section}
                  />
                ))}
              </div>
            )}

            {/* Timestamp */}
            <p
              className={`mt-1 text-[10px] text-slate-600 ${isUser ? "text-right" : ""}`}
            >
              {message.timestamp.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
