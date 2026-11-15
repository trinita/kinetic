// Builds data/search-vectors.json for meaning-based search.
// Usage: npm run search:index   (runs automatically before `npm run build`)
// Needs EMBEDDINGS_API_KEY; without it the site uses keyword search only.
// Only documents whose text changed are re-embedded, so reruns are cheap.

import fs from "node:fs";
import path from "node:path";
import { locales } from "@/lib/i18n/routing";
import { searchableText } from "@/lib/search/core";
import { buildDocuments } from "@/lib/search/documents";
import {
  VECTORS_FILE,
  docHash,
  embed,
  embeddingModel,
  embeddingsEnabled,
  readVectors,
  type VectorFile,
} from "@/lib/search/embeddings";

// Index what the live site shows: published content only.
process.env.SHOW_DRAFTS ??= "false";

async function main() {
  if (!embeddingsEnabled()) {
    console.log("[search:index] EMBEDDINGS_API_KEY not set — skipping; the site will use keyword search.");
    return;
  }
  const docs = locales.flatMap((l) => buildDocuments(l));
  const previous = readVectors();
  const next: VectorFile = { model: embeddingModel(), vectors: {} };

  const todo = docs.filter((d) => {
    const hash = docHash(d.title, searchableText(d));
    const old = previous?.vectors[d.id];
    if (old?.hash === hash) next.vectors[d.id] = old;
    return old?.hash !== hash;
  });

  for (let i = 0; i < todo.length; i += 64) {
    const batch = todo.slice(i, i + 64);
    const vectors = await embed(
      batch.map((d) => `${d.title}\n${searchableText(d)}`),
      "document",
    );
    batch.forEach((d, j) => {
      next.vectors[d.id] = {
        hash: docHash(d.title, searchableText(d)),
        v: vectors[j].map((x) => Math.round(x * 1e5) / 1e5),
      };
    });
  }

  fs.mkdirSync(path.dirname(VECTORS_FILE), { recursive: true });
  fs.writeFileSync(VECTORS_FILE, JSON.stringify(next));
  console.log(`[search:index] ${docs.length} documents, ${todo.length} embedded, model ${next.model}.`);
}

main().catch((err) => {
  // Don't block a deploy over search: keyword search still works.
  console.error("[search:index] failed, continuing with keyword search only:", err);
});
