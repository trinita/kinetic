// Site search: keyword search always; meaning-based search added when embeddings are configured.

import "server-only";
import type { Locale } from "@/lib/i18n/routing";
import { buildDocuments } from "./documents";
import {
  cosine,
  createKeywordIndex,
  fuseRankings,
  makeSnippet,
  searchableText,
  type SearchDoc,
  type SearchResult,
} from "./core";
import { docHash, embed, embeddingsEnabled, readVectors } from "./embeddings";

export type { SearchResult } from "./core";

export const MAX_QUERY_LENGTH = 200;
/** Semantic matches below this similarity are ignored (tune once real vectors exist). */
const MIN_SIMILARITY = Number(process.env.SEARCH_MIN_SIMILARITY ?? 0.45);

type LocaleIndex = { docs: Map<string, SearchDoc>; keyword: ReturnType<typeof createKeywordIndex> };
const indexes = new Map<Locale, LocaleIndex>();

function getIndex(locale: Locale): LocaleIndex {
  // In development content changes while the server runs, so rebuild every time (it's small).
  const cached = process.env.NODE_ENV === "production" ? indexes.get(locale) : undefined;
  if (cached) return cached;
  const docs = buildDocuments(locale);
  const index = { docs: new Map(docs.map((d) => [d.id, d])), keyword: createKeywordIndex(docs) };
  indexes.set(locale, index);
  return index;
}

const queryCache = new Map<string, number[]>();

async function semanticRanking(
  locale: Locale,
  query: string,
  docs: Map<string, SearchDoc>,
): Promise<string[]> {
  if (!embeddingsEnabled()) return [];
  const file = readVectors();
  if (!file) return [];
  try {
    let q = queryCache.get(query);
    if (!q) {
      [q] = await embed([query], "query");
      if (queryCache.size > 500) queryCache.clear();
      queryCache.set(query, q);
    }
    return (
      [...docs.values()]
        .map((d) => ({ d, vec: file.vectors[d.id] }))
        // Skip documents whose text changed since the vectors were built.
        .filter(({ d, vec }) => vec && vec.hash === docHash(d.title, searchableText(d)))
        .map(({ d, vec }) => ({ id: d.id, score: cosine(q!, vec.v) }))
        .filter((r) => r.score >= MIN_SIMILARITY)
        .sort((a, b) => b.score - a.score)
        .slice(0, 20)
        .map((r) => r.id)
    );
  } catch (err) {
    // Search must keep working if the embeddings service is down.
    console.error("[search] semantic search unavailable:", err);
    return [];
  }
}

export async function search(locale: Locale, rawQuery: string, limit = 12): Promise<SearchResult[]> {
  const query = rawQuery.trim().slice(0, MAX_QUERY_LENGTH);
  if (!query) return [];
  const { docs, keyword } = getIndex(locale);

  const keywordHits = keyword(query);
  const terms = new Map(keywordHits.map((h) => [h.id, h.terms]));
  const semantic = await semanticRanking(locale, query, docs);
  const ranked = fuseRankings([keywordHits.map((h) => h.id), semantic]);

  return ranked.slice(0, limit).flatMap((id) => {
    const doc = docs.get(id);
    if (!doc) return [];
    return [
      {
        id,
        type: doc.type,
        title: doc.title,
        url: doc.url,
        image: doc.image,
        snippet: makeSnippet(doc, terms.get(id)),
      },
    ];
  });
}
