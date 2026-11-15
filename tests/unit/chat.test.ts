import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { chatProvider } from "@/lib/ai/config";
import { chatRequestSchema, runChat } from "@/lib/ai/chat";
import { createRateLimiter } from "@/lib/ai/rate-limit";
import { createToolRunner } from "@/lib/ai/tools";
import type { ChatEvent } from "@/lib/ai/types";

describe("chatProvider", () => {
  it("uses the provider named in AI_PROVIDER when its key is present", () => {
    expect(chatProvider({ AI_PROVIDER: "openrouter", OPENROUTER_API_KEY: "k" })).toBe("openrouter");
    expect(chatProvider({ AI_PROVIDER: "anthropic", ANTHROPIC_API_KEY: "k", OPENROUTER_API_KEY: "k" })).toBe(
      "anthropic",
    );
    expect(chatProvider({ AI_PROVIDER: "anthropic", OPENROUTER_API_KEY: "k" })).toBeNull();
  });

  it("falls back to whichever key exists, OpenRouter first", () => {
    expect(chatProvider({ OPENROUTER_API_KEY: "k", ANTHROPIC_API_KEY: "k" })).toBe("openrouter");
    expect(chatProvider({ ANTHROPIC_API_KEY: "k" })).toBe("anthropic");
    expect(chatProvider({})).toBeNull();
  });

  it("turns chat off for an unknown provider name", () => {
    expect(chatProvider({ AI_PROVIDER: "gpt", OPENROUTER_API_KEY: "k" })).toBeNull();
  });
});

describe("chat request validation", () => {
  const ok = { locale: "id", messages: [{ role: "user", content: "Halo" }] };

  it("accepts a normal request", () => {
    expect(chatRequestSchema.safeParse(ok).success).toBe(true);
  });

  it("rejects oversized, empty, or assistant-last conversations", () => {
    expect(
      chatRequestSchema.safeParse({ ...ok, messages: [{ role: "user", content: "x".repeat(2001) }] }).success,
    ).toBe(false);
    expect(chatRequestSchema.safeParse({ ...ok, messages: [] }).success).toBe(false);
    expect(
      chatRequestSchema.safeParse({
        ...ok,
        messages: [...ok.messages, { role: "assistant", content: "Hai" }],
      }).success,
    ).toBe(false);
    expect(chatRequestSchema.safeParse({ ...ok, messages: [{ role: "system", content: "x" }] }).success).toBe(
      false,
    );
    expect(chatRequestSchema.safeParse({ ...ok, locale: "fr" }).success).toBe(false);
  });
});

describe("rate limiter", () => {
  it("allows up to the limit per window, per visitor", () => {
    const allow = createRateLimiter({ limit: 2, windowMs: 1000 });
    expect([allow("a", 0), allow("a", 10), allow("a", 20), allow("b", 20)]).toEqual([
      true,
      true,
      false,
      true,
    ]);
    expect(allow("a", 1011)).toBe(true); // first hit expired
  });
});

describe("tools", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    delete process.env.SHOW_DRAFTS;
  });

  const runTool = createToolRunner("id");

  it("prepares a WhatsApp link the visitor can send", async () => {
    const out = await runTool("prepare_whatsapp_enquiry", { message: "Halo, saya mau meja jati 120 cm" });
    expect(out.event).toMatchObject({ type: "whatsapp", message: "Halo, saya mau meja jati 120 cm" });
    expect((out.event as { url: string }).url).toBe(
      "https://wa.me/6281399325549?text=Halo%2C%20saya%20mau%20meja%20jati%20120%20cm",
    );
  });

  it("rejects invalid or unknown input instead of running", async () => {
    expect((await runTool("prepare_whatsapp_enquiry", { message: "" })).isError).toBe(true);
    expect((await runTool("search_site", { query: "meja", extra: 1 })).isError).toBe(true);
    expect((await runTool("delete_everything", {})).isError).toBe(true);
  });

  it("searches published content and reads pages by URL", async () => {
    vi.spyOn(process, "cwd").mockReturnValue(path.join(__dirname, "../fixtures/ok"));
    process.env.SHOW_DRAFTS = "false";
    const tools = createToolRunner("id");
    const found = await tools("search_site", { query: "rak jati" });
    expect(found.content).toContain("Rak Jati (product) — /produk/rak-jati");
    expect(found.content).not.toContain("Meja Draf");
    const page = await tools("get_page", { url: "/produk/rak-jati" });
    expect(page.content).toContain("Rak buku sederhana");
    expect((await tools("get_page", { url: "https://evil.example" })).isError).toBe(true);
  });
});

describe("runChat with the mock provider", () => {
  afterEach(() => delete process.env.AI_PROVIDER);

  const collect = async (content: string) => {
    process.env.AI_PROVIDER = "mock";
    const events: ChatEvent[] = [];
    for await (const e of runChat(
      { locale: "id", messages: [{ role: "user", content }] },
      new AbortController().signal,
    )) {
      events.push(e);
    }
    return events;
  };

  it("hands orders off to WhatsApp", async () => {
    const events = await collect("Saya mau pesan meja");
    expect(events.some((e) => e.type === "whatsapp")).toBe(true);
    expect(events.at(-1)).toEqual({ type: "done" });
  });

  it("answers from site search", async () => {
    const text = (await collect("jam buka"))
      .filter((e): e is Extract<ChatEvent, { type: "text" }> => e.type === "text")
      .map((e) => e.text)
      .join("");
    expect(text).toContain("](/kontak)");
  });
});
