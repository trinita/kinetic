import Link from "next/link";
import { cacheLife } from "next/cache";
import { getDictionary, getLocale } from "@/lib/i18n/dictionaries";
import { href } from "@/lib/i18n/routing";
import { site, whatsappLink } from "@/lib/site";
import { WhatsAppIcon } from "@/components/ui/icons";
import { footerNav } from "./nav-items";

/** Current year for the copyright line, refreshed daily. */
async function currentYear() {
  "use cache";
  cacheLife("days");
  return new Date().getFullYear();
}

export async function Footer() {
  const [locale, dict, year] = await Promise.all([getLocale(), getDictionary(), currentYear()]);

  return (
    <footer className="bg-walnut text-krem">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-[2fr_1fr_1fr]">
        <div>
          {/* eslint-disable-next-line @next/next/no-img-element -- static SVG logo, no optimisation needed */}
          <img src="/brand/kinetic-logo-dark.svg" alt="Kinetic — Bengkel Kayu" className="h-12 w-auto" />
          <p className="text-oak mt-4 max-w-sm text-sm">{dict.footer.tagline}</p>
        </div>

        <div>
          <h2 className="font-display text-lg font-semibold">{dict.footer.explore}</h2>
          <ul className="text-oak mt-3 space-y-2 text-sm">
            {footerNav.map((key) => (
              <li key={key}>
                <Link href={href(locale, key)} className="hover:text-krem">
                  {dict.nav[key]}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="font-display text-lg font-semibold">{dict.footer.contact}</h2>
          <ul className="text-oak mt-3 space-y-2 text-sm">
            <li>
              <a
                href={whatsappLink(dict.home.whatsappMessage)}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-krem inline-flex items-center gap-2"
              >
                <WhatsAppIcon className="size-4" />
                {site.whatsappDisplay}
              </a>
            </li>
            <li>{dict.footer.addressPending}</li>
            <li>{dict.footer.hoursPending}</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10">
        <p className="text-oak/80 mx-auto max-w-6xl px-4 py-5 text-xs sm:px-6">
          © {year} Kinetic. {dict.footer.rights}
        </p>
      </div>
    </footer>
  );
}
