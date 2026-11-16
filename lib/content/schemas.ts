import { z } from "zod";

export const status = z.enum(["draft", "published"]).default("draft");

export const productCategories = ["meja", "kursi", "bangku", "rak", "lemari", "dekorasi", "lainnya"] as const;
export type ProductCategory = (typeof productCategories)[number];

const strings = z.array(z.string()).default([]);

// ---- Products: one YAML file per product (edited in the admin, /admin), both languages inside.
const translatedList = z.array(z.string()).default([]);

export const productFile = z.object({
  title: z.string(),
  status,
  featured: z.boolean().default(false),
  category: z.enum(productCategories).optional(),
  images: z
    .array(
      z.object({
        image: z.string().startsWith("/images/"),
        alt: z.string().optional(),
        altEn: z.string().optional(),
      }),
    )
    .default([]),
  summary: z.string().optional(),
  body: z.string().default(""),
  woods: translatedList,
  finishes: translatedList,
  customizable: translatedList,
  dimensions: z.string().optional(),
  leadTimeWeeks: z.number().int().positive().optional(),
  madeToOrder: z.enum(["yes", "no"]).optional(),
  priceFrom: z.number().int().positive().optional(),
  en: z
    .object({
      title: z.string().optional(),
      summary: z.string().optional(),
      body: z.string().optional(),
      woods: translatedList,
      finishes: translatedList,
      customizable: translatedList,
    })
    .default({ woods: [], finishes: [], customizable: [] }),
});

/** Fields a product needs before it can be shown on the live site. */
export const productRequiredToPublish = [
  "category",
  "summary",
  "dimensions",
  "leadTimeWeeks",
  "madeToOrder",
] as const;

// ---- Services
export const serviceId = z.object({
  title: z.string(),
  status,
  order: z.number().default(99),
  summary: z.string().optional(),
  image: z.object({ src: z.string(), alt: z.string().optional() }).optional(),
});
export const serviceEn = z.object({ title: z.string().optional(), status, summary: z.string().optional() });

// ---- Articles (blog posts and case studies / projects)
export const articleId = z.object({
  title: z.string(),
  status,
  date: z.coerce.date().optional(),
  excerpt: z.string().optional(),
  cover: z.object({ src: z.string(), alt: z.string().optional() }).optional(),
  location: z.string().optional(),
  products: strings, // product slugs shown with a case study
});
export const articleEn = z.object({
  title: z.string().optional(),
  status,
  excerpt: z.string().optional(),
  cover: z.object({ alt: z.string().optional() }).optional(),
});

// ---- Team members
export const memberId = z.object({
  name: z.string(),
  status,
  role: z.string().optional(),
  order: z.number().default(99),
  photo: z.object({ src: z.string(), alt: z.string().optional() }).optional(),
});
export const memberEn = z.object({ status, role: z.string().optional() });

// ---- Standalone pages (about)
export const pageId = z.object({ title: z.string(), status });
export const pageEn = z.object({ title: z.string().optional(), status });
