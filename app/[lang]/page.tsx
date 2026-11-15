import Image from "next/image";
import Link from "next/link";
import { getDictionary, getLocale } from "@/lib/i18n/dictionaries";
import { href } from "@/lib/i18n/routing";
import { getProducts } from "@/lib/content";
import { whatsappLink } from "@/lib/site";
import { WhatsAppIcon } from "@/components/ui/icons";
import { buttonStyles, InstagramLink, WhatsAppButton } from "@/components/ui/links";
import { ProductCard } from "@/components/product/product-card";
import { toCard } from "@/components/product/to-card";

export default async function Home() {
  const [locale, dict] = await Promise.all([getLocale(), getDictionary()]);
  const t = dict.home;
  const featured = getProducts(locale)
    .filter((p) => p.featured)
    .slice(0, 3);

  return (
    <>
      {/* Hero */}
      <section className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-16 sm:px-6 md:grid-cols-[3fr_2fr] md:py-24">
        <div>
          <p className="text-accent text-xs font-bold tracking-[0.3em] uppercase">{t.eyebrow}</p>
          <h1 className="font-display text-accent-strong mt-4 text-5xl leading-[1.05] font-semibold text-balance sm:text-6xl">
            {t.title}
          </h1>
          <p className="text-muted mt-6 max-w-xl text-lg leading-relaxed">{t.lead}</p>
          <div className="mt-10 flex flex-wrap gap-3">
            <Link href={href(locale, "products")} className={buttonStyles.primary}>
              {t.ctaProducts}
            </Link>
            <WhatsAppButton message={t.whatsappMessage} variant="secondary">
              {t.ctaWhatsapp}
            </WhatsAppButton>
          </div>
        </div>
        <div className="bg-walnut relative mx-auto aspect-[4/5] w-full max-w-72 overflow-hidden rounded-[2rem] shadow-xl md:max-w-sm">
          <Image
            src="/images/products/meja-ukir-lukis-tropis-1.jpg"
            alt=""
            fill
            priority
            sizes="(min-width: 768px) 384px, 288px"
            className="object-cover"
          />
        </div>
      </section>

      {/* Featured work */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-accent-strong text-3xl font-semibold sm:text-4xl">
              {t.featuredTitle}
            </h2>
            <p className="text-muted mt-2 text-lg">{t.featuredIntro}</p>
          </div>
          {featured.length > 0 && (
            <Link
              href={href(locale, "products")}
              className="text-accent font-semibold underline underline-offset-4"
            >
              {t.seeAll} →
            </Link>
          )}
        </div>
        {featured.length ? (
          <ul className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((p) => (
              <li key={p.slug}>
                <ProductCard product={toCard(p, locale, dict)} draftLabel={dict.common.draft} />
              </li>
            ))}
          </ul>
        ) : (
          <div className="mt-8">
            <InstagramLink>{dict.common.seeInstagram}</InstagramLink>
          </div>
        )}
      </section>

      {/* How to order */}
      <section className="bg-surface border-border border-y">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <h2 className="font-display text-accent-strong text-3xl font-semibold sm:text-4xl">
            {t.processTitle}
          </h2>
          <p className="text-muted mt-2 text-lg">{t.processIntro}</p>
          <ol className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {t.steps.map((step, i) => (
              <li key={step.title}>
                <span className="font-display text-jati text-4xl font-semibold">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3 className="font-display text-accent-strong mt-2 text-xl font-semibold">{step.title}</h3>
                <p className="text-muted mt-2 leading-relaxed">{step.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Call to action */}
      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div className="bg-walnut text-krem relative overflow-hidden rounded-[2rem] px-8 py-14 sm:px-14">
          <div
            aria-hidden="true"
            className="absolute inset-0 opacity-20 [background:repeating-radial-gradient(ellipse_at_100%_120%,transparent_0_18px,var(--color-jati)_19px_20px)]"
          />
          <div className="relative max-w-xl">
            <h2 className="font-display text-3xl font-semibold sm:text-4xl">{t.ctaTitle}</h2>
            <p className="text-oak mt-3 text-lg">{t.ctaBody}</p>
            <a
              href={whatsappLink(t.whatsappMessage)}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-oak text-walnut mt-8 inline-flex items-center gap-2 rounded-full px-6 py-3 font-semibold transition hover:opacity-90"
            >
              <WhatsAppIcon className="size-5" />
              {t.ctaButton}
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
