import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "@/lib/admin/password";
import {
  buildSave,
  emptyProduct,
  formSchema,
  missingForPublish,
  slugify,
  toForm,
  toYaml,
} from "@/lib/admin/products";
import { createSessionToken, verifySessionToken } from "@/lib/admin/session";
import { githubStorage } from "@/lib/admin/storage/github";
import { localStorage } from "@/lib/admin/storage/local";
import { parseUsers } from "@/lib/admin/users";

describe("passwords", () => {
  it("verifies the right password and rejects others", async () => {
    const hash = await hashPassword("kayu-jati-2026!");
    expect(hash).toMatch(/^scrypt\$\d+\$/);
    expect(await verifyPassword("kayu-jati-2026!", hash)).toBe(true);
    expect(await verifyPassword("kayu-jati-2026", hash)).toBe(false);
    expect(await verifyPassword("anything", "not-a-hash")).toBe(false);
  });

  it("never produces the same hash twice (random salt)", async () => {
    expect(await hashPassword("same")).not.toBe(await hashPassword("same"));
  });
});

describe("sessions", () => {
  const key = "k".repeat(40);

  it("round-trips a valid session", () => {
    const token = createSessionToken("klien", 1_000, key);
    expect(verifySessionToken(token, 2_000, key)).toMatchObject({ user: "klien" });
  });

  it("rejects tampered, expired, or wrongly signed tokens", () => {
    const token = createSessionToken("klien", 1_000, key);
    const [data, sig] = token.split(".");
    const forged = Buffer.from(JSON.stringify({ user: "admin", exp: 9e15 })).toString("base64url");
    expect(verifySessionToken(`${forged}.${sig}`, 2_000, key)).toBeNull();
    expect(verifySessionToken(`${data}.${sig}x`, 2_000, key)).toBeNull();
    expect(verifySessionToken(token, 1_000 + 9 * 3600_000, key)).toBeNull(); // after 8 hours
    expect(verifySessionToken(token, 2_000, "z".repeat(40))).toBeNull();
    expect(verifySessionToken(undefined, 2_000, key)).toBeNull();
  });
});

describe("ADMIN_USERS", () => {
  it("parses several accounts and ignores malformed entries", () => {
    const users = parseUsers("Klien:scrypt$1$a$b, owner:scrypt$1$c$d,broken,nohash:plain");
    expect([...users.keys()]).toEqual(["klien", "owner"]);
  });
});

describe("product files", () => {
  it("round-trips through the form and back to YAML", () => {
    const form = {
      ...emptyProduct(),
      title: "Meja Jati",
      woods: ["jati"],
      leadTimeWeeks: 3,
      madeToOrder: "yes" as const,
    };
    expect(toForm(toYaml(form))).toEqual(form);
  });

  it("lists what's missing before a product can appear", () => {
    expect(missingForPublish({ ...emptyProduct(), title: "X" })).toEqual([
      "kategori",
      "ringkasan",
      "ukuran",
      "waktu pengerjaan",
      "ketersediaan",
      "jenis kayu",
      "foto",
    ]);
  });

  it("makes page addresses from names", () => {
    expect(slugify("Meja Kopi Jati — Bundar!")).toBe("meja-kopi-jati-bundar");
  });
});

