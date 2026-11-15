import Link from "next/link";
import { getDictionary, getLocale } from "@/lib/i18n/dictionaries";
import { href } from "@/lib/i18n/routing";

export default async function NotFound() {
  const [locale, dict] = await Promise.all([getLocale(), getDictionary()]);
  return (
    <section className="mx-auto max-w-6xl px-4 py-24 sm:px-6">
      <p className="font-display text-accent text-7xl font-semibold">404</p>
      <h1 className="font-display text-accent-strong mt-4 text-3xl font-semibold">{dict.notFound.title}</h1>
      <p className="text-muted mt-3">{dict.notFound.body}</p>
      <Link
        href={href(locale, "home")}
        className="text-accent mt-8 inline-block font-semibold underline underline-offset-4"
      >
        {dict.notFound.back}
      </Link>
    </section>
  );
}
