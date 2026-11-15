import { lang } from "next/root-params";
import { notFound } from "next/navigation";
import { hasLocale, type Locale } from "./routing";
import id from "./dictionaries/id.json";
import en from "./dictionaries/en.json";

export type Dictionary = typeof id;

// Indonesian is the source of truth; TypeScript fails the build if English is missing a key.
const dictionaries: Record<Locale, Dictionary> = { id, en };

/** Locale of the current request (server only). */
export async function getLocale(): Promise<Locale> {
  const locale = await lang();
  if (!hasLocale(locale)) notFound();
  return locale;
}

/** Translations for the current request (server only). */
export async function getDictionary(): Promise<Dictionary> {
  return dictionaries[await getLocale()];
}
