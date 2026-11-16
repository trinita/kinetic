// Development saves to local files; the live site saves to GitHub (set ADMIN_STORAGE to override).

import { githubStorage } from "./github";
import { localStorage } from "./local";
import type { Storage } from "./types";

export type { Storage, FileChange } from "./types";
export { StorageConflictError } from "./types";

export function storageKind(): "local" | "github" {
  const chosen = process.env.ADMIN_STORAGE;
  if (chosen === "local" || chosen === "github") return chosen;
  return process.env.NODE_ENV === "production" ? "github" : "local";
}

/** Null when GitHub storage is chosen but no token is configured yet. */
export function getStorage(): Storage | null {
  if (storageKind() === "local") return localStorage(process.env.ADMIN_LOCAL_ROOT || process.cwd());
  const token = process.env.GITHUB_TOKEN;
  if (!token) return null;
  return githubStorage({
    token,
    repo: process.env.GITHUB_REPO || "trinita/kinetic",
    branch: process.env.GITHUB_BRANCH || "main",
  });
}
