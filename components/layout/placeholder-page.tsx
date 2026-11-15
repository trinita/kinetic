import Link from "next/link";
import type { Metadata } from "next";
import { getDictionary, getLocale } from "@/lib/i18n/dictionaries";
import { href, type RouteKey } from "@/lib/i18n/routing";

type NavKey = Exclude<RouteKey, "home">;

/** Builds a "coming soon" page for a section that hasn't been built yet. */
export function placeholderPage(key: NavKey) {
  async function generateMetadata(): Promise<Metadata> {
    const dict = await getDictionary();
    return { title: dict.nav[key] };
  }

  async function Page() {
    const [locale, dict] = await Promise.all([getLocale(), getDictionary()]);
    return (
      <section className="mx-auto max-w-6xl px-4 py-24 sm:px-6">
        <h1 className="font-display text-accent-strong text-4xl font-semibold sm:text-5xl">
          {dict.nav[key]}
        </h1>
        <p className="text-muted mt-4 text-lg">{dict.placeholder.comingSoon}</p>
        <Link
          href={href(locale, "home")}
          className="text-accent mt-8 inline-block font-semibold underline underline-offset-4"
        >
          {dict.placeholder.back}
        </Link>
      </section>
    );
  }

  return { Page, generateMetadata };
}
