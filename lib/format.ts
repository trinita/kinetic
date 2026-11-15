import type { Locale } from "@/lib/i18n/routing";

/** Fills {placeholders} in a dictionary string: fill("Mulai {price}", { price: "Rp 1" }). */
export function fill(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (m, k: string) => (k in vars ? String(vars[k]) : m));
}

const intlLocale = (locale: Locale) => (locale === "id" ? "id-ID" : "en-GB");

export function formatPrice(locale: Locale, rupiah: number): string {
  return new Intl.NumberFormat(intlLocale(locale), {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(rupiah);
}

export function formatDate(locale: Locale, date: Date): string {
  return new Intl.DateTimeFormat(intlLocale(locale), { dateStyle: "long", timeZone: "Asia/Jakarta" }).format(
    date,
  );
}
