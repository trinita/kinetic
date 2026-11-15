import type { Dictionary } from "@/lib/i18n/dictionaries";
import { site } from "@/lib/site";

/** Address, opening hours and a directions link — used on About and Contact. */
export function VisitInfo({ dict }: { dict: Dictionary }) {
  const t = dict.contact;
  return (
    <dl className="space-y-6">
      <div>
        <dt className="font-display text-accent-strong text-lg font-semibold">{t.addressTitle}</dt>
        <dd className="text-muted mt-1">
          <address className="not-italic">
            {site.address.street}
            <br />
            {site.address.area}
            <br />
            {site.address.city}
          </address>
          <a
            href={site.mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent mt-2 inline-block font-semibold underline underline-offset-4"
          >
            {t.directions}
          </a>
        </dd>
      </div>
      <div>
        <dt className="font-display text-accent-strong text-lg font-semibold">{t.hoursTitle}</dt>
        <dd className="text-muted mt-1">
          {dict.footer.hours}
          <br />
          {dict.footer.closed}
        </dd>
      </div>
    </dl>
  );
}

/** Google Maps embed of the workshop location (no API key needed). */
export function WorkshopMap({ title }: { title: string }) {
  const q = encodeURIComponent(`${site.address.street}, ${site.address.area}, ${site.address.city}`);
  return (
    <iframe
      title={title}
      src={`https://www.google.com/maps?q=${q}&output=embed`}
      loading="lazy"
      referrerPolicy="no-referrer-when-downgrade"
      className="border-border h-80 w-full rounded-3xl border md:h-full md:min-h-96"
    />
  );
}
