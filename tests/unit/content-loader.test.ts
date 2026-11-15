import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { getProduct, getProducts } from "@/lib/content";

const fixtures = (name: string) => path.join(__dirname, "../fixtures", name);

afterEach(() => {
  delete process.env.CONTENT_DIR;
  delete process.env.SHOW_DRAFTS;
});

describe("product loader", () => {
  it("shows only published products on the live site", () => {
    process.env.CONTENT_DIR = fixtures("ok");
    process.env.SHOW_DRAFTS = "false";
    expect(getProducts("id").map((p) => p.slug)).toEqual(["rak-jati"]);
  });

  it("shows drafts while developing", () => {
    process.env.CONTENT_DIR = fixtures("ok");
    process.env.SHOW_DRAFTS = "true";
    const draft = getProduct("id", "meja-draf");
    expect(draft?.draft).toBe(true);
    expect(draft?.leadTimeWeeks).toBeUndefined();
  });

  it("uses English text and keeps facts from the Indonesian file", () => {
    process.env.CONTENT_DIR = fixtures("ok");
    process.env.SHOW_DRAFTS = "false";
    const p = getProduct("en", "rak-jati");
    expect(p).toMatchObject({ title: "Teak Shelf", woods: ["teak"], priceFrom: 1500000, translated: true });
    expect(p?.images).toEqual([{ src: "/images/products/rak-jati-1.jpg", alt: "Teak shelf" }]);
    expect(p?.body).toBe("A simple bookshelf.");
  });

  it("refuses to publish a product with TODOs or missing fields", () => {
    process.env.CONTENT_DIR = fixtures("bad");
    process.env.SHOW_DRAFTS = "false";
    expect(() => getProducts("id")).toThrow(
      "content/products/kursi.id.md is published but incomplete: dimensions, TODO left in the text",
    );
  });
});
