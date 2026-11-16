// Reading and writing product files for the admin. Same YAML format the site reads
// (content/products/<slug>.yaml), photos in public/images/products/<slug>/.

import { randomBytes } from "node:crypto";
import { parse as parseYaml, stringify } from "yaml";
import { z } from "zod";
import { stripTodos } from "@/lib/content/parse";
import { productCategories, productFile } from "@/lib/content/schemas";
import { clean, type ProductForm } from "./products-shared";
import type { FileChange, Storage } from "./storage";

export * from "./products-shared";

export const PRODUCTS_DIR = "content/products";
export const productPath = (slug: string) => `${PRODUCTS_DIR}/${slug}.yaml`;
export const imageDir = (slug: string) => `public/images/products/${slug}/`;

/** Turns a stored file into form values (tolerates missing/empty fields). */
export function toForm(yamlText: string): ProductForm {
  const raw = (parseYaml(yamlText) ?? {}) as Record<string, unknown>;
  const p = productFile.parse(stripTodos(raw));
  return {
    title: p.title,
    status: p.status,
    featured: p.featured,
    category: p.category ?? "",
    images: p.images.map((i) => ({ image: i.image, alt: i.alt ?? "", altEn: i.altEn ?? "" })),
    summary: p.summary ?? "",
    body: p.body,
    woods: p.woods,
    finishes: p.finishes,
    customizable: p.customizable,
    dimensions: p.dimensions ?? "",
    leadTimeWeeks: p.leadTimeWeeks ?? null,
    madeToOrder: p.madeToOrder ?? "",
    priceFrom: p.priceFrom ?? null,
    en: {
      title: p.en.title ?? "",
      summary: p.en.summary ?? "",
      body: p.en.body ?? "",
      woods: p.en.woods,
      finishes: p.en.finishes,
      customizable: p.en.customizable,
    },
  };
}

/** Form values → YAML, in a stable key order. Validated with the same schema the site uses. */
export function toYaml(form: ProductForm): string {
  const data = {
    title: form.title.trim(),
    status: form.status,
    featured: form.featured,
    category: form.category,
    images: form.images.map((i) => ({ image: i.image, alt: i.alt.trim(), altEn: i.altEn.trim() })),
    summary: form.summary.trim(),
    body: form.body.trim(),
    woods: clean(form.woods),
    finishes: clean(form.finishes),
    customizable: clean(form.customizable),
    dimensions: form.dimensions.trim(),
    leadTimeWeeks: form.leadTimeWeeks,
    madeToOrder: form.madeToOrder,
    priceFrom: form.priceFrom,
    en: {
      title: form.en.title.trim(),
      summary: form.en.summary.trim(),
      body: form.en.body.trim(),
      woods: clean(form.en.woods),
      finishes: clean(form.en.finishes),
      customizable: clean(form.en.customizable),
    },
  };
  productFile.parse(stripTodos(data)); // throws if the site couldn't read it
  return stringify(data, { lineWidth: 0 });
}

// ---------- Input from the admin form

export const formSchema = z.object({
  title: z.string().trim().min(1, "Nama produk wajib diisi").max(120),
  status: z.enum(["draft", "published"]),
  featured: z.boolean(),
  category: z.enum(["", ...productCategories]),
  images: z
    .array(
      z.union([
        z.object({
          kind: z.literal("existing"),
          image: z.string(),
          alt: z.string().max(300),
          altEn: z.string().max(300),
        }),
        z.object({
          kind: z.literal("new"),
          id: z.string().regex(/^[a-z0-9-]+$/),
          alt: z.string().max(300),
          altEn: z.string().max(300),
        }),
      ]),
    )
    .max(20),
  summary: z.string().max(500),
  body: z.string().max(10_000),
  woods: z.array(z.string().max(60)).max(20),
  finishes: z.array(z.string().max(60)).max(20),
  customizable: z.array(z.string().max(60)).max(20),
  dimensions: z.string().max(120),
  leadTimeWeeks: z.number().int().min(1).max(104).nullable(),
  madeToOrder: z.enum(["", "yes", "no"]),
  priceFrom: z.number().int().min(1).max(10_000_000_000).nullable(),
  en: z.object({
    title: z.string().max(120),
    summary: z.string().max(500),
    body: z.string().max(10_000),
    woods: z.array(z.string().max(60)).max(20),
    finishes: z.array(z.string().max(60)).max(20),
    customizable: z.array(z.string().max(60)).max(20),
  }),
});
export type FormInput = z.infer<typeof formSchema>;

const IMAGE_TYPES: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };
export const MAX_IMAGE_BYTES = 3 * 1024 * 1024;

/** Builds the file changes for one save: the product YAML, new photos, and removed photos. */
export async function buildSave({
  storage,
  slug,
  input,
  newImages,
}: {
  storage: Storage;
  slug: string;
  input: FormInput;
  newImages: Map<string, File>;
}): Promise<{ changes: FileChange[]; form: ProductForm }> {
  const dir = imageDir(slug);
  const changes: FileChange[] = [];

  const images: ProductForm["images"] = [];
  for (const img of input.images) {
    if (img.kind === "existing") {
      if (!img.image.startsWith("/images/")) throw new Error("Invalid image path");
      images.push({ image: img.image, alt: img.alt, altEn: img.altEn });
      continue;
    }
    const file = newImages.get(img.id);
    if (!file) throw new Error("A new photo is missing from the upload");
    const ext = IMAGE_TYPES[file.type];
    if (!ext) throw new Error("Photos must be JPEG, PNG or WebP");
    if (file.size > MAX_IMAGE_BYTES) throw new Error("Photo too large");
    const name = `${Date.now().toString(36)}-${randomBytes(3).toString("hex")}.${ext}`;
    changes.push({ path: `${dir}${name}`, data: Buffer.from(await file.arrayBuffer()) });
    images.push({ image: `/${dir.replace(/^public\//, "")}${name}`, alt: img.alt, altEn: img.altEn });
  }

  // Photos of this product that are no longer used are deleted (only inside its own folder).
  const kept = new Set(images.map((i) => `public${i.image}`));
  for (const existing of await storage.list(dir)) {
    if (!kept.has(existing.path)) changes.push({ path: existing.path, data: null });
  }

  const form: ProductForm = { ...input, images };
  changes.push({ path: productPath(slug), data: Buffer.from(toYaml(form)) });
  return { changes, form };
}
