import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { lang } from "next/root-params";
import { getDictionary, getLocale } from "@/lib/i18n/dictionaries";
import { hasLocale, href } from "@/lib/i18n/routing";
import { getProduct, getProducts, slugParams } from "@/lib/content";
import { fill, formatPrice } from "@/lib/format";
import { site } from "@/lib/site";
import { DraftBadge } from "@/components/ui/badges";
import { NotTranslatedNotice } from "@/components/ui/page-header";
import { Prose } from "@/components/ui/prose";
import { WhatsAppButton } from "@/components/ui/links";
import { AskButton } from "@/components/chat/ask-button";
import { chatEnabled } from "@/lib/ai/config";

export async function generateStaticParams() {
  const locale = await lang();
  return slugParams(hasLocale(locale) ? getProducts(locale).map((p) => p.slug) : []);
}

export async function generateMetadata({ params }: PageProps<"/[lang]/products/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const product = getProduct(await getLocale(), slug);
  if (!product) return {};
  return {
    title: product.title,
    description: product.summary,
    openGraph: { images: product.images.slice(0, 1).map((i) => ({ url: i.src, alt: i.alt })) },
  };
}

// Every product page is prebuilt, so there's nothing to show a loading state for.
// (Unknown or draft slugs render the translated not-found page, marked noindex.)
export const instant = false;

export default async function ProductPage({ params }: PageProps<"/[lang]/products/[slug]">) {
  const { slug } = await params;
  const [locale, dict] = await Promise.all([getLocale(), getDictionary()]);
  const product = getProduct(locale, slug);
  if (!product) notFound();

  const t = dict.products;
  const url = site.url + href(locale, "products", product.slug);
  const [main, ...rest] = product.images;
  const facts: [string, string | undefined][] = [
    [t.wood, product.woods.join(", ") || undefined],
    [t.finish, product.finishes.join(", ") || undefined],
    [t.size, product.dimensions],
    [t.leadTime, product.leadTimeWeeks ? fill(t.weeks, { n: product.leadTimeWeeks }) : undefined],
    [
      t.availability,
      product.madeToOrder === undefined ? undefined : product.madeToOrder ? t.madeToOrder : t.oneOff,
    ],
    [t.customizable, product.customizable.join(", ") || undefined],
  ];

  return (
    <article className="mx-auto max-w-6xl px-4 pt-10 pb-20 sm:px-6">
      {!product.translated && <NotTranslatedNotice text={dict.common.notTranslated} />}
      <Link href={href(locale, "products")} className="text-muted hover:text-fg text-sm font-semibold">
        ← {t.allProducts}
      </Link>

      <div className="mt-6 grid gap-10 lg:grid-cols-[3fr_2fr]">
        {/* Gallery */}
        <div className="space-y-4">
          {main && (
            <div className="bg-walnut relative aspect-[4/5] overflow-hidden rounded-3xl">
              <Image
                src={main.src}
                alt={main.alt}
                fill
                priority
                sizes="(min-width: 1024px) 60vw, 100vw"
                className="object-cover"
              />
            </div>
          )}
          {rest.length > 0 && (
            <div className="grid grid-cols-2 gap-4">
              {rest.map((img) => (
                <div key={img.src} className="bg-walnut relative aspect-square overflow-hidden rounded-2xl">
                  <Image
                    src={img.src}
                    alt={img.alt}
                    fill
                    sizes="(min-width: 1024px) 30vw, 50vw"
                    className="object-cover"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="lg:sticky lg:top-24 lg:self-start">
          <div className="flex flex-wrap items-center gap-2">
            {product.category && (
              <span className="text-accent text-xs font-bold tracking-[0.2em] uppercase">
                {dict.categories[product.category]}
              </span>
            )}
            {product.draft && <DraftBadge label={dict.common.draft} />}
          </div>
          <h1 className="font-display text-accent-strong mt-2 text-4xl leading-tight font-semibold text-balance">
            {product.title}
          </h1>
          {product.summary && <p className="text-muted mt-4 text-lg leading-relaxed">{product.summary}</p>}

          <p className="font-display text-accent-strong mt-6 text-2xl font-semibold">
            {product.priceFrom
              ? fill(t.priceFrom, { price: formatPrice(locale, product.priceFrom) })
              : t.priceAsk}
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <WhatsAppButton
              message={fill(t.enquireMessage, { title: product.title, url })}
              className="w-full sm:w-auto"
            >
              {t.enquire}
            </WhatsAppButton>

            {chatEnabled() && (
              <AskButton question={fill(dict.chat.askAboutProductMessage, { title: product.title })}>
                {dict.chat.askAboutProduct}
              </AskButton>
            )}
          </div>

          <dl className="border-border mt-8 divide-y divide-[var(--border)] border-y">
            {facts
              .filter((f): f is [string, string] => !!f[1])
              .map(([label, value]) => (
                <div key={label} className="grid grid-cols-[9rem_1fr] gap-4 py-3 text-sm">
                  <dt className="text-muted">{label}</dt>
                  <dd className="font-medium">{value}</dd>
                </div>
              ))}
          </dl>
        </div>
      </div>

      {product.body && (
        <div className="mt-14">
          <h2 className="font-display text-accent-strong text-2xl font-semibold">{t.details}</h2>
          <Prose>{product.body}</Prose>
        </div>
      )}
    </article>
  );
}
