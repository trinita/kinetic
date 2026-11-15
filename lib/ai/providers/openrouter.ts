// OpenRouter (OpenAI-compatible Chat Completions API), using the official `openai` SDK.

import OpenAI from "openai";
import type { ChatCompletionMessageParam, ChatCompletionTool } from "openai/resources/chat/completions";
import { MAX_OUTPUT_TOKENS, MAX_TOOL_ROUNDS, chatEffort, openrouterModel } from "../config";
import type { ProviderRun } from "../types";

let client: OpenAI | undefined;
const getClient = () =>
  (client ??= new OpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey: process.env.OPENROUTER_API_KEY,
  }));

export const runOpenRouter: ProviderRun = async function* ({ system, turns, tools, runTool, signal }) {
  const openaiTools: ChatCompletionTool[] = tools.map((t) => ({
    type: "function",
    function: { name: t.name, description: t.description, parameters: t.inputSchema },
  }));

  const messages: ChatCompletionMessageParam[] = [
    // cache_control is passed through to Anthropic models (prompt caching); other models ignore it.
    {
      role: "system",
      content: [{ type: "text", text: system, cache_control: { type: "ephemeral" } } as never],
    },
    ...turns.map((t) => ({ role: t.role, content: t.content }) as ChatCompletionMessageParam),
  ];

  for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
    const stream = await getClient().chat.completions.create(
      {
        model: openrouterModel(),
        messages,
        tools: openaiTools,
        tool_choice: "auto",
        max_tokens: MAX_OUTPUT_TOKENS,
        stream: true,
        // OpenRouter extension: reasoning effort, and keep reasoning text out of the stream.
        ...({ reasoning: { effort: chatEffort(), exclude: true } } as object),
      },
      { signal },
    );

    let text = "";
    let finishReason: string | null = null;
    const calls: { id: string; name: string; args: string }[] = [];

    for await (const chunk of stream) {
      const choice = chunk.choices[0];
      if (!choice) continue;
      const streamError = (choice as { error?: { message?: string } }).error;
      if (streamError) throw new Error(`OpenRouter stream error: ${streamError.message ?? "unknown"}`);

      const delta = choice.delta;
      if (delta?.content) {
        text += delta.content;
        yield { type: "text", text: delta.content };
      }
      for (const tc of delta?.tool_calls ?? []) {
        // Tool calls arrive in fragments keyed by index; the first fragment carries id and name.
        const call = (calls[tc.index] ??= { id: "", name: "", args: "" });
        if (tc.id) call.id = tc.id;
        if (tc.function?.name) call.name += tc.function.name;
        if (tc.function?.arguments) call.args += tc.function.arguments;
      }
      if (choice.finish_reason) finishReason = choice.finish_reason;
    }

    if (finishReason === "content_filter") {
      yield { type: "error", code: "refused" };
      return;
    }
    const toolCalls = calls.filter(Boolean);
    if (!toolCalls.length) return; // final answer

    // A tool call cut off at the token limit has incomplete arguments; don't run it.
    if (finishReason === "length") throw new Error("Tool call truncated at max_tokens");

    messages.push({
      role: "assistant",
      content: text || null,
      tool_calls: toolCalls.map((c) => ({
        id: c.id,
        type: "function",
        function: { name: c.name, arguments: c.args || "{}" },
      })),
    });

    for (const call of toolCalls) {
      if (call.name !== "prepare_whatsapp_enquiry") yield { type: "status", status: "searching" };
      let input: unknown;
      try {
        input = JSON.parse(call.args || "{}");
      } catch {
        messages.push({
          role: "tool",
          tool_call_id: call.id,
          content: "Error: arguments were not valid JSON.",
        });
        continue;
      }
      const output = await runTool(call.name, input);
      if (output.event) yield output.event;
      messages.push({
        role: "tool",
        tool_call_id: call.id,
        content: output.isError ? `Error: ${output.content}` : output.content,
      });
    }
    if (text) yield { type: "text", text: "\n\n" };
  }
};
