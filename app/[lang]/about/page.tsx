import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { getDictionary, getLocale } from "@/lib/i18n/dictionaries";
import { href } from "@/lib/i18n/routing";
import { getPage } from "@/lib/content";
import { PageHeader, Section } from "@/components/ui/page-header";
import { Prose } from "@/components/ui/prose";
import { DraftBadge } from "@/components/ui/badges";
import { VisitInfo, WorkshopMap } from "@/components/contact/visit-info";

export async function generateMetadata(): Promise<Metadata> {
  const dict = await getDictionary();
  return { title: dict.nav.about, description: dict.about.lead };
}

export default async function AboutPage() {
  const [locale, dict] = await Promise.all([getLocale(), getDictionary()]);
  const story = getPage(locale, "about");
  const t = dict.about;

  return (
    <>
      <PageHeader title={story?.title ?? dict.nav.about} intro={t.lead} />

      <Section>
        <div className="grid items-start gap-10 md:grid-cols-[3fr_2fr]">
          <div>
            {story && (
              <>
                {story.draft && <DraftBadge label={dict.common.draft} />}
                <Prose>{story.body}</Prose>
              </>
            )}
            <Link
              href={href(locale, "team")}
              className="text-accent mt-4 inline-block font-semibold underline underline-offset-4"
            >
              {t.teamLink} →
            </Link>
          </div>
          <div className="bg-walnut relative aspect-[4/5] overflow-hidden rounded-3xl">
            <Image
              src="/images/site/about.jpg"
              alt=""
              fill
              sizes="(min-width: 768px) 40vw, 100vw"
              className="object-cover"
            />
          </div>
        </div>
      </Section>

      <Section>
        <h2 className="font-display text-accent-strong text-3xl font-semibold">{t.valuesTitle}</h2>
        <ul className="mt-8 grid gap-6 md:grid-cols-3">
          {t.values.map((v) => (
            <li key={v.title} className="border-border bg-surface rounded-3xl border p-6">
              <h3 className="font-display text-accent-strong text-xl font-semibold">{v.title}</h3>
              <p className="text-muted mt-2 leading-relaxed">{v.body}</p>
            </li>
          ))}
        </ul>
      </Section>

      <Section>
        <h2 className="font-display text-accent-strong text-3xl font-semibold">{t.visitTitle}</h2>
        <div className="mt-8 grid gap-10 md:grid-cols-[2fr_3fr]">
          <VisitInfo dict={dict} />
          <WorkshopMap title={dict.contact.mapTitle} />
        </div>
      </Section>
    </>
  );
}
