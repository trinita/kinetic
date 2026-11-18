import { describe, expect, it } from "vitest";
import { bodyHasTodo, parseDoc, stripTodos, withoutTodoLines } from "@/lib/content/parse";
import { productFile } from "@/lib/content/schemas";
import { fill, formatPrice } from "@/lib/format";

describe("parseDoc", () => {
  it("splits frontmatter and body", () => {
    const doc = parseDoc("---\ntitle: Meja\nstatus: draft\n---\n\nIsi **teks**.\n");
    expect(doc.data).toEqual({ title: "Meja", status: "draft" });
    expect(doc.body).toBe("Isi **teks**.");
  });

  it("ignores YAML comments and treats TODO values as missing", () => {
    const doc = parseDoc(
      "---\ntitle: Meja Ukir # TODO cek nama\nleadTimeWeeks: TODO\nwoods: [jati, TODO]\nfinishes: [TODO cat?]\npriceFrom:\n---\nx",
    );
    expect(doc.data).toEqual({ title: "Meja Ukir", woods: ["jati"], finishes: [] });
  });

  it("explains a missing frontmatter block", () => {
    expect(() => parseDoc("no frontmatter", "content/x.id.md")).toThrow(
      /content\/x\.id\.md: missing frontmatter/,
    );
  });
});

describe("stripTodos", () => {
  it("cleans nested objects", () => {
    expect(stripTodos({ images: [{ src: "/images/a.jpg", alt: "TODO foto" }] })).toEqual({
      images: [{ src: "/images/a.jpg" }],
    });
  });
});

describe("bodyHasTodo", () => {
  it("finds TODO markers", () => {
    expect(bodyHasTodo("Teks\n\nTODO tambah cerita")).toBe(true);
    expect(bodyHasTodo("Selesai.")).toBe(false);
  });
});

describe("product schema", () => {
  it("defaults to draft and rejects unknown categories", () => {
    expect(productFile.parse({ title: "Meja" }).status).toBe("draft");
    expect(productFile.safeParse({ title: "Meja", category: "sofa" }).success).toBe(false);
  });
});

describe("format", () => {
  it("fills placeholders and formats rupiah", () => {
    expect(fill("Mulai {price}", { price: "Rp 1" })).toBe("Mulai Rp 1");
    expect(formatPrice("id", 2500000).replace(/\s/g, " ")).toBe("Rp 2.500.000");
  });
});

describe("withoutTodoLines", () => {
  it("removes TODO notes so visitors never see them", () => {
    expect(withoutTodoLines("Satu.\n\nTODO jelaskan alur.\n\nDua.")).toBe("Satu.\n\nDua.");
    expect(withoutTodoLines("- kayu jati\n- TODO motif lain")).toBe("- kayu jati");
    expect(withoutTodoLines("TODO saja")).toBe("");
  });
  it("keeps text that only mentions TODO mid-sentence", () => {
    expect(withoutTodoLines("Kata TODO di tengah.")).toBe("Kata TODO di tengah.");
  });
});
