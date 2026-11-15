import Image from "next/image";
import Link from "next/link";
import { DraftBadge } from "@/components/ui/badges";

export type ProductCardData = {
  slug: string;
  href: string;
  title: string;
  summary?: string;
  categoryLabel?: string;
  category?: string;
  madeToOrder?: boolean;
  image?: { src: string; alt: string };
  draft: boolean;
};

export function ProductCard({ product, draftLabel }: { product: ProductCardData; draftLabel: string }) {
  return (
    <Link
      href={product.href}
      className="group border-border bg-surface block overflow-hidden rounded-3xl border transition hover:-translate-y-0.5 hover:shadow-lg"
    >
      <div className="bg-walnut relative aspect-[4/5] overflow-hidden">
        {product.image && (
          <Image
            src={product.image.src}
            alt={product.image.alt}
            fill
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover transition duration-500 group-hover:scale-105"
          />
        )}
      </div>
      <div className="p-5">
        <div className="flex flex-wrap items-center gap-2">
          {product.categoryLabel && (
            <span className="text-accent text-xs font-bold tracking-[0.2em] uppercase">
              {product.categoryLabel}
            </span>
          )}
          {product.draft && <DraftBadge label={draftLabel} />}
        </div>
        <h3 className="font-display text-accent-strong mt-2 text-xl font-semibold">{product.title}</h3>
        {product.summary && (
          <p className="text-muted mt-2 line-clamp-3 text-sm leading-relaxed">{product.summary}</p>
        )}
      </div>
    </Link>
  );
}
