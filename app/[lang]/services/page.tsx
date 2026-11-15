import type { Metadata } from "next";
import Image from "next/image";
import { getDictionary, getLocale } from "@/lib/i18n/dictionaries";
import { getServices } from "@/lib/content";
import { fill } from "@/lib/format";
import { DraftBadge } from "@/components/ui/badges";
import { EmptyState, PageHeader, Section } from "@/components/ui/page-header";
import { Prose } from "@/components/ui/prose";
import { WhatsAppButton } from "@/components/ui/links";

export async function generateMetadata(): Promise<Metadata> {
  const dict = await getDictionary();
  return { title: dict.nav.services, description: dict.services.intro };
}

export default async function ServicesPage() {
  const [locale, dict] = await Promise.all([getLocale(), getDictionary()]);
  const services = getServices(locale);

  return (
    <>
      <PageHeader title={dict.nav.services} intro={dict.services.intro} />
      <Section>
        {services.length ? (
          <div className="space-y-6">
            {services.map((s) => (
              <section
                key={s.slug}
                id={s.slug}
                className="border-border bg-surface grid scroll-mt-24 overflow-hidden rounded-3xl border md:grid-cols-[2fr_3fr]"
              >
                <div className="bg-walnut relative min-h-56">
                  {s.image && (
                    <Image
                      src={s.image.src}
                      alt={s.image.alt ?? ""}
                      fill
                      sizes="(min-width: 768px) 40vw, 100vw"
                      className="object-cover"
                    />
                  )}
                </div>
                <div className="p-8">
                  {s.draft && <DraftBadge label={dict.common.draft} />}
                  <h2 className="font-display text-accent-strong mt-2 text-3xl font-semibold">{s.title}</h2>
                  {s.summary && <p className="text-muted mt-3 text-lg">{s.summary}</p>}
                  <Prose className="text-base">{s.body}</Prose>
                  <WhatsAppButton
                    message={fill(dict.services.askMessage, { title: s.title })}
                    variant="secondary"
                    className="mt-2"
                  >
                    {dict.services.ask}
                  </WhatsAppButton>
                </div>
              </section>
            ))}
          </div>
        ) : (
          <EmptyState message={dict.services.empty}>
            <WhatsAppButton message={dict.home.whatsappMessage}>{dict.common.whatsapp}</WhatsAppButton>
          </EmptyState>
        )}
      </Section>
    </>
  );
}
