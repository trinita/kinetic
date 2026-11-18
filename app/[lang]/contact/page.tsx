import type { Metadata } from "next";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { site } from "@/lib/site";
import { PageHeader, Section } from "@/components/ui/page-header";
import { WhatsAppButton } from "@/components/ui/links";
import { EnquiryForm } from "@/components/contact/enquiry-form";
import { VisitInfo, WorkshopMap } from "@/components/contact/visit-info";

export async function generateMetadata(): Promise<Metadata> {
  const dict = await getDictionary();
  return { title: dict.nav.contact, description: dict.contact.intro };
}

export default async function ContactPage() {
  const dict = await getDictionary();
  const t = dict.contact;

  return (
    <>
      <PageHeader title={dict.nav.contact} intro={t.intro}>
        <WhatsAppButton message={dict.home.whatsappMessage} className="mt-8">
          {site.whatsappDisplay}
        </WhatsAppButton>
      </PageHeader>

      <Section>
        <div className="grid gap-10 md:grid-cols-2">
          <div className="border-border bg-surface rounded-3xl border p-6 sm:p-8">
            <h2 className="font-display text-accent-strong text-2xl font-semibold">{t.formTitle}</h2>
            <div className="mt-6">
              <EnquiryForm
                labels={{
                  name: t.name,
                  interest: t.interest,
                  interestPlaceholder: t.interestPlaceholder,
                  message: t.message,
                  messagePlaceholder: t.messagePlaceholder,
                  send: t.send,
                  note: t.note,
                  template: t.template,
                }}
              />
            </div>
          </div>
          <div className="flex flex-col gap-8">
            <VisitInfo dict={dict} />
            <WorkshopMap title={t.mapTitle} className="md:h-auto md:flex-1" />
          </div>
        </div>
      </Section>
    </>
  );
}
