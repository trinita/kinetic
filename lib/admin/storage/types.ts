/** Where the admin reads and writes site files (paths are relative to the project root). */
export interface Storage {
  readonly kind: "local" | "github";
  /** Files under a folder (recursive), with a version that changes whenever the file changes. */
  list(prefix: string): Promise<{ path: string; version: string }[]>;
  read(path: string): Promise<{ data: Buffer; version: string } | null>;
  /** Writes and deletes (data: null) as one change. On GitHub this is a single commit. */
  commit(changes: FileChange[], message: string): Promise<void>;
}

export type FileChange = { path: string; data: Buffer | null };

export class StorageConflictError extends Error {}
