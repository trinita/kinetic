import Image from "next/image";
import Link from "next/link";
import { getDictionary, getLocale } from "@/lib/i18n/dictionaries";
import { href } from "@/lib/i18n/routing";
import { getPage, getProducts } from "@/lib/content";
import { site } from "@/lib/site";
import { buttonStyles, InstagramLink, WhatsAppButton } from "@/components/ui/links";
import { DraftBadge } from "@/components/ui/badges";
import { ProductCard } from "@/components/product/product-card";
import { toCard } from "@/components/product/to-card";
import { WorkshopVideo } from "@/components/home/workshop-video";

export default async function Home() {
  const [locale, dict] = await Promise.all([getLocale(), getDictionary()]);
  const t = dict.home;
  const featured = getProducts(locale)
    .filter((p) => p.featured)
    .slice(0, 3);
  // "From raw timber to finish" steps; a draft until the workshop has checked the texts.
  const story = getPage(locale, "home-story");

  return (
    <>
      {/* Hero: the painted bench in full colour, washed on the text side so the headline stays readable */}
      <section className="relative isolate flex min-h-[560px] items-center overflow-hidden py-20 md:min-h-[600px]">
        <Image
          src="/images/site/hero.jpg"
          alt=""
          fill
          priority
          sizes="100vw"
          className="-z-20 object-cover"
        />
        <div aria-hidden="true" className="bg-bg/70 absolute inset-0 -z-10 md:hidden" />
        <div
          aria-hidden="true"
          className="from-bg/80 via-bg/45 to-bg/5 absolute inset-0 -z-10 hidden bg-linear-to-r md:block"
        />
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
          <div className="max-w-3xl">
            <WorkshopVideo labels={{ button: t.videoButton, title: t.videoTitle, close: t.videoClose }} />
            <h1 className="font-hero text-accent-strong text-5xl leading-[1.05] font-bold tracking-[-0.025em] text-balance sm:text-6xl md:text-7xl">
              {t.title}
            </h1>
            <p className="text-fg mt-6 max-w-xl text-lg leading-relaxed font-medium">{t.lead}</p>
            <div className="mt-10 flex flex-wrap gap-3">
              <Link href={href(locale, "products")} className={buttonStyles.primary}>
                {t.ctaProducts}
              </Link>
              <WhatsAppButton message={t.whatsappMessage} variant="secondary">
                {t.ctaWhatsapp}
              </WhatsAppButton>
            </div>
          </div>
        </div>
      </section>

      {/* Featured work */}
      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
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

      {/* Story: from raw timber to finish */}
      {story && story.steps.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 pt-4 pb-24 sm:px-6">
          <div className="mb-14 text-center">
            {story.draft && <DraftBadge label={dict.common.draft} />}
            <h2 className="font-display text-accent-strong mt-2 text-3xl font-semibold sm:text-4xl">
              {story.title}
            </h2>
          </div>
          <ol className="grid gap-16 md:gap-28">
            {story.steps.map((step, i) => (
              <li key={step.label} className="grid items-center gap-8 md:grid-cols-2 md:gap-10">
                <div className={i % 2 ? "md:order-2 md:pl-10" : "md:pr-10"}>
                  <p className="text-accent text-xs font-bold tracking-[0.2em] uppercase">{step.label}</p>
                  <h3 className="font-display text-accent-strong mt-3 text-2xl font-semibold sm:text-3xl">
                    {step.title}
                  </h3>
                  <p className="text-muted mt-4 text-lg leading-relaxed">{step.body}</p>
                </div>
                <div
                  className={`bg-surface relative aspect-[4/3] overflow-hidden rounded-[2rem] ${i % 2 ? "md:order-1" : ""}`}
                >
                  <Image
                    src={step.image.src}
                    alt={step.image.alt}
                    fill
                    sizes="(min-width: 768px) 560px, 100vw"
                    className="object-cover"
                  />
                </div>
              </li>
            ))}
          </ol>
        </section>
      )}

      {/* How to order: vertical timeline */}
      <section id="order" className="bg-surface border-border scroll-mt-20 border-y py-24">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <div className="mb-14 text-center">
            <h2 className="font-display text-accent-strong text-3xl font-semibold sm:text-4xl">
              {t.processTitle}
            </h2>
            <p className="text-muted mt-3 text-lg">{t.processIntro}</p>
          </div>
          <div className="relative">
            <div
              aria-hidden="true"
              className="bg-jati/30 absolute top-4 bottom-4 left-[27px] w-px md:left-1/2 md:-ml-px"
            />
            <ol className="space-y-12">
              {t.steps.map((step, i) => {
                const right = i % 2 === 1;
                return (
                  <li
                    key={step.title}
                    className="relative flex flex-col pl-20 md:flex-row md:items-center md:justify-between md:pl-0"
                  >
                    {right && <div className="hidden md:block md:w-[45%]" />}
                    <div className={`md:w-[45%] ${right ? "md:pl-12" : "md:pr-12 md:text-right"}`}>
                      <h3 className="font-display text-accent-strong text-xl font-semibold">{step.title}</h3>
                      <p className="text-muted mt-2 leading-relaxed">{step.body}</p>
                    </div>
                    <span
                      aria-hidden="true"
                      className="bg-jati border-surface text-krem font-display absolute top-0 left-0 flex size-14 items-center justify-center rounded-full border-4 font-semibold md:top-auto md:left-1/2 md:-ml-7"
                    >
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    {!right && <div className="hidden md:block md:w-[45%]" />}
                  </li>
                );
              })}
            </ol>
          </div>
          <div className="mt-14 text-center">
            <WhatsAppButton message={t.whatsappMessage}>{t.orderCta}</WhatsAppButton>
          </div>
        </div>
      </section>

      {/* Visit the workshop */}
      <section className="mx-auto max-w-6xl px-4 py-24 sm:px-6">
        <div className="bg-surface border-border flex flex-col overflow-hidden rounded-[2rem] border md:flex-row">
          <div className="flex flex-col justify-center p-8 sm:p-10 md:w-1/2 md:p-14">
            <h2 className="font-display text-accent-strong text-3xl font-semibold sm:text-4xl">
              {t.visitTitle}
            </h2>
            <p className="text-muted mt-4 text-lg leading-relaxed">{t.visitBody}</p>
            <dl className="mt-8 space-y-6">
              <div>
                <dt className="text-accent text-xs font-bold tracking-[0.2em] uppercase">
                  {dict.contact.addressTitle}
                </dt>
                <dd className="mt-2 font-medium">
                  <address className="not-italic">
                    {site.address.street}
                    <br />
                    {site.address.area}, {site.address.city}
                  </address>
                </dd>
              </div>
              <div>
                <dt className="text-accent text-xs font-bold tracking-[0.2em] uppercase">
                  {dict.contact.hoursTitle}
                </dt>
                <dd className="mt-2 font-medium">
                  {dict.footer.hours}
                  <br />
                  <span className="text-muted">{dict.footer.closed}</span>
                </dd>
              </div>
            </dl>
            <div className="mt-10">
              <a
                href={site.mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={`${buttonStyles.secondary} bg-bg`}
              >
                {dict.contact.directions}
              </a>
            </div>
          </div>
          <div className="bg-walnut relative aspect-square md:aspect-auto md:w-1/2">
            <Image
              src="/images/site/visit.jpg"
              alt=""
              fill
              sizes="(min-width: 768px) 576px, 100vw"
              className="object-cover"
            />
          </div>
        </div>
      </section>
    </>
  );
}
