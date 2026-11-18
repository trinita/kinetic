// Locale config and localized URL mapping.
//
// Public URLs: Indonesian (default) at the root with Indonesian path segments
// (`/produk`), English under `/en` with English segments (`/en/products`).
// Internally every page lives at `app/[lang]/<english-segment>`, so the proxy
// rewrites Indonesian URLs to `/id/<english-segment>`.
//
// Kept free of Next.js imports so it can run in the proxy, components and tests.

export const locales = ["id", "en"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "id";

export function hasLocale(value: string | undefined): value is Locale {
  return value !== undefined && (locales as readonly string[]).includes(value);
}

/** Path segments per page. `en` doubles as the internal folder name under app/[lang]. */
export const routes = {
  home: { id: "", en: "" },
  about: { id: "tentang", en: "about" },
  team: { id: "tentang/tim", en: "about/team" },
  products: { id: "produk", en: "products" },
  services: { id: "layanan", en: "services" },
  caseStudies: { id: "proyek", en: "case-studies" },
  blog: { id: "blog", en: "blog" },
  contact: { id: "kontak", en: "contact" },
  search: { id: "cari", en: "search" },
} as const satisfies Record<string, Record<Locale, string>>;

export type RouteKey = keyof typeof routes;

const routeKeys = Object.keys(routes) as RouteKey[];

/** Public URL for a page, e.g. href("id", "products") → "/produk", href("en", "products", "teak-table") → "/en/products/teak-table". */
export function href(locale: Locale, key: RouteKey, rest = ""): string {
  const parts = [locale === defaultLocale ? "" : locale, routes[key][locale], rest]
    .flatMap((p) => p.split("/"))
    .filter(Boolean);
  return "/" + parts.join("/");
}

function splitPath(pathname: string): string[] {
  return pathname.split("/").filter(Boolean);
}

/** Finds the page whose segments (in `locale`) prefix the given segments; longest match wins. */
function matchRoute(segments: string[], locale: Locale): { key: RouteKey; rest: string[] } | null {
  let best: { key: RouteKey; rest: string[]; len: number } | null = null;
  for (const key of routeKeys) {
    const routeSegs = splitPath(routes[key][locale]);
    if (routeSegs.length > segments.length) continue;
    if (!routeSegs.every((s, i) => s === segments[i])) continue;
    if (!best || routeSegs.length > best.len) {
      best = { key, rest: segments.slice(routeSegs.length), len: routeSegs.length };
    }
  }
  return best && { key: best.key, rest: best.rest };
}

/** Parses a public URL into locale, page and remaining segments (e.g. a product slug). */
export function parsePublicPath(pathname: string): { locale: Locale; key: RouteKey; rest: string[] } | null {
  const segs = splitPath(pathname);
  const locale: Locale = segs[0] && segs[0] !== defaultLocale && hasLocale(segs[0]) ? segs[0] : defaultLocale;
  const localSegs = locale === defaultLocale ? segs : segs.slice(1);
  const match = matchRoute(localSegs, locale);
  return match && { locale, ...match };
}

/** Same page in another language. Falls back to that language's home page. */
/**
 * The address a visitor sees for a path. usePathname() reports the internal path of
 * Indonesian pages ("/id/products") instead of the public one ("/produk").
 */
export function toPublicPath(pathname: string): string {
  const decision = splitPath(pathname)[0] === defaultLocale ? resolveRequest(pathname) : null;
  return decision?.type === "redirect" ? decision.pathname : pathname;
}

export function switchLocalePath(pathname: string, target: Locale): string {
  const parsed = parsePublicPath(toPublicPath(pathname));
  if (!parsed) return href(target, "home");
  return href(target, parsed.key, parsed.rest.join("/"));
}

export type ProxyDecision =
  { type: "next" } | { type: "rewrite"; pathname: string } | { type: "redirect"; pathname: string };

/** What the proxy should do with an incoming page request. */
export function resolveRequest(pathname: string): ProxyDecision {
  const segs = splitPath(pathname);

  // English (or any non-default locale): folders already use English segments.
  if (segs[0] && segs[0] !== defaultLocale && hasLocale(segs[0])) return { type: "next" };

  // "/id/..." is internal only; send visitors to the clean Indonesian URL.
  if (segs[0] === defaultLocale) {
    const internal = matchRoute(segs.slice(1), "en");
    const rest = internal ? internal.rest.join("/") : "";
    return { type: "redirect", pathname: internal ? href(defaultLocale, internal.key, rest) : "/" };
  }

  const idMatch = matchRoute(segs, defaultLocale);
  if (idMatch && (idMatch.key !== "home" || segs.length === 0)) {
    const internal = [defaultLocale, routes[idMatch.key].en, ...idMatch.rest].filter(Boolean).join("/");
    return { type: "rewrite", pathname: "/" + internal };
  }

  // English segment without "/en" (e.g. "/products"): redirect to the Indonesian URL.
  const enMatch = matchRoute(segs, "en");
  if (enMatch && enMatch.key !== "home") {
    return { type: "redirect", pathname: href(defaultLocale, enMatch.key, enMatch.rest.join("/")) };
  }

  // Unknown path: let it 404 inside the Indonesian layout.
  return { type: "rewrite", pathname: "/" + [defaultLocale, ...segs].join("/") };
}
