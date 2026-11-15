"use client";

import Link from "next/link";
import Markdown from "react-markdown";
import { useCallback, useEffect, useRef, useState } from "react";
import type { ChatEvent } from "@/lib/ai/types";
import type { Locale } from "@/lib/i18n/routing";
import { WhatsAppIcon } from "@/components/ui/icons";

export type ChatLabels = {
  open: string;
  title: string;
  subtitle: string;
  greeting: string;
  suggestions: string[];
  placeholder: string;
  send: string;
  close: string;
  reset: string;
  thinking: string;
  searching: string;
  whatsappCta: string;
  whatsappNote: string;
  error: string;
  rateLimited: string;
  disclaimer: string;
};

type Message = {
  role: "user" | "assistant";
  content: string;
  whatsapp?: { url: string };
  /** Error notices are shown but never sent back to the model. */
  error?: boolean;
};

/** Event other components dispatch to open the chat with a question, e.g. "Ask about this piece". */
export const ASK_EVENT = "kinetic:ask";

const MAX_HISTORY = 20;

export function ChatWidget({ locale, labels }: { locale: Locale; labels: ChatLabels }) {
  const storageKey = `kinetic-chat-${locale}`;
  const [open, setOpen] = useState(false);
  // Restored on first render; the panel starts closed, so server and browser markup still match.
  const [messages, setMessages] = useState<Message[]>(() => {
    try {
      const saved = typeof window !== "undefined" && sessionStorage.getItem(storageKey);
      return saved ? (JSON.parse(saved) as Message[]) : [];
    } catch {
      return [];
    }
  });
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<"thinking" | "searching" | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Keep this tab's conversation across page navigations (per-visitor convenience; may be unavailable).
  useEffect(() => {
    try {
      sessionStorage.setItem(storageKey, JSON.stringify(messages));
    } catch {}
  }, [messages, storageKey]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [messages, status]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  const updateLast = (fn: (m: Message) => Message) =>
    setMessages((all) => [...all.slice(0, -1), fn(all[all.length - 1])]);

  const send = useCallback(
    async (text: string) => {
      const question = text.trim();
      if (!question || busy) return;
      const history: Message[] = [...messages, { role: "user", content: question }];
      setMessages([...history, { role: "assistant", content: "" }]);
      setInput("");
      setBusy(true);
      setStatus("thinking");

      const payload = history
        .filter((m) => !m.error && m.content)
        .slice(-MAX_HISTORY)
        .map((m) => ({ role: m.role, content: m.content.slice(0, 2000) }));

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ locale, messages: payload }),
        });
        if (!res.body) throw new Error("No response body");
        const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
        let buffer = "";
        for (;;) {
          const { value, done } = await reader.read();
          if (done) break;
          buffer += value;
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";
          for (const line of lines) {
            if (!line.trim()) continue;
            const event = JSON.parse(line) as ChatEvent;
            if (event.type === "text") {
              setStatus(null);
              updateLast((m) => ({ ...m, content: m.content + event.text }));
            } else if (event.type === "status") {
              setStatus(event.status);
            } else if (event.type === "whatsapp") {
              updateLast((m) => ({ ...m, whatsapp: { url: event.url } }));
            } else if (event.type === "error") {
              const notice = event.code === "rate_limited" ? labels.rateLimited : labels.error;
              updateLast((m) => ({
                ...m,
                content: m.content ? `${m.content}\n\n${notice}` : notice,
                error: true,
              }));
            }
          }
        }
      } catch {
        updateLast((m) => ({ ...m, content: labels.error, error: true }));
      } finally {
        setBusy(false);
        setStatus(null);
        // Drop an empty assistant bubble (e.g. the stream ended without text).
        setMessages((all) =>
          all.at(-1)?.role === "assistant" && !all.at(-1)?.content && !all.at(-1)?.whatsapp
            ? all.slice(0, -1)
            : all,
        );
      }
    },
    [busy, messages, locale, labels.error, labels.rateLimited],
  );

  // "Ask about this piece" buttons elsewhere on the page.
  useEffect(() => {
    const onAsk = (e: Event) => {
      setOpen(true);
      const question = (e as CustomEvent<string>).detail;
      if (question) void send(question);
    };
    window.addEventListener(ASK_EVENT, onAsk);
    return () => window.removeEventListener(ASK_EVENT, onAsk);
  }, [send]);

  return (
    <>
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="bg-accent-strong text-on-accent-strong fixed right-4 bottom-4 z-40 flex items-center gap-2 rounded-full px-5 py-3 font-semibold shadow-xl transition hover:opacity-90 sm:right-6 sm:bottom-6"
        >
          <ChatIcon className="size-5" />
          {labels.open}
        </button>
      )}

      {open && (
        <section
          role="dialog"
          aria-label={labels.title}
          onKeyDown={(e) => e.key === "Escape" && setOpen(false)}
          className="bg-surface border-border fixed inset-x-2 bottom-2 z-50 flex h-[min(80vh,40rem)] flex-col overflow-hidden rounded-3xl border shadow-2xl sm:inset-x-auto sm:right-6 sm:bottom-6 sm:w-[24rem]"
        >
          <header className="bg-walnut text-krem flex items-center gap-3 px-5 py-4">
            {/* eslint-disable-next-line @next/next/no-img-element -- small static logo */}
            <img src="/brand/kinetic-icon-dark.svg" alt="" className="size-9" />
            <div className="min-w-0 flex-1">
              <h2 className="font-display text-lg leading-tight font-semibold">{labels.title}</h2>
              <p className="text-oak text-xs">{labels.subtitle}</p>
            </div>
            {messages.length > 0 && (
              <button
                type="button"
                onClick={() => setMessages([])}
                disabled={busy}
                className="text-oak hover:text-krem text-xs font-semibold disabled:opacity-50"
              >
                {labels.reset}
              </button>
            )}
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label={labels.close}
              className="text-oak hover:text-krem rounded-full p-1"
            >
              <svg
                viewBox="0 0 24 24"
                className="size-5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                aria-hidden="true"
              >
                <path d="M6 6l12 12M18 6 6 18" />
              </svg>
            </button>
          </header>

          <div ref={listRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4" aria-live="polite">
            <Bubble role="assistant">{labels.greeting}</Bubble>
            {messages.length === 0 && (
              <div className="flex flex-wrap gap-2 pt-1">
                {labels.suggestions.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => void send(s)}
                    className="border-border hover:border-accent rounded-full border px-3 py-1.5 text-left text-sm transition"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
            {messages.map((m, i) =>
              m.content || m.whatsapp ? (
                <div key={i} className="space-y-2">
                  {m.content && (
                    <Bubble role={m.role} error={m.error}>
                      {m.content}
                    </Bubble>
                  )}
                  {m.whatsapp && (
                    <div className="border-border bg-bg mr-8 rounded-2xl border p-3">
                      <a
                        href={m.whatsapp.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-accent-strong text-on-accent-strong flex items-center justify-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold hover:opacity-90"
                      >
                        <WhatsAppIcon className="size-4" />
                        {labels.whatsappCta}
                      </a>
                      <p className="text-muted mt-2 text-center text-xs">{labels.whatsappNote}</p>
                    </div>
                  )}
                </div>
              ) : null,
            )}
            {status && (
              <p className="text-muted flex items-center gap-2 text-sm" role="status">
                <span className="bg-accent inline-block size-2 animate-pulse rounded-full" />
                {status === "searching" ? labels.searching : labels.thinking}
              </p>
            )}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              void send(input);
            }}
            className="border-border border-t p-3"
          >
            <div className="border-border bg-bg focus-within:border-accent flex items-end gap-2 rounded-2xl border p-2 transition">
              <textarea
                ref={inputRef}
                rows={1}
                value={input}
                maxLength={2000}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                    e.preventDefault();
                    void send(input);
                  }
                }}
                aria-label={labels.placeholder}
                placeholder={labels.placeholder}
                className="placeholder:text-muted max-h-32 flex-1 resize-none bg-transparent px-2 py-1.5 text-base outline-none focus-visible:outline-none"
              />
              <button
                type="submit"
                disabled={busy || !input.trim()}
                className="bg-accent-strong text-on-accent-strong rounded-xl px-4 py-2 text-sm font-semibold transition hover:opacity-90 disabled:opacity-40"
              >
                {labels.send}
              </button>
            </div>
            <p className="text-muted mt-2 px-1 text-[11px] leading-snug">{labels.disclaimer}</p>
          </form>
        </section>
      )}
    </>
  );
}

