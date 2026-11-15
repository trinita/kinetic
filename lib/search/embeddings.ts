// Optional meaning-based search. Active only when EMBEDDINGS_API_KEY is set and
// `npm run search:index` has written data/search-vectors.json.
//
// Provider: Voyage AI (multilingual, handles Indonesian and English). Swap `embed` to change provider.

import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";

export const VECTORS_FILE = path.join(process.cwd(), "data", "search-vectors.json");
const API_URL = "https://api.voyageai.com/v1/embeddings";

export const embeddingModel = () => process.env.EMBEDDINGS_MODEL || "voyage-3.5";
export const embeddingsEnabled = () => !!process.env.EMBEDDINGS_API_KEY;

export type VectorFile = {
  model: string;
  vectors: Record<string, { hash: string; v: number[] }>;
};

/** Changes whenever a document's searchable text changes, so stale vectors get re-embedded. */
export const docHash = (title: string, text: string) =>
  createHash("sha256").update(`${title}\n${text}`).digest("hex").slice(0, 16);

export async function embed(texts: string[], inputType: "query" | "document"): Promise<number[][]> {
  const res = await fetch(API_URL, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${process.env.EMBEDDINGS_API_KEY}`,
    },
    body: JSON.stringify({ input: texts, model: embeddingModel(), input_type: inputType }),
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok) throw new Error(`Embeddings request failed: ${res.status} ${await res.text()}`);
  const json = (await res.json()) as { data: { embedding: number[]; index: number }[] };
  return json.data.sort((a, b) => a.index - b.index).map((d) => d.embedding);
}

export function readVectors(): VectorFile | null {
  try {
    const file = JSON.parse(fs.readFileSync(VECTORS_FILE, "utf8")) as VectorFile;
    return file.model === embeddingModel() ? file : null;
  } catch {
    return null;
  }
}
