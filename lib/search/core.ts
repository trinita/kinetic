// Search building blocks with no server or Next.js dependencies (unit-tested).

import MiniSearch from "minisearch";

export type SearchDocType = "product" | "service" | "project" | "article" | "member" | "page";

export type SearchDoc = {
  /** `${locale}:${type}:${slug}` */
  id: string;
  type: SearchDocType;
  title: string;
  url: string;
  /** Plain text that is searched, embedded and used for snippets. */
  text: string;
  /** Extra searchable words not shown in snippets (category, wood, finish…). */
  keywords?: string;
  /** Short description shown when the match isn't in the text (e.g. semantic matches). */
  summary?: string;
  image?: { src: string; alt: string };
};

export type SearchResult = {
  id: string;
  type: SearchDocType;
  title: string;
  url: string;
  snippet: string;
  image?: { src: string; alt: string };
};

/** Everything about a document that meaning-based search should see. */
export const searchableText = (d: SearchDoc) => [d.keywords, d.text].filter(Boolean).join("\n");

/** Markdown → plain text, good enough for searching and snippets. */
export function markdownToText(md: string): string {
  return md
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/[*_`>]/g, "")
    .replace(/^\s*[-+]\s+/gm, "")
    .replace(/\n{2,}/g, "\n")
    .trim();
}

/** Lowercase and strip accents so "Kursi" matches "kursi" and "café" matches "cafe". */
export const normalize = (term: string) => term.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

export function createKeywordIndex(docs: SearchDoc[]) {
  const index = new MiniSearch<SearchDoc>({
    fields: ["title", "keywords", "text"],
    storeFields: ["id"],
    processTerm: (term) => normalize(term) || null,
    searchOptions: { boost: { title: 3, keywords: 2 }, prefix: true, fuzzy: 0.2, combineWith: "AND" },
  });
  index.addAll(docs);
  return (query: string, limit = 20) => {
    let hits = index.search(query);
    // Nothing contains every word: fall back to documents containing any of them.
    if (!hits.length) hits = index.search(query, { combineWith: "OR" });
    return hits.slice(0, limit).map((h) => ({ id: String(h.id), terms: h.terms }));
  };
}

/** Reciprocal rank fusion: merges ranked lists of ids into one ranking. */
export function fuseRankings(lists: string[][], k = 60): string[] {
  const scores = new Map<string, number>();
  for (const list of lists) {
    list.forEach((id, rank) => scores.set(id, (scores.get(id) ?? 0) + 1 / (k + rank + 1)));
  }
  return [...scores.entries()].sort((a, b) => b[1] - a[1]).map(([id]) => id);
}

export function cosine(a: number[], b: number[]): number {
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  return na && nb ? dot / Math.sqrt(na * nb) : 0;
}

/** A ~160 character excerpt around the first matched term, or the summary/start of the text. */
export function makeSnippet(doc: SearchDoc, terms: string[] = [], length = 160): string {
  const text = doc.text.replace(/\s+/g, " ");
  const lower = normalize(text);
  const at = terms
    .map((t) => lower.indexOf(normalize(t)))
    .filter((i) => i >= 0)
    .sort((a, b) => a - b)[0];
  if (at === undefined) {
    const base = doc.summary ?? text;
    return base.length > length ? base.slice(0, length).replace(/\s+\S*$/, "") + "…" : base;
  }
  const start = Math.max(0, at - 40);
  let snippet = text.slice(start, start + length);
  if (start > 0) snippet = "…" + snippet.replace(/^\S*\s/, "");
  if (start + length < text.length) snippet = snippet.replace(/\s+\S*$/, "") + "…";
  return snippet;
}
