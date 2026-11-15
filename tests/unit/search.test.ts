import { describe, expect, it } from "vitest";
import {
  cosine,
  createKeywordIndex,
  fuseRankings,
  makeSnippet,
  markdownToText,
  type SearchDoc,
} from "@/lib/search/core";

const doc = (id: string, title: string, text: string, summary?: string): SearchDoc => ({
  id,
  type: "product",
  title,
  url: `/${id}`,
  text,
  summary,
});

const docs = [
  doc("meja", "Meja Ukir Lukis Tropis", "Meja samping bundar dengan daun tropis dan kupu-kupu. Kayu jati."),
  doc("bangku", "Bangku Lukis Flora & Fauna", "Bangku panjang dilukis tangan dengan burung dan bunga."),
  doc("kontak", "Kontak", "Jam buka: Minggu–Jumat, 09.00–17.00 WIB. Sabtu tutup."),
];

describe("keyword search", () => {
  const search = createKeywordIndex(docs);

  it("finds by title and text, title first", () => {
    expect(search("meja").map((h) => h.id)[0]).toBe("meja");
    expect(search("burung").map((h) => h.id)).toEqual(["bangku"]);
  });

  it("tolerates typos, prefixes and capitals", () => {
    expect(search("bangkuu").map((h) => h.id)).toContain("bangku");
    expect(
      search("LUKIS")
        .map((h) => h.id)
        .sort(),
    ).toEqual(["bangku", "meja"]);
    expect(search("kupu").map((h) => h.id)).toEqual(["meja"]);
  });

  it("falls back to any-word matching when no document has every word", () => {
    expect(
      search("jam buka bangku")
        .map((h) => h.id)
        .sort(),
    ).toEqual(["bangku", "kontak"]);
  });
});

describe("fuseRankings", () => {
  it("rewards items ranked well in both lists", () => {
    expect(
      fuseRankings([
        ["a", "b", "c"],
        ["b", "c"],
      ]),
    ).toEqual(["b", "c", "a"]);
  });
});

describe("cosine", () => {
  it("measures direction", () => {
    expect(cosine([1, 0], [1, 0])).toBe(1);
    expect(cosine([1, 0], [0, 1])).toBe(0);
  });
});

describe("snippets", () => {
  it("shows text around the matched word", () => {
    const long = doc(
      "x",
      "X",
      "Awal teks yang panjang sekali tentang banyak hal. ".repeat(4) + "Kayu jati pilihan untuk meja.",
    );
    const snippet = makeSnippet(long, ["jati"], 60);
    expect(snippet).toContain("jati");
    expect(snippet.startsWith("…")).toBe(true);
  });

  it("uses the summary when nothing matched in the text", () => {
    expect(makeSnippet(doc("x", "X", "Isi.", "Ringkasan."), ["zzz"])).toBe("Ringkasan.");
  });
});

describe("markdownToText", () => {
  it("strips Markdown syntax", () => {
    expect(markdownToText("## Judul\n\n- **tebal** dan [tautan](https://x.y)")).toBe(
      "Judul\ntebal dan tautan",
    );
  });
});
