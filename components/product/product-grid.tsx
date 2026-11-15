"use client";

import { useState } from "react";
import { ProductCard, type ProductCardData } from "./product-card";

type Props = {
  products: ProductCardData[];
  /** Category key → label, in display order. Only categories with products are shown. */
  categories: [string, string][];
  labels: { all: string; filterLabel: string; draft: string };
};

/** Catalog grid with category filter chips. Without JavaScript every product is shown. */
export function ProductGrid({ products, categories, labels }: Props) {
  const [active, setActive] = useState<string | null>(null);
  const present = categories.filter(([key]) => products.some((p) => p.category === key));
  const shown = active ? products.filter((p) => p.category === active) : products;

  const chip = (selected: boolean) =>
    `rounded-full border px-4 py-2 text-sm font-semibold transition ${
      selected
        ? "bg-accent-strong text-on-accent-strong border-transparent"
        : "border-border bg-surface text-muted hover:text-fg"
    }`;

  return (
    <>
      {present.length > 1 && (
        <div role="group" aria-label={labels.filterLabel} className="mb-8 flex flex-wrap gap-2">
          <button
            type="button"
            aria-pressed={active === null}
            onClick={() => setActive(null)}
            className={chip(active === null)}
          >
            {labels.all}
          </button>
          {present.map(([key, label]) => (
            <button
              key={key}
              type="button"
              aria-pressed={active === key}
              onClick={() => setActive(key)}
              className={chip(active === key)}
            >
              {label}
            </button>
          ))}
        </div>
      )}
      <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {shown.map((p) => (
          <li key={p.slug}>
            <ProductCard product={p} draftLabel={labels.draft} />
          </li>
        ))}
      </ul>
    </>
  );
}
