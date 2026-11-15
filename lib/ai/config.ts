// Which AI provider and model the chat assistant uses. Switching provider is a .env change:
//   AI_PROVIDER=openrouter  + OPENROUTER_API_KEY  (+ optional OPENROUTER_MODEL)
//   AI_PROVIDER=anthropic   + ANTHROPIC_API_KEY   (+ optional ANTHROPIC_MODEL)
//   AI_PROVIDER=mock        scripted replies, no network (tests and local UI work)
// Without AI_PROVIDER, whichever key is present is used (OpenRouter first).

export type ProviderName = "openrouter" | "anthropic" | "mock";

export function chatProvider(env: Record<string, string | undefined> = process.env): ProviderName | null {
  const chosen = env.AI_PROVIDER?.trim().toLowerCase();
  if (chosen === "mock") return "mock";
  if (chosen === "openrouter") return env.OPENROUTER_API_KEY ? "openrouter" : null;
  if (chosen === "anthropic") return env.ANTHROPIC_API_KEY ? "anthropic" : null;
  if (chosen) return null; // unknown value: chat stays off rather than guessing
  if (env.OPENROUTER_API_KEY) return "openrouter";
  if (env.ANTHROPIC_API_KEY) return "anthropic";
  return null;
}

export const chatEnabled = () => chatProvider() !== null;

export const openrouterModel = () => process.env.OPENROUTER_MODEL || "anthropic/claude-opus-5.5";
export const anthropicModel = () => process.env.ANTHROPIC_MODEL || "claude-opus-5-5";

/** Reasoning effort. Short, factual chat answers do well at "low"; raise it if answers feel shallow. */
export const chatEffort = () => (process.env.CHAT_EFFORT as "low" | "medium" | "high" | undefined) || "low";

/** Room for reasoning plus a short answer. */
export const MAX_OUTPUT_TOKENS = 8000;
/** Model ↔ tool round trips per visitor message. */
export const MAX_TOOL_ROUNDS = 5;
