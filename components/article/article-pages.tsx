// Shared list and detail pages for blog posts and projects (case studies).

import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { lang } from "next/root-params";
import { getDictionary, getLocale } from "@/lib/i18n/dictionaries";
import { hasLocale, href, type RouteKey } from "@/lib/i18n/routing";
import { getArticle, getArticles, getProducts, slugParams, type ArticleKind } from "@/lib/content";
import { formatDate } from "@/lib/format";
import { DraftBadge } from "@/components/ui/badges";
import { EmptyState, NotTranslatedNotice, PageHeader, Section } from "@/components/ui/page-header";
import { InstagramLink } from "@/components/ui/links";
import { Prose } from "@/components/ui/prose";
import { ProductCard } from "@/components/product/product-card";
import { toCard } from "@/components/product/to-card";

const routeKey: Record<ArticleKind, RouteKey> = { blog: "blog", "case-studies": "caseStudies" };

export function articleListPage(kind: ArticleKind) {
  const key = routeKey[kind];

  async function generateMetadata(): Promise<Metadata> {
    const dict = await getDictionary();
    return { title: dict.nav[key as "blog" | "caseStudies"] };
  }

  async function Page() {
    const [locale, dict] = await Promise.all([getLocale(), getDictionary()]);
    const articles = getArticles(kind, locale);
    const t = dict.articles;

    return (
      <>
        <PageHeader
          title={dict.nav[key as "blog" | "caseStudies"]}
          intro={kind === "blog" ? t.blogIntro : t.caseIntro}
        />
        <Section>
          {articles.length ? (
            <ul className="grid gap-8 md:grid-cols-2">
              {articles.map((a) => (
                <li key={a.slug}>
                  <Link href={href(locale, key, a.slug)} className="group block">
                    <div className="bg-walnut relative aspect-[3/2] overflow-hidden rounded-3xl">
                      {a.cover && (
                        <Image
                          src={a.cover.src}
                          alt={a.cover.alt}
                          fill
                          sizes="(min-width: 768px) 50vw, 100vw"
                          className="object-cover transition duration-500 group-hover:scale-105"
                        />
                      )}
                    </div>
                    <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
                      {a.date && <time className="text-muted">{formatDate(locale, a.date)}</time>}
                      {a.location && <span className="text-muted">· {a.location}</span>}
                      {a.draft && <DraftBadge label={dict.common.draft} />}
                    </div>
                    <h2 className="font-display text-accent-strong mt-1 text-2xl font-semibold group-hover:underline">
                      {a.title}
                    </h2>
                    {a.excerpt && <p className="text-muted mt-2 leading-relaxed">{a.excerpt}</p>}
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState message={t.empty}>
              <InstagramLink>{dict.common.seeInstagram}</InstagramLink>
            </EmptyState>
          )}
        </Section>
      </>
    );
  }

  return { Page, generateMetadata };
}

export function articleDetailPage(kind: ArticleKind) {
  const key = routeKey[kind];
  type Props = { params: Promise<{ slug: string }> };

  async function generateStaticParams() {
    const locale = await lang();
    return slugParams(hasLocale(locale) ? getArticles(kind, locale).map((a) => a.slug) : []);
  }

  async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { slug } = await params;
    const a = getArticle(kind, await getLocale(), slug);
    if (!a) return {};
    return {
      title: a.title,
      description: a.excerpt,
      openGraph: { type: "article", images: a.cover ? [{ url: a.cover.src, alt: a.cover.alt }] : [] },
    };
  }

  async function Page({ params }: Props) {
    const { slug } = await params;
    const [locale, dict] = await Promise.all([getLocale(), getDictionary()]);
    const a = getArticle(kind, locale, slug);
    if (!a) notFound();
    const related = getProducts(locale).filter((p) => a.products.includes(p.slug));
    const t = dict.articles;

    return (
      <article className="pb-20">
        {!a.translated && <NotTranslatedNotice text={dict.common.notTranslated} />}
        <PageHeader title={a.title} intro={a.excerpt} draftLabel={a.draft ? dict.common.draft : undefined}>
          <p className="text-muted mt-4 text-sm">
            {a.date && <time>{formatDate(locale, a.date)}</time>}
            {a.location && ` · ${t.location}: ${a.location}`}
          </p>
        </PageHeader>
        {a.cover && (
          <div className="bg-walnut relative mx-auto aspect-[16/9] max-w-6xl overflow-hidden sm:rounded-3xl">
            <Image
              src={a.cover.src}
              alt={a.cover.alt}
              fill
              priority
              sizes="(min-width: 1152px) 1152px, 100vw"
              className="object-cover"
            />
          </div>
        )}
        <Section className="mt-10">
          <Prose>{a.body}</Prose>
          {related.length > 0 && (
            <div className="mt-14">
              <h2 className="font-display text-accent-strong text-2xl font-semibold">{t.relatedProducts}</h2>
              <ul className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {related.map((p) => (
                  <li key={p.slug}>
                    <ProductCard product={toCard(p, locale, dict)} draftLabel={dict.common.draft} />
                  </li>
                ))}
              </ul>
            </div>
          )}
          <Link
            href={href(locale, key)}
            className="text-accent mt-12 inline-block font-semibold underline underline-offset-4"
          >
            ← {kind === "blog" ? t.all : t.allProjects}
          </Link>
        </Section>
      </article>
    );
  }

  return { Page, generateMetadata, generateStaticParams };
}