describe("saving with local storage", () => {
  let root: string;
  beforeEach(() => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), "kinetic-admin-"));
    fs.mkdirSync(path.join(root, "public/images/products/meja/images/0"), { recursive: true });
    fs.writeFileSync(path.join(root, "public/images/products/meja/images/0/image.jpg"), "old-photo");
    fs.mkdirSync(path.join(root, "public/images/products/meja/images/1"), { recursive: true });
    fs.writeFileSync(path.join(root, "public/images/products/meja/images/1/image.jpg"), "removed-photo");
  });
  afterEach(() => fs.rmSync(root, { recursive: true, force: true }));

  it("writes the product, adds new photos and deletes removed ones", async () => {
    const storage = localStorage(root);
    const input = formSchema.parse({
      ...emptyProduct(),
      title: "Meja",
      images: [
        { kind: "existing", image: "/images/products/meja/images/0/image.jpg", alt: "Lama", altEn: "" },
        { kind: "new", id: "n0", alt: "Baru", altEn: "New" },
      ],
    });
    const photo = new File([new Uint8Array([1, 2, 3])], "x.jpg", { type: "image/jpeg" });
    const { changes } = await buildSave({
      storage,
      slug: "meja",
      input,
      newImages: new Map([["n0", photo]]),
    });
    await storage.commit(changes, "test");

    const saved = toForm(fs.readFileSync(path.join(root, "content/products/meja.yaml"), "utf8"));
    expect(saved.images[0]).toEqual({
      image: "/images/products/meja/images/0/image.jpg",
      alt: "Lama",
      altEn: "",
    });
    expect(saved.images[1].image).toMatch(/^\/images\/products\/meja\/[a-z0-9]+-[a-f0-9]{6}\.jpg$/);
    expect(fs.readFileSync(path.join(root, "public", saved.images[1].image))).toEqual(Buffer.from([1, 2, 3]));
    expect(fs.existsSync(path.join(root, "public/images/products/meja/images/1/image.jpg"))).toBe(false);
  });

  it("rejects files that aren't photos and paths outside the project", async () => {
    const storage = localStorage(root);
    const input = formSchema.parse({
      ...emptyProduct(),
      title: "Meja",
      images: [{ kind: "new", id: "n0", alt: "", altEn: "" }],
    });
    const exe = new File(["x"], "x.exe", { type: "application/octet-stream" });
    await expect(
      buildSave({ storage, slug: "meja", input, newImages: new Map([["n0", exe]]) }),
    ).rejects.toThrow("JPEG, PNG or WebP");
    await expect(storage.read("../../etc/passwd")).resolves.toBeNull();
    await expect(storage.commit([{ path: "../escape.txt", data: Buffer.from("x") }], "t")).rejects.toThrow(
      "outside project",
    );
  });
});

describe("GitHub storage", () => {
  it("saves all changes as a single commit on the branch", async () => {
    const calls: { method: string; url: string; body?: unknown }[] = [];
    const respond = (body: unknown) => new Response(JSON.stringify(body), { status: 200 });
    const fakeFetch = (async (url: string, init?: RequestInit) => {
      const method = init?.method ?? "GET";
      calls.push({ method, url, body: init?.body ? JSON.parse(String(init.body)) : undefined });
      if (url.endsWith("/git/ref/heads/main")) return respond({ object: { sha: "c1" } });
      if (url.endsWith("/git/commits/c1")) return respond({ tree: { sha: "t1" } });
      if (url.endsWith("/git/blobs")) return respond({ sha: "b1" });
      if (url.endsWith("/git/trees")) return respond({ sha: "t2" });
      if (url.endsWith("/git/commits")) return respond({ sha: "c2" });
      if (url.endsWith("/git/refs/heads/main")) return respond({});
      return new Response("not found", { status: 404 });
    }) as typeof fetch;

    const storage = githubStorage({ token: "t", repo: "o/r", branch: "main", fetchImpl: fakeFetch });
    await storage.commit(
      [
        { path: "content/products/meja.yaml", data: Buffer.from("title: Meja") },
        { path: "public/images/products/meja/old.jpg", data: null },
      ],
      "Admin: ubah produk meja",
    );

    const tree = calls.find((c) => c.url.endsWith("/git/trees"))!.body as {
      base_tree: string;
      tree: unknown[];
    };
    expect(tree.base_tree).toBe("t1");
    expect(tree.tree).toEqual([
      { path: "content/products/meja.yaml", mode: "100644", type: "blob", sha: "b1" },
      { path: "public/images/products/meja/old.jpg", mode: "100644", type: "blob", sha: null },
    ]);
    expect(calls.find((c) => c.url.endsWith("/git/commits") && c.method === "POST")!.body).toEqual({
      message: "Admin: ubah produk meja",
      tree: "t2",
      parents: ["c1"],
    });
    expect(calls.at(-1)).toMatchObject({ method: "PATCH", body: { sha: "c2", force: false } });
  });
});
