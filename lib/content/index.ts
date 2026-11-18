// Loads site content:
// - products: content/products/<slug>.yaml (both languages in one file; edited in the admin at /admin)
// - everything else: content/<collection>/<slug>.<locale>.md (Indonesian required, English optional)
// Drafts are shown in development (with a badge) and hidden in production builds.

import "server-only";
import fs from "node:fs";
import path from "node:path";
import type { z } from "zod";
import type { Locale } from "@/lib/i18n/routing";
import { parse as parseYaml } from "yaml";
import { bodyHasTodo, parseDoc, stripTodos, withoutTodoLines } from "./parse";
import * as s from "./schemas";

// A fixed path so the bundler ships only content/ (tests point process.cwd() at fixtures instead).
// SHOW_DRAFTS can be overridden (used by tests and the search index script).
const contentDir = () => path.join(process.cwd(), "content");
const showDrafts = () =>
  process.env.SHOW_DRAFTS ? process.env.SHOW_DRAFTS === "true" : process.env.NODE_ENV !== "production";

type Entry<I, E> = { slug: string; id: I; idBody: string; en?: E; enBody?: string };

function readCollection<I extends z.ZodTypeAny, E extends z.ZodTypeAny>(
  dir: string,
  idSchema: I,
  enSchema: E,
): Entry<z.infer<I>, z.infer<E>>[] {
  const full = path.join(contentDir(), dir);
  if (!fs.existsSync(full)) return [];
  const files = fs.readdirSync(full).filter((f) => /^[a-z0-9-]+\.(id|en)\.md$/.test(f));
  const slugs = [...new Set(files.map((f) => f.split(".")[0]))];

  return slugs.flatMap((slug) => {
    const idFile = path.join(full, `${slug}.id.md`);
    if (!fs.existsSync(idFile))
      throw new Error(`content/${dir}/${slug}.en.md has no Indonesian file (${slug}.id.md)`);
    const parse = <S extends z.ZodTypeAny>(file: string, schema: S) => {
      const doc = parseDoc(fs.readFileSync(file, "utf8"), path.relative(process.cwd(), file));
      const result = schema.safeParse(doc.data);
      if (!result.success) {
        throw new Error(
          `${path.relative(process.cwd(), file)}: ${result.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ")}`,
        );
      }
      return { data: result.data as z.infer<S>, body: doc.body };
    };
    const id = parse(idFile, idSchema);
    const enFile = path.join(full, `${slug}.en.md`);
    const en = fs.existsSync(enFile) ? parse(enFile, enSchema) : undefined;
    return [{ slug, id: id.data, idBody: id.body, en: en?.data, enBody: en?.body }];
  });
}

/**
 * Published entries only, unless drafts are shown. A published entry that is incomplete (missing
 * required fields or still containing TODO) is hidden with a build warning instead of failing the
 * build, so one unfinished edit in the admin never blocks the rest of the site from updating.
 */
function visible<
  X extends { slug: string; id: { status: "draft" | "published" }; idBody: string; missing?: string[] },
>(dir: string, entries: X[]): X[] {
  return entries.filter((e) => {
    if (e.id.status !== "published") return showDrafts();
    const problems = [...(e.missing ?? [])];
    if (bodyHasTodo(e.idBody)) problems.push("TODO left in the text");
    if (problems.length && !showDrafts()) {
      console.warn(
        `[content] ${dir}/${e.slug} is published but hidden until complete — missing: ${problems.join(", ")}`,
      );
      return false;
    }
    return true;
  });
}

/** The English version is used only once it is published (or while drafts are shown). */
function pickEn<E extends { status: string }>(locale: Locale, en?: E): E | undefined {
  return locale === "en" && en && (showDrafts() || en.status === "published") ? en : undefined;
}

// ---------- Products

type ProductFile = z.infer<typeof s.productFile>;

function readProducts(): {
  slug: string;
  id: ProductFile & { status: "draft" | "published" };
  idBody: string;
  missing: string[];
}[] {
  const dir = path.join(contentDir(), "products");
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => /^[a-z0-9-]+\.yaml$/.test(f))
    .map((f) => {
      const file = path.join("content/products", f);
      const result = s.productFile.safeParse(
        stripTodos(parseYaml(fs.readFileSync(path.join(dir, f), "utf8")) ?? {}),
      );
      if (!result.success) {
        throw new Error(
          `${file}: ${result.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ")}`,
        );
      }
      const p = result.data;
      return {
        slug: f.replace(/\.yaml$/, ""),
        id: p,
        idBody: p.body,
        missing: [
          ...s.productRequiredToPublish.filter((k) => p[k] === undefined),
          ...(p.woods.length ? [] : ["woods"]),
          ...(p.images.length ? [] : ["images"]),
        ],
      };
    });
}

export type Product = ReturnType<typeof localizeProduct>;

