import type { Metadata } from "next";
import Image from "next/image";
import { getDictionary, getLocale } from "@/lib/i18n/dictionaries";
import { getTeam } from "@/lib/content";
import { DraftBadge } from "@/components/ui/badges";
import { EmptyState, PageHeader, Section } from "@/components/ui/page-header";
import { Prose } from "@/components/ui/prose";

export async function generateMetadata(): Promise<Metadata> {
  const dict = await getDictionary();
  return { title: dict.nav.team, description: dict.team.intro };
}

export default async function TeamPage() {
  const [locale, dict] = await Promise.all([getLocale(), getDictionary()]);
  const team = getTeam(locale);

  return (
    <>
      <PageHeader title={dict.nav.team} intro={dict.team.intro} />
      <Section>
        {team.length ? (
          <ul className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {team.map((m) => (
              <li key={m.slug}>
                <div className="bg-walnut relative aspect-square overflow-hidden rounded-3xl">
                  {m.photo && (
                    <Image
                      src={m.photo.src}
                      alt={m.photo.alt}
                      fill
                      sizes="(min-width: 1024px) 33vw, 50vw"
                      className="object-cover"
                    />
                  )}
                </div>
                <div className="mt-4 flex items-center gap-2">
                  <h2 className="font-display text-accent-strong text-xl font-semibold">{m.name}</h2>
                  {m.draft && <DraftBadge label={dict.common.draft} />}
                </div>
                {m.role && <p className="text-accent text-sm font-semibold">{m.role}</p>}
                <Prose className="text-base">{m.body}</Prose>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState message={dict.team.empty} />
        )}
      </Section>
    </>
  );
}
