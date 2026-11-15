// Anthropic Claude API, using the official `@anthropic-ai/sdk` (streaming manual tool loop).

import Anthropic from "@anthropic-ai/sdk";
import { MAX_OUTPUT_TOKENS, MAX_TOOL_ROUNDS, anthropicModel, chatEffort } from "../config";
import type { ProviderRun } from "../types";

let client: Anthropic | undefined;
const getClient = () => (client ??= new Anthropic()); // reads ANTHROPIC_API_KEY

// Models that accept server-side refusal fallbacks (`fallbacks: "default"`).
const FALLBACK_MODELS = new Set([
  "claude-opus-5-5",
  "claude-sonnet-5-5",
  "claude-fable-5-2",
  "claude-fable-5-1",
  "claude-opus-5",
]);

export const runAnthropic: ProviderRun = async function* ({ system, turns, tools, runTool, signal }) {
  const model = anthropicModel();
  const useFallbacks = FALLBACK_MODELS.has(model);

  const anthropicTools: Anthropic.Beta.BetaTool[] = tools.map((t) => ({
    name: t.name,
    description: t.description,
    input_schema: t.inputSchema as Anthropic.Beta.BetaTool.InputSchema,
    strict: true,
    eager_input_streaming: true, // inputs stream as generated; validated in runTool before use
  }));

  const messages: Anthropic.Beta.BetaMessageParam[] = turns.map((t) => ({
    role: t.role,
    content: t.content,
  }));
  let jsonRetries = 0;

  for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
    const stream = getClient().beta.messages.stream(
      {
        model,
        max_tokens: MAX_OUTPUT_TOKENS,
        system,
        // Caches the stable prefix (tools + system prompt + earlier turns).
        cache_control: { type: "ephemeral" },
        tools: anthropicTools,
        output_config: { effort: chatEffort() },
        ...(useFallbacks
          ? { betas: ["server-side-fallback-2026-07-01"], fallbacks: "default" as const }
          : {}),
        messages,
      },
      { signal },
    );

    let message: Anthropic.Beta.BetaMessage;
    try {
      for await (const event of stream) {
        if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
          yield { type: "text", text: event.delta.text };
        }
      }
      message = await stream.finalMessage();
      jsonRetries = 0;
    } catch (err) {
      // With eager input streaming, unparseable tool input rejects finalMessage(); re-issue that turn only.
      if (err instanceof Anthropic.APIError || jsonRetries++ >= 2) throw err;
      continue;
    }

    if (message.stop_reason === "refusal") {
      yield { type: "error", code: "refused" };
      return;
    }

    const toolUses = message.content.filter(
      (b): b is Anthropic.Beta.BetaToolUseBlock => b.type === "tool_use",
    );
    if (!toolUses.length) return; // final answer (end_turn, or a text answer cut at max_tokens)
    if (message.stop_reason === "max_tokens") throw new Error("Tool input truncated at max_tokens");

    // Append the full content (thinking + tool_use blocks) unchanged.
    messages.push({ role: "assistant", content: message.content });

    const results: Anthropic.Beta.BetaToolResultBlockParam[] = [];
    for (const use of toolUses) {
      if (use.name !== "prepare_whatsapp_enquiry") yield { type: "status", status: "searching" };
      const output = await runTool(use.name, use.input);
      if (output.event) yield output.event;
      results.push({
        type: "tool_result",
        tool_use_id: use.id,
        content: output.content,
        is_error: output.isError,
      });
    }
    // All results for one turn go back in a single user message.
    messages.push({ role: "user", content: results });
    if (message.content.some((b) => b.type === "text")) yield { type: "text", text: "\n\n" };
  }
};
