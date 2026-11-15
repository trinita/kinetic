"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { locales, switchLocalePath, type Locale } from "@/lib/i18n/routing";

/** "ID | EN" toggle that keeps the visitor on the same page. */
export function LanguageSwitcher({ locale, label }: { locale: Locale; label: string }) {
  const pathname = usePathname();
  return (
    <nav
      aria-label={label}
      className="border-border flex items-center rounded-full border p-0.5 text-xs font-semibold"
    >
      {locales.map((l) => (
        <Link
          key={l}
          href={switchLocalePath(pathname, l)}
          hrefLang={l}
          lang={l}
          aria-current={l === locale ? "true" : undefined}
          className="text-muted hover:text-fg aria-[current=true]:bg-accent-strong aria-[current=true]:text-on-accent-strong rounded-full px-2.5 py-1 uppercase transition"
        >
          {l}
        </Link>
      ))}
    </nav>
  );
}
