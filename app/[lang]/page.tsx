import Link from "next/link";
import { getDictionary, getLocale } from "@/lib/i18n/dictionaries";
import { href } from "@/lib/i18n/routing";
import { whatsappLink } from "@/lib/site";
import { WhatsAppIcon } from "@/components/ui/icons";

// Phase 1 home: hero only. Featured products, process and testimonials come in phase 2.
export default async function Home() {
  const [locale, dict] = await Promise.all([getLocale(), getDictionary()]);

  return (
    <section className="relative overflow-hidden">
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-20 sm:px-6 md:grid-cols-[3fr_2fr] md:py-28">
        <div>
          <p className="text-accent text-xs font-bold tracking-[0.3em] uppercase">{dict.home.eyebrow}</p>
          <h1 className="font-display text-accent-strong mt-4 text-5xl leading-[1.05] font-semibold text-balance sm:text-6xl">
            {dict.home.title}
          </h1>
          <p className="text-muted mt-6 max-w-xl text-lg leading-relaxed">{dict.home.lead}</p>
          <div className="mt-10 flex flex-wrap gap-3">
            <Link
              href={href(locale, "products")}
              className="bg-accent-strong text-on-accent-strong rounded-full px-6 py-3 font-semibold transition hover:opacity-90"
            >
              {dict.home.ctaProducts}
            </Link>
            <a
              href={whatsappLink(dict.home.whatsappMessage)}
              target="_blank"
              rel="noopener noreferrer"
              className="border-border bg-surface hover:border-accent inline-flex items-center gap-2 rounded-full border px-6 py-3 font-semibold transition"
            >
              <WhatsAppIcon className="size-5" />
              {dict.home.ctaWhatsapp}
            </a>
          </div>
        </div>

        {/* Stand-in for a workshop photo until real photos arrive */}
        <div
          aria-hidden="true"
          className="bg-walnut relative mx-auto flex aspect-[4/5] w-full max-w-64 items-center justify-center overflow-hidden rounded-[2rem] shadow-xl md:max-w-sm"
        >
          <div className="absolute inset-0 opacity-25 [background:repeating-radial-gradient(ellipse_at_20%_110%,transparent_0_18px,var(--color-jati)_19px_20px)]" />
          {/* eslint-disable-next-line @next/next/no-img-element -- decorative static SVG */}
          <img src="/brand/kinetic-icon-dark.svg" alt="" className="relative w-1/2" />
        </div>
      </div>
    </section>
  );
}
