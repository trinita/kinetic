import type { NextRequest } from "next/server";
import { chatRequestSchema, runChat } from "@/lib/ai/chat";
import { chatProvider } from "@/lib/ai/config";
import { createRateLimiter } from "@/lib/ai/rate-limit";
import type { ChatEvent } from "@/lib/ai/types";

// 20 messages per 10 minutes per visitor.
const allow = createRateLimiter({ limit: 20, windowMs: 10 * 60_000 });

const json = (status: number, event: ChatEvent) =>
  new Response(JSON.stringify(event) + "\n", {
    status,
    headers: { "content-type": "application/x-ndjson; charset=utf-8" },
  });

// POST /api/chat  { locale, messages: [{ role, content }] }  →  NDJSON stream of ChatEvent
export async function POST(request: NextRequest) {
  if (!chatProvider()) return json(503, { type: "error", code: "unavailable" });

  // Only this site's pages may use the assistant.
  const origin = request.headers.get("origin");
  if (origin && new URL(origin).host !== request.headers.get("host")) {
    return json(403, { type: "error", code: "unavailable" });
  }

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0].trim() || "local";
  if (!allow(ip)) return json(429, { type: "error", code: "rate_limited" });

  const body = chatRequestSchema.safeParse(await request.json().catch(() => null));
  if (!body.success) return json(400, { type: "error", code: "unavailable" });

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      for await (const event of runChat(body.data, request.signal)) {
        controller.enqueue(encoder.encode(JSON.stringify(event) + "\n"));
      }
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "content-type": "application/x-ndjson; charset=utf-8",
      "cache-control": "no-store",
      "x-content-type-options": "nosniff",
    },
  });
}
