import { getArticles, getTeam } from "@/lib/content";
import type { Locale, RouteKey } from "@/lib/i18n/routing";

/** Pages in the header navigation, in order. */
export const mainNav = [
  "home",
  "products",
  "services",
  "caseStudies",
  "about",
  "blog",
  "contact",
] as const satisfies readonly RouteKey[];

/** Pages in the footer "Explore" column. */
export const footerNav = [
  "home",
  "products",
  "services",
  "caseStudies",
  "about",
  "team",
  "blog",
  "contact",
] as const satisfies readonly RouteKey[];

/** Pages that only make sense once they have entries; they stay out of the menus until then. */
const hasEntries: Partial<Record<RouteKey, (locale: Locale) => boolean>> = {
  caseStudies: (locale) => getArticles("case-studies", locale).length > 0,
  blog: (locale) => getArticles("blog", locale).length > 0,
  team: (locale) => getTeam(locale).length > 0,
};

/** The menu items worth showing: empty collection pages are left out. */
export const withContent = <K extends RouteKey>(locale: Locale, keys: readonly K[]): K[] =>
  keys.filter((key) => hasEntries[key]?.(locale) ?? true);
