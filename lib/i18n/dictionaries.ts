import { lang } from "next/root-params";
import { notFound } from "next/navigation";
import { hasLocale, type Locale } from "./routing";
import { dictionaries, type Dictionary } from "./dictionary-data";

export type { Dictionary };

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
