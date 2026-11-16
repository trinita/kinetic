// Local files (development): edits go straight into the project folder.

import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import type { FileChange, Storage } from "./types";

const version = (data: Buffer) => createHash("sha1").update(data).digest("hex");

export function localStorage(root: string): Storage {
  const abs = (p: string) => {
    const full = path.resolve(root, p);
    if (!full.startsWith(path.resolve(root) + path.sep)) throw new Error(`Path outside project: ${p}`);
    return full;
  };

  return {
    kind: "local",
    async list(prefix) {
      const dir = abs(prefix);
      const entries = await fs.readdir(dir, { recursive: true, withFileTypes: true }).catch(() => []);
      return Promise.all(
        entries
          .filter((e) => e.isFile())
          .map(async (e) => {
            const full = path.join(e.parentPath, e.name);
            return {
              path: path.relative(root, full).split(path.sep).join("/"),
              version: version(await fs.readFile(full)),
            };
          }),
      );
    },
    async read(p) {
      try {
        const data = await fs.readFile(abs(p));
        return { data, version: version(data) };
      } catch {
        return null;
      }
    },
    async commit(changes: FileChange[]) {
      for (const change of changes) {
        const full = abs(change.path);
        if (change.data) {
          await fs.mkdir(path.dirname(full), { recursive: true });
          await fs.writeFile(full, change.data);
        } else {
          await fs.rm(full, { force: true });
        }
      }
    },
  };
}
