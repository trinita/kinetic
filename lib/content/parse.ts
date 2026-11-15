// Markdown content files: YAML frontmatter + Markdown body.
// "TODO" placeholders (see content/products/README.md) are treated as missing values.

import { parse as parseYaml } from "yaml";

export type RawDoc = { data: Record<string, unknown>; body: string };

const FRONTMATTER = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/;

export function parseDoc(source: string, file = "content file"): RawDoc {
  const m = FRONTMATTER.exec(source);
  if (!m) throw new Error(`${file}: missing frontmatter (--- ... ---) at the top`);
  const data = parseYaml(m[1]) ?? {};
  if (typeof data !== "object" || Array.isArray(data))
    throw new Error(`${file}: frontmatter must be key: value pairs`);
  return { data: stripTodos(data) as Record<string, unknown>, body: m[2].trim() };
}

export const isTodo = (v: unknown) => typeof v === "string" && /^\s*TODO\b/.test(v);

/** Removes TODO placeholders: TODO strings become undefined, TODO array items are dropped. */
export function stripTodos(value: unknown): unknown {
  if (isTodo(value)) return undefined;
  if (Array.isArray(value)) return value.filter((v) => !isTodo(v)).map(stripTodos);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value)
        .map(([k, v]) => [k, stripTodos(v)])
        .filter(([, v]) => v !== undefined && v !== null),
    );
  }
  return value;
}

/** True if the Markdown body still contains a TODO placeholder. */
export const bodyHasTodo = (body: string) => /\bTODO\b/.test(body);
