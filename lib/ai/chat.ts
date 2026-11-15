// Runs one chat request with the configured provider and validates what the browser sent.

import "server-only";
import { z } from "zod";
import { locales, type Locale } from "@/lib/i18n/routing";
import { chatProvider } from "./config";
import { runAnthropic } from "./providers/anthropic";
import { runMock } from "./providers/mock";
import { runOpenRouter } from "./providers/openrouter";
import { buildSystemPrompt } from "./system-prompt";
import { createToolRunner, toolDefs } from "./tools";
import type { ChatEvent, ProviderRun } from "./types";

export const MAX_MESSAGE_LENGTH = 2000;
export const MAX_TURNS = 20;

export const chatRequestSchema = z.object({
  locale: z.enum(locales),
  messages: z
    .array(
      z.object({ role: z.enum(["user", "assistant"]), content: z.string().min(1).max(MAX_MESSAGE_LENGTH) }),
    )
    .min(1)
    .max(MAX_TURNS)
    .refine((m) => m.at(-1)?.role === "user", "The last message must be from the visitor"),
});

export type ChatRequest = z.infer<typeof chatRequestSchema>;

const providers: Record<string, ProviderRun> = {
  openrouter: runOpenRouter,
  anthropic: runAnthropic,
  mock: runMock,
};

const systemPrompts = new Map<Locale, string>();
const systemPrompt = (locale: Locale) => {
  if (process.env.NODE_ENV !== "production") return buildSystemPrompt(locale); // content changes in dev
  let prompt = systemPrompts.get(locale);
  if (!prompt) systemPrompts.set(locale, (prompt = buildSystemPrompt(locale)));
  return prompt;
};

export async function* runChat(request: ChatRequest, signal: AbortSignal): AsyncGenerator<ChatEvent> {
  const name = chatProvider();
  if (!name) {
    yield { type: "error", code: "unavailable" };
    return;
  }
  try {
    yield* providers[name]({
      system: systemPrompt(request.locale),
      turns: request.messages,
      tools: toolDefs,
      runTool: createToolRunner(request.locale),
      locale: request.locale,
      signal,
    });
  } catch (err) {
    if (signal.aborted) return;
    console.error(`[chat] ${name} failed:`, err);
    yield { type: "error", code: "unavailable" };
  }
  yield { type: "done" };
}
