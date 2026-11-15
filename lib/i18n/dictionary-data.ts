// Translations by locale. Plain module (no Next.js imports) so scripts can use it too.
import type { Locale } from "./routing";
import id from "./dictionaries/id.json";
import en from "./dictionaries/en.json";

export type Dictionary = typeof id;

// Indonesian is the source of truth; TypeScript fails the build if English is missing a key.
export const dictionaries: Record<Locale, Dictionary> = { id, en };
