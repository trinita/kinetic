// Product form helpers that are safe to use in the browser (no Node APIs).

import { productCategories, productRequiredToPublish } from "@/lib/content/schemas";

export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const clean = (list: string[]) => list.map((s) => s.trim()).filter(Boolean);

/** What the edit form works with (empty strings / null for anything not filled in). */
export type ProductForm = {
  title: string;
  status: "draft" | "published";
  featured: boolean;
  category: (typeof productCategories)[number] | "";
  images: { image: string; alt: string; altEn: string }[];
  summary: string;
  body: string;
  woods: string[];
  finishes: string[];
  customizable: string[];
  dimensions: string;
  leadTimeWeeks: number | null;
  madeToOrder: "yes" | "no" | "";
  priceFrom: number | null;
  en: {
    title: string;
    summary: string;
    body: string;
    woods: string[];
    finishes: string[];
    customizable: string[];
  };
};

export const emptyProduct = (): ProductForm => ({
  title: "",
  status: "draft",
  featured: false,
  category: "",
  images: [],
  summary: "",
  body: "",
  woods: [],
  finishes: [],
  customizable: [],
  dimensions: "",
  leadTimeWeeks: null,
  madeToOrder: "",
  priceFrom: null,
  en: { title: "", summary: "", body: "", woods: [], finishes: [], customizable: [] },
});

/** What's still missing before a published product can appear on the site. */
export function missingForPublish(form: ProductForm): string[] {
  const labels: Record<string, string> = {
    category: "kategori",
    summary: "ringkasan",
    dimensions: "ukuran",
    leadTimeWeeks: "waktu pengerjaan",
    madeToOrder: "ketersediaan",
  };
  const missing: string[] = productRequiredToPublish
    .filter((k) => {
      const v = form[k];
      return v === null || v === "";
    })
    .map((k) => labels[k]);
  if (!clean(form.woods).length) missing.push("jenis kayu");
  if (!form.images.length) missing.push("foto");
  return missing;
}

/** "Meja Jati Bundar" → "meja-jati-bundar" */
export function slugify(title: string): string {
  return title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}