function localizeProduct(e: { slug: string; id: ProductFile }, locale: Locale) {
  const p = e.id;
  const en = locale === "en" ? p.en : undefined;
  const pick = (idList: string[], enList?: string[]) => (enList?.length ? enList : idList);
  return {
    slug: e.slug,
    draft: p.status !== "published",
    translated: locale === "id" || !!(en?.title || en?.summary || en?.body),
    featured: p.featured,
    category: p.category,
    title: en?.title ?? p.title,
    summary: en?.summary ?? p.summary,
    woods: pick(p.woods, en?.woods),
    finishes: pick(p.finishes, en?.finishes),
    customizable: pick(p.customizable, en?.customizable),
    dimensions: p.dimensions,
    leadTimeWeeks: p.leadTimeWeeks,
    madeToOrder: p.madeToOrder === undefined ? undefined : p.madeToOrder === "yes",
    priceFrom: p.priceFrom,
    images: p.images.map((img) => ({
      src: img.image,
      alt: (locale === "en" ? img.altEn : undefined) ?? img.alt ?? p.title,
    })),
    body: withoutTodoLines(en?.body || p.body),
  };
}

export function getProducts(locale: Locale): Product[] {
  return visible("products", readProducts())
    .map((e) => localizeProduct(e, locale))
    .sort((a, b) => Number(b.featured) - Number(a.featured) || a.title.localeCompare(b.title));
}

export const getProduct = (locale: Locale, slug: string) => getProducts(locale).find((p) => p.slug === slug);

// ---------- Services

export function getServices(locale: Locale) {
  return visible("services", readCollection("services", s.serviceId, s.serviceEn))
    .map((e) => {
      const en = pickEn(locale, e.en);
      return {
        slug: e.slug,
        draft: e.id.status !== "published",
        order: e.id.order,
        title: en?.title ?? e.id.title,
        summary: en?.summary ?? e.id.summary,
        image: e.id.image,
        body: withoutTodoLines((en && e.enBody) || e.idBody),
      };
    })
    .sort((a, b) => a.order - b.order);
}

// ---------- Articles: blog posts and projects (case studies)

export type ArticleKind = "blog" | "case-studies";
export type Article = ReturnType<typeof getArticles>[number];

export function getArticles(kind: ArticleKind, locale: Locale) {
  return visible(kind, readCollection(kind, s.articleId, s.articleEn))
    .map((e) => {
      const en = pickEn(locale, e.en);
      return {
        slug: e.slug,
        draft: e.id.status !== "published",
        translated: locale === "id" || !!en,
        title: en?.title ?? e.id.title,
        excerpt: en?.excerpt ?? e.id.excerpt,
        date: e.id.date,
        location: e.id.location,
        products: e.id.products,
        cover: e.id.cover && { src: e.id.cover.src, alt: en?.cover?.alt ?? e.id.cover.alt ?? "" },
        body: withoutTodoLines((en && e.enBody) || e.idBody),
      };
    })
    .sort((a, b) => (b.date?.getTime() ?? 0) - (a.date?.getTime() ?? 0));
}

export const getArticle = (kind: ArticleKind, locale: Locale, slug: string) =>
  getArticles(kind, locale).find((a) => a.slug === slug);

// ---------- Team

export function getTeam(locale: Locale) {
  return visible("team", readCollection("team", s.memberId, s.memberEn))
    .map((e) => {
      const en = pickEn(locale, e.en);
      return {
        slug: e.slug,
        draft: e.id.status !== "published",
        name: e.id.name,
        role: en?.role ?? e.id.role,
        order: e.id.order,
        photo: e.id.photo && { src: e.id.photo.src, alt: e.id.photo.alt ?? e.id.name },
        body: withoutTodoLines((en && e.enBody) || e.idBody),
      };
    })
    .sort((a, b) => a.order - b.order);
}

// ---------- Standalone pages

export function getPage(locale: Locale, slug: string) {
  const e = visible("pages", readCollection("pages", s.pageId, s.pageEn)).find((p) => p.slug === slug);
  if (!e) return undefined;
  const en = pickEn(locale, e.en);
  return {
    draft: e.id.status !== "published",
    title: en?.title ?? e.id.title,
    body: withoutTodoLines((en && e.enBody) || e.idBody),
    steps: e.id.steps.map((step, i) => {
      const t = en?.steps[i];
      return {
        label: t?.label ?? step.label,
        title: t?.title ?? step.title,
        body: t?.body ?? step.body,
        image: { src: step.image.src, alt: t?.alt ?? step.image.alt },
      };
    }),
  };
}

/** Params for a [slug] route. Cache Components needs at least one, so an empty list gets a placeholder that 404s. */
export function slugParams(slugs: string[]) {
  return slugs.length ? slugs.map((slug) => ({ slug })) : [{ slug: "__none__" }];
}
