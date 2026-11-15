import Link from "next/link";
import { getDictionary, getLocale } from "@/lib/i18n/dictionaries";
import { href } from "@/lib/i18n/routing";
import { whatsappLink } from "@/lib/site";
import { Logo } from "@/components/ui/logo";
import { WhatsAppIcon } from "@/components/ui/icons";
import { NavLinks } from "./nav-links";
import { LanguageSwitcher } from "./language-switcher";
import { SearchDialog } from "@/components/search/search-dialog";
import { mainNav } from "./nav-items";

export async function Header() {
  const [locale, dict] = await Promise.all([getLocale(), getDictionary()]);
  const items = mainNav.map((key) => ({ href: href(locale, key), label: dict.nav[key] }));
  const wa = whatsappLink(dict.home.whatsappMessage);

  return (
    <header className="border-border bg-bg/90 sticky top-0 z-40 border-b backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-6 px-4 sm:px-6">
        <Link href={href(locale, "home")} aria-label="Kinetic" className="shrink-0">
          <Logo className="h-9 w-auto" />
        </Link>

        <nav aria-label={dict.header.mainNav} className="ml-4 hidden lg:block">
          <NavLinks items={items} className="flex items-center gap-6 text-sm font-medium" />
        </nav>

        <div className="ml-auto flex items-center gap-3">
          <SearchDialog
            locale={locale}
            searchPage={href(locale, "search")}
            labels={{
              label: dict.search.label,
              placeholder: dict.search.placeholder,
              open: dict.search.open,
              close: dict.search.close,
              loading: dict.search.loading,
              empty: dict.search.empty,
              hint: dict.search.hint,
              seeAll: dict.search.seeAll,
              types: dict.search.types,
            }}
          />
          <LanguageSwitcher locale={locale} label={dict.header.switchLanguage} />
          <a
            href={wa}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-accent-strong text-on-accent-strong hidden items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition hover:opacity-90 sm:inline-flex"
          >
            <WhatsAppIcon className="size-4" />
            {dict.header.whatsapp}
          </a>

          {/* Mobile menu: <details> works without JavaScript */}
          <details className="group relative lg:hidden">
            <summary className="border-border flex cursor-pointer list-none items-center rounded-full border px-4 py-2 text-sm font-medium [&::-webkit-details-marker]:hidden">
              {dict.header.menu}
            </summary>
            <nav
              aria-label={dict.header.mainNav}
              className="border-border bg-surface absolute right-0 mt-2 w-56 rounded-2xl border p-3 shadow-lg"
            >
              <NavLinks
                items={items}
                className="flex flex-col gap-1 text-base"
                itemClassName="block rounded-lg px-3 py-2 hover:bg-bg"
              />
              <a
                href={wa}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-accent-strong text-on-accent-strong mt-2 flex items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-semibold sm:hidden"
              >
                <WhatsAppIcon className="size-4" />
                {dict.header.whatsapp}
              </a>
            </nav>
          </details>
        </div>
      </div>
    </header>
  );
}
