"use client";

import { ASK_EVENT } from "./chat-widget";

/** Opens the chat assistant with a prepared question (rendered only when chat is enabled). */
export function AskButton({ question, children }: { question: string; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new CustomEvent(ASK_EVENT, { detail: question }))}
      className="border-border bg-surface hover:border-accent inline-flex items-center justify-center gap-2 rounded-full border px-6 py-3 font-semibold transition"
    >
      {children}
    </button>
  );
}
