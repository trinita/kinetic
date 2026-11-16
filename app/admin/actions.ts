"use server";

import { cookies, headers } from "next/headers";
import { redirect, unstable_rethrow } from "next/navigation";
import { assertSession } from "@/lib/admin/auth";
import { dummyPasswordHash, verifyPassword } from "@/lib/admin/password";
import {
  PRODUCTS_DIR,
  SLUG_PATTERN,
  buildSave,
  formSchema,
  imageDir,
  missingForPublish,
  productPath,
} from "@/lib/admin/products";
import { SESSION_COOKIE, SESSION_HOURS, createSessionToken } from "@/lib/admin/session";
import { getStorage } from "@/lib/admin/storage";
import { adminConfigured, parseUsers } from "@/lib/admin/users";
import { createRateLimiter } from "@/lib/ai/rate-limit";

// ---------- Login

// 5 attempts per 15 minutes per visitor and per username (in-memory; see lib/ai/rate-limit.ts).
const loginAttempts = createRateLimiter({ limit: 5, windowMs: 15 * 60_000 });

export type LoginState = { error?: string };

export async function login(_prev: LoginState, formData: FormData): Promise<LoginState> {
  if (!adminConfigured()) return { error: "Admin belum disiapkan. Lihat content/README.md → Admin." };

  const username = String(formData.get("username") ?? "")
    .trim()
    .toLowerCase()
    .slice(0, 64);
  const password = String(formData.get("password") ?? "").slice(0, 256);
  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0].trim() || "local";
  if (!loginAttempts(`ip:${ip}`) || !loginAttempts(`user:${username}`)) {
    return { error: "Terlalu banyak percobaan. Coba lagi dalam 15 menit." };
  }

  const hash = parseUsers().get(username);
  // Check a dummy hash for unknown usernames so both cases take the same time.
  const ok = await verifyPassword(password, hash ?? (await dummyPasswordHash()));
  if (!hash || !ok) return { error: "Nama pengguna atau kata sandi salah." };

  (await cookies()).set(SESSION_COOKIE, createSessionToken(username), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: SESSION_HOURS * 3600,
  });
  redirect("/admin");
}

export async function logout() {
  (await cookies()).delete(SESSION_COOKIE);
  redirect("/admin/login");
}

// ---------- Save / delete products

export type SaveResult = {
  ok: boolean;
  message: string;
  /** Still missing before a published product appears on the site. */
  missing?: string[];
  /** New file version after saving (send it with the next save). */
  version?: string;
};

const STORAGE_MISSING =
  "Penyimpanan ke GitHub belum disiapkan (GITHUB_TOKEN belum diisi). Lihat content/README.md → Admin.";
const SAVE_FAILED = "Gagal menyimpan. Coba lagi sebentar lagi; jika tetap gagal, hubungi pengelola situs.";
const CONFLICT =
  "Produk ini baru saja diubah di tempat lain. Muat ulang halaman untuk melihat versi terbaru, lalu ulangi perubahan Anda.";

export async function saveProduct(formData: FormData): Promise<SaveResult> {
  const session = await assertSession();
  const storage = getStorage();
  if (!storage) return { ok: false, message: STORAGE_MISSING };

  const mode = formData.get("mode") === "create" ? "create" : "edit";
  const slug = String(formData.get("slug") ?? "");
  if (!SLUG_PATTERN.test(slug) || slug.length > 80) {
    return {
      ok: false,
      message: "Alamat halaman hanya boleh huruf kecil, angka, dan tanda hubung (contoh: meja-jati).",
    };
  }

  let raw: unknown;
  try {
    raw = JSON.parse(String(formData.get("data") ?? ""));
  } catch {
    return { ok: false, message: SAVE_FAILED };
  }
  const parsed = formSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? SAVE_FAILED };

  const newImages = new Map<string, File>();
  for (const [key, value] of formData.entries()) {
    if (key.startsWith("image:") && value instanceof File) newImages.set(key.slice(6), value);
  }

  try {
    const current = await storage.read(productPath(slug));
    if (mode === "create" && current) {
      return { ok: false, message: "Alamat halaman ini sudah dipakai produk lain. Pilih alamat lain." };
    }
    if (mode === "edit") {
      if (!current) return { ok: false, message: "Produk ini tidak ditemukan (mungkin sudah dihapus)." };
      if (current.version !== formData.get("version")) return { ok: false, message: CONFLICT };
    }

    const { changes, form } = await buildSave({ storage, slug, input: parsed.data, newImages });
    await storage.commit(
      changes,
      `Admin: ${mode === "create" ? "tambah" : "ubah"} produk ${slug} (oleh ${session.user})`,
    );

    const saved = await storage.read(productPath(slug));
    const missing = form.status === "published" ? missingForPublish(form) : [];
    if (mode === "create") redirect(`/admin/produk/${slug}?disimpan=1`);
    return {
      ok: true,
      version: saved?.version,
      missing,
      message:
        storage.kind === "github"
          ? "Tersimpan. Situs akan diperbarui dalam 1–2 menit."
          : "Tersimpan ke file di komputer ini.",
    };
  } catch (err) {
    unstable_rethrow(err); // let redirect() through
    console.error("[admin] save failed:", err);
    return { ok: false, message: SAVE_FAILED };
  }
}

export async function deleteProduct(slug: string, version: string): Promise<SaveResult> {
  const session = await assertSession();
  const storage = getStorage();
  if (!storage) return { ok: false, message: STORAGE_MISSING };
  if (!SLUG_PATTERN.test(slug)) return { ok: false, message: SAVE_FAILED };

  try {
    const current = await storage.read(productPath(slug));
    if (!current) redirect("/admin");
    if (current.version !== version) return { ok: false, message: CONFLICT };
    const photos = await storage.list(imageDir(slug));
    await storage.commit(
      [{ path: productPath(slug), data: null }, ...photos.map((p) => ({ path: p.path, data: null }))],
      `Admin: hapus produk ${slug} (oleh ${session.user})`,
    );
  } catch (err) {
    unstable_rethrow(err);
    console.error("[admin] delete failed:", err);
    return { ok: false, message: SAVE_FAILED };
  }
  redirect(`/admin?dihapus=${encodeURIComponent(slug)}`);
}

export async function listProductSlugs(): Promise<string[]> {
  await assertSession();
  const storage = getStorage();
  if (!storage) return [];
  return (await storage.list(PRODUCTS_DIR))
    .map((f) => f.path.match(/^content\/products\/([a-z0-9-]+)\.yaml$/)?.[1])
    .filter((s): s is string => !!s);
}
