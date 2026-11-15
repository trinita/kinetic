import type { Locale } from "@/lib/i18n/routing";

/** One turn of the visible conversation (what the browser sends). */
export type ChatTurn = { role: "user" | "assistant"; content: string };

/** Streamed to the browser as newline-delimited JSON. */
export type ChatEvent =
  | { type: "text"; text: string }
  | { type: "status"; status: "searching" }
  | { type: "whatsapp"; url: string; message: string }
  | { type: "error"; code: "unavailable" | "rate_limited" | "refused" }
  | { type: "done" };

/** A tool the model can call, described once and translated per provider. */
export type ToolDef = {
  name: string;
  description: string;
  /** JSON Schema for the input (object with additionalProperties: false). */
  inputSchema: Record<string, unknown>;
};

export type ToolOutput = {
  /** Text returned to the model. */
  content: string;
  isError?: boolean;
  /** Something to show the visitor as well (e.g. a WhatsApp button). */
  event?: ChatEvent;
};

export type RunTool = (name: string, input: unknown) => Promise<ToolOutput>;

export type ProviderRun = (args: {
  system: string;
  turns: ChatTurn[];
  tools: ToolDef[];
  runTool: RunTool;
  locale: Locale;
  signal: AbortSignal;
}) => AsyncGenerator<ChatEvent>;
