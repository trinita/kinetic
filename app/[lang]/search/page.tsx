import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { getDictionary, getLocale } from "@/lib/i18n/dictionaries";
import { href, type Locale } from "@/lib/i18n/routing";
import type { Dictionary } from "@/lib/i18n/dictionary-data";
import { fill } from "@/lib/format";
import { search } from "@/lib/search";
import { PageHeader, Section } from "@/components/ui/page-header";
import { WhatsAppButton } from "@/components/ui/links";
import { ResultContent } from "@/components/search/result-item";

export async function generateMetadata(): Promise<Metadata> {
  const dict = await getDictionary();
  return { title: dict.nav.search, robots: { index: false } };
}

export default async function SearchPage({ searchParams }: PageProps<"/[lang]/search">) {
  const [locale, dict] = await Promise.all([getLocale(), getDictionary()]);
  return (
    <>
      <PageHeader title={dict.nav.search} intro={dict.search.intro} />
      <Section>
        {/* Works without JavaScript: a plain GET form to this page. */}
        <Suspense fallback={<SearchForm locale={locale} dict={dict} />}>
          <Results locale={locale} dict={dict} searchParams={searchParams} />
        </Suspense>
      </Section>
    </>
  );
}

function SearchForm({ locale, dict, query = "" }: { locale: Locale; dict: Dictionary; query?: string }) {
  return (
    <form role="search" action={href(locale, "search")} className="flex max-w-2xl gap-3">
      <input
        type="search"
        name="q"
        defaultValue={query}
        aria-label={dict.search.label}
        placeholder={dict.search.placeholder}
        className="border-border bg-surface focus:border-accent flex-1 rounded-full border px-5 py-3 text-lg outline-none"
      />
      <button
        type="submit"
        className="bg-accent-strong text-on-accent-strong rounded-full px-6 py-3 font-semibold hover:opacity-90"
      >
        {dict.search.open}
      </button>
    </form>
  );
}

async function Results({
  locale,
  dict,
  searchParams,
}: {
  locale: Locale;
  dict: Dictionary;
  searchParams: PageProps<"/[lang]/search">["searchParams"];
}) {
  const raw = (await searchParams).q;
  const query = (Array.isArray(raw) ? raw[0] : raw)?.trim() ?? "";
  const results = query ? await search(locale, query, 30) : [];

  return (
    <>
      <SearchForm locale={locale} dict={dict} query={query} />
      {!query && <p className="text-muted mt-6">{dict.search.hint}</p>}
      {query && results.length > 0 && (
        <>
          <p className="text-muted mt-8 text-sm" aria-live="polite">
            {fill(dict.search.results, { n: results.length, q: query })}
          </p>
          <ul className="mt-4 max-w-3xl space-y-2">
            {results.map((r) => (
              <li key={r.id}>
                <Link href={r.url} className="hover:bg-surface block rounded-2xl p-3 transition">
                  <ResultContent result={r} typeLabel={dict.search.types[r.type]} />
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}
      {query && !results.length && (
        <div className="mt-8 max-w-2xl">
          <p className="text-muted" aria-live="polite">
            {fill(dict.search.empty, { q: query })}
          </p>
          <WhatsAppButton message={dict.home.whatsappMessage} className="mt-6">
            {dict.common.whatsapp}
          </WhatsAppButton>
        </div>
      )}
    </>
  );
}
