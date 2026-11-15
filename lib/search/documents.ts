// Everything on the site that search can find, as plain-text documents per locale.

import { getArticles, getPage, getProducts, getServices, getTeam } from "@/lib/content";
import { dictionaries } from "@/lib/i18n/dictionary-data";
import { href, type Locale } from "@/lib/i18n/routing";
import { site } from "@/lib/site";
import { markdownToText, type SearchDoc } from "./core";

const join = (...parts: (string | undefined | false)[]) => parts.filter(Boolean).join("\n");

export function buildDocuments(locale: Locale): SearchDoc[] {
  const dict = dictionaries[locale];
  const docs: SearchDoc[] = [];
  const id = (type: string, slug: string) => `${locale}:${type}:${slug}`;

  for (const p of getProducts(locale)) {
    docs.push({
      id: id("product", p.slug),
      type: "product",
      title: p.title,
      url: href(locale, "products", p.slug),
      summary: p.summary,
      image: p.images[0],
      keywords: join(
        p.category && dict.categories[p.category],
        ...p.woods,
        ...p.finishes,
        ...p.customizable,
        p.dimensions,
      ).replace(/\n/g, ", "),
      text: join(p.summary, markdownToText(p.body)),
    });
  }

  for (const s of getServices(locale)) {
    docs.push({
      id: id("service", s.slug),
      type: "service",
      title: s.title,
      url: `${href(locale, "services")}#${s.slug}`,
      summary: s.summary,
      image: s.image && { src: s.image.src, alt: s.image.alt ?? "" },
      text: join(s.summary, markdownToText(s.body)),
    });
  }

  for (const [kind, type] of [
    ["case-studies", "project"],
    ["blog", "article"],
  ] as const) {
    for (const a of getArticles(kind, locale)) {
      docs.push({
        id: id(type, a.slug),
        type,
        title: a.title,
        url: href(locale, kind === "blog" ? "blog" : "caseStudies", a.slug),
        summary: a.excerpt,
        image: a.cover,
        text: join(a.excerpt, a.location, markdownToText(a.body)),
      });
    }
  }

  for (const m of getTeam(locale)) {
    docs.push({
      id: id("member", m.slug),
      type: "member",
      title: m.name,
      url: href(locale, "team"),
      summary: m.role,
      image: m.photo,
      text: join(m.role, markdownToText(m.body)),
    });
  }

  // Practical information from the site itself.
  const address = `${site.address.street}, ${site.address.area}, ${site.address.city}`;
  const hours = `${dict.footer.hours}. ${dict.footer.closed}.`;
  docs.push(
    {
      id: id("page", "contact"),
      type: "page",
      title: dict.nav.contact,
      url: href(locale, "contact"),
      summary: `${address} · ${dict.footer.hours}`,
      text: join(
        dict.contact.intro,
        `${dict.contact.addressTitle}: ${address}`,
        `${dict.contact.hoursTitle}: ${hours}`,
        `WhatsApp ${site.whatsappDisplay}`,
        `Instagram ${site.instagram.handle}`,
      ),
    },
    {
      id: id("page", "order"),
      type: "page",
      title: dict.home.processTitle,
      url: `${href(locale, "home")}#order`,
      summary: dict.home.processIntro,
      text: join(dict.home.processIntro, ...dict.home.steps.map((s) => `${s.title}. ${s.body}`)),
    },
    {
      id: id("page", "about"),
      type: "page",
      title: dict.nav.about,
      url: href(locale, "about"),
      summary: dict.about.lead,
      text: join(
        dict.about.lead,
        ...dict.about.values.map((v) => `${v.title}. ${v.body}`),
        markdownToText(getPage(locale, "about")?.body ?? ""),
      ),
    },
  );

  return docs;
}
