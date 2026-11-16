import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { getProduct, getProducts } from "@/lib/content";

const fixtures = (name: string) => path.join(__dirname, "../fixtures", name);

const useFixture = (name: string) => vi.spyOn(process, "cwd").mockReturnValue(fixtures(name));

afterEach(() => {
  vi.restoreAllMocks();
  delete process.env.SHOW_DRAFTS;
});

describe("product loader", () => {
  it("shows only published products on the live site", () => {
    useFixture("ok");
    process.env.SHOW_DRAFTS = "false";
    expect(getProducts("id").map((p) => p.slug)).toEqual(["rak-jati"]);
  });

  it("shows drafts while developing", () => {
    useFixture("ok");
    process.env.SHOW_DRAFTS = "true";
    const draft = getProduct("id", "meja-draf");
    expect(draft?.draft).toBe(true);
    expect(draft?.leadTimeWeeks).toBeUndefined();
  });

  it("uses English text and keeps facts from the Indonesian file", () => {
    useFixture("ok");
    process.env.SHOW_DRAFTS = "false";
    const p = getProduct("en", "rak-jati");
    expect(p).toMatchObject({ title: "Teak Shelf", woods: ["teak"], priceFrom: 1500000, translated: true });
    expect(p?.images).toEqual([{ src: "/images/products/rak-jati-1.jpg", alt: "Teak shelf" }]);
    expect(p?.body).toBe("A simple bookshelf.");
  });

  it("hides a published product that is still incomplete, with a build warning", () => {
    useFixture("bad");
    process.env.SHOW_DRAFTS = "false";
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    expect(getProducts("id")).toEqual([]);
    expect(warn).toHaveBeenCalledWith(
      "[content] products/kursi is published but hidden until complete — missing: dimensions, TODO left in the text",
    );
  });

  it("treats empty form fields as not filled in", () => {
    useFixture("ok");
    process.env.SHOW_DRAFTS = "true";
    expect(getProduct("id", "meja-draf")).toMatchObject({ category: undefined, madeToOrder: undefined });
  });
});
