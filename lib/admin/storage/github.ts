// GitHub (live site): reads the latest files from the repository and saves each change as one commit,
// which makes Vercel rebuild the site. Uses a fine-grained token with "Contents: read and write" on the repo.

import { StorageConflictError, type FileChange, type Storage } from "./types";

type TreeEntry = { path: string; type: "blob" | "tree"; sha: string };

export function githubStorage({
  token,
  repo,
  branch,
  fetchImpl = fetch,
}: {
  token: string;
  repo: string;
  branch: string;
  fetchImpl?: typeof fetch;
}): Storage {
  const api = async <T>(path: string, init: RequestInit & { raw?: boolean } = {}): Promise<T> => {
    const res = await fetchImpl(`https://api.github.com/repos/${repo}${path}`, {
      ...init,
      headers: {
        authorization: `Bearer ${token}`,
        accept: init.raw ? "application/vnd.github.raw" : "application/vnd.github+json",
        "x-github-api-version": "2022-11-28",
        ...(init.body ? { "content-type": "application/json" } : {}),
      },
      cache: "no-store",
    });
    if (res.status === 422 && init.method === "PATCH") throw new StorageConflictError("Branch moved");
    if (!res.ok)
      throw new Error(`GitHub ${init.method ?? "GET"} ${path} failed: ${res.status} ${await res.text()}`);
    return (init.raw ? Buffer.from(await res.arrayBuffer()) : await res.json()) as T;
  };

  const head = async () => {
    const ref = await api<{ object: { sha: string } }>(`/git/ref/heads/${branch}`);
    const commit = await api<{ tree: { sha: string } }>(`/git/commits/${ref.object.sha}`);
    return { commitSha: ref.object.sha, treeSha: commit.tree.sha };
  };

  const tree = async () => {
    const { treeSha } = await head();
    const t = await api<{ tree: TreeEntry[]; truncated: boolean }>(`/git/trees/${treeSha}?recursive=1`);
    return t.tree.filter((e) => e.type === "blob");
  };

  return {
    kind: "github",
    async list(prefix) {
      const dir = prefix.replace(/\/?$/, "/");
      return (await tree())
        .filter((e) => e.path.startsWith(dir))
        .map((e) => ({ path: e.path, version: e.sha }));
    },
    async read(path) {
      const entry = (await tree()).find((e) => e.path === path);
      if (!entry) return null;
      const data = await api<Buffer>(`/git/blobs/${entry.sha}`, { raw: true });
      return { data, version: entry.sha };
    },
    async commit(changes: FileChange[], message: string) {
      // Retry once if someone else committed in between (the ref update is not a fast-forward).
      for (let attempt = 0; ; attempt++) {
        try {
          const { commitSha, treeSha } = await head();
          const entries = await Promise.all(
            changes.map(async (c) => ({
              path: c.path,
              mode: "100644",
              type: "blob",
              sha: c.data
                ? (
                    await api<{ sha: string }>(`/git/blobs`, {
                      method: "POST",
                      body: JSON.stringify({ content: c.data.toString("base64"), encoding: "base64" }),
                    })
                  ).sha
                : null, // null deletes the file
            })),
          );
          const newTree = await api<{ sha: string }>(`/git/trees`, {
            method: "POST",
            body: JSON.stringify({ base_tree: treeSha, tree: entries }),
          });
          const commit = await api<{ sha: string }>(`/git/commits`, {
            method: "POST",
            body: JSON.stringify({ message, tree: newTree.sha, parents: [commitSha] }),
          });
          await api(`/git/refs/heads/${branch}`, {
            method: "PATCH",
            body: JSON.stringify({ sha: commit.sha, force: false }),
          });
          return;
        } catch (err) {
          if (err instanceof StorageConflictError && attempt === 0) continue;
          throw err;
        }
      }
    },
  };
}
