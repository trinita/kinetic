import type { RouteKey } from "@/lib/i18n/routing";

/** Pages in the header navigation, in order. */
export const mainNav = [
  "products",
  "services",
  "caseStudies",
  "about",
  "blog",
  "contact",
] as const satisfies readonly RouteKey[];

/** Pages in the footer "Explore" column. */
export const footerNav = [
  "products",
  "services",
  "caseStudies",
  "about",
  "team",
  "blog",
  "contact",
] as const satisfies readonly RouteKey[];