function Bubble({ role, error, children }: { role: Message["role"]; error?: boolean; children: string }) {
  if (role === "user") {
    return (
      <p className="bg-accent-strong text-on-accent-strong ml-8 rounded-2xl rounded-br-md px-4 py-2.5 text-[15px] leading-relaxed whitespace-pre-wrap">
        {children}
      </p>
    );
  }
  return (
    <div
      className={`mr-8 rounded-2xl rounded-bl-md px-4 py-2.5 text-[15px] leading-relaxed ${error ? "border-jati text-muted border border-dashed" : "bg-bg"}`}
    >
      <Markdown
        // The model only links to this site's pages and WhatsApp; anything else opens in a new tab.
        components={{
          p: (p) => <p className="my-1.5 first:mt-0 last:mb-0" {...p} />,
          ul: (p) => <ul className="my-1.5 list-disc space-y-0.5 pl-5" {...p} />,
          ol: (p) => <ol className="my-1.5 list-decimal space-y-0.5 pl-5" {...p} />,
          strong: (p) => <strong className="font-semibold" {...p} />,
          a: ({ href = "", children }) =>
            href.startsWith("/") ? (
              <Link href={href} className="text-accent font-semibold underline underline-offset-2">
                {children}
              </Link>
            ) : (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer nofollow"
                className="text-accent underline underline-offset-2"
              >
                {children}
              </a>
            ),
          img: () => null, // no images from model output
        }}
      >
        {children}
      </Markdown>
    </div>
  );
}

function ChatIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 12a8 8 0 0 1-11.6 7.1L4 20.5l1.4-4.9A8 8 0 1 1 21 12z" />
      <path d="M8.5 11h.01M12 11h.01M15.5 11h.01" />
    </svg>
  );
}
