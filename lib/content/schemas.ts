import { z } from "zod";

export const status = z.enum(["draft", "published"]).default("draft");

export const productCategories = ["meja", "kursi", "bangku", "rak", "lemari", "dekorasi", "lainnya"] as const;
export type ProductCategory = (typeof productCategories)[number];

const strings = z.array(z.string()).default([]);

// ---- Products: facts live in the Indonesian file; the English file only translates text.
export const productId = z.object({
  title: z.string(),
  status,
  featured: z.boolean().default(false),
  category: z.enum(productCategories).optional(),
  woods: strings,
  finishes: strings,
  dimensions: z.string().optional(),
  leadTimeWeeks: z.number().positive().optional(),
  madeToOrder: z.boolean().optional(),
  priceFrom: z.number().positive().optional(),
  customizable: strings,
  images: z
    .array(z.object({ src: z.string().startsWith("/images/"), alt: z.string().optional() }))
    .default([]),
  summary: z.string().optional(),
});

export const productEn = z.object({
  title: z.string().optional(),
  status,
  woods: z.array(z.string()).optional(),
  finishes: z.array(z.string()).optional(),
  customizable: z.array(z.string()).optional(),
  images: z.array(z.object({ alt: z.string().optional() })).optional(),
  summary: z.string().optional(),
});

/** Fields a product needs before it can be published. */
export const productRequiredToPublish = [
  "category",
  "dimensions",
  "leadTimeWeeks",
  "madeToOrder",
  "summary",
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
