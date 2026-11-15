import type { Product } from "@/lib/content";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { href, type Locale } from "@/lib/i18n/routing";
import type { ProductCardData } from "./product-card";

export function toCard(p: Product, locale: Locale, dict: Dictionary): ProductCardData {
  return {
    slug: p.slug,
    href: href(locale, "products", p.slug),
    title: p.title,
    summary: p.summary,
    category: p.category,
    categoryLabel: p.category && dict.categories[p.category],
    madeToOrder: p.madeToOrder,
    image: p.images[0],
    draft: p.draft,
  };
}
