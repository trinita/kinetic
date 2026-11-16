import type { Metadata } from "next";
import Link from "next/link";
import { requireSession } from "@/lib/admin/auth";
import { PRODUCTS_DIR, missingForPublish, toForm } from "@/lib/admin/products";
import { getStorage, storageKind } from "@/lib/admin/storage";
import { AdminHeader } from "@/components/admin/admin-header";

export const metadata: Metadata = { title: "Produk" };

export default async function AdminHome({ searchParams }: PageProps<"/admin">) {
  const session = await requireSession();
  const { dihapus } = await searchParams;
  const storage = getStorage();

  const products = storage
    ? await Promise.all(
        (await storage.list(PRODUCTS_DIR))
          .filter((f) => /^content\/products\/[a-z0-9-]+\.yaml$/.test(f.path))
          .map(async (f) => {
            const slug = f.path.slice(PRODUCTS_DIR.length + 1, -".yaml".length);
            const file = await storage.read(f.path);
            try {
              const form = toForm(file?.data.toString() ?? "");
              return {
                slug,
                title: form.title,
                status: form.status,
                missing: missingForPublish(form),
                image: form.images[0]?.image,
              };
            } catch {
              return {
                slug,
                title: slug,
                status: "draft" as const,
                missing: ["file tidak terbaca"],
                image: undefined,
              };
            }
          }),
      )
    : [];
  products.sort((a, b) => a.title.localeCompare(b.title));

  return (
    <>
      <AdminHeader user={session.user} storage={storage ? storageKind() : null} />
      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h1 className="font-display text-accent-strong text-3xl font-semibold">Produk</h1>
          {storage && (
            <Link
              href="/admin/produk/baru"
              className="bg-accent-strong text-on-accent-strong rounded-full px-5 py-2.5 font-semibold hover:opacity-90"
            >
              + Tambah produk
            </Link>
          )}
        </div>

        {dihapus && (
          <p role="status" className="border-border bg-surface mt-6 rounded-xl border px-4 py-3 text-sm">
            Produk “{String(dihapus)}” sudah dihapus.
          </p>
        )}

        {!storage ? (
          <p className="border-jati text-muted mt-8 rounded-xl border border-dashed p-4">
            Penyimpanan ke GitHub belum disiapkan (GITHUB_TOKEN belum diisi). Lihat{" "}
            <code>content/README.md</code> → Admin.
          </p>
        ) : products.length === 0 ? (
          <p className="text-muted mt-8">
            Belum ada produk. Klik “Tambah produk” untuk membuat yang pertama.
          </p>
        ) : (
          <ul className="border-border bg-surface mt-8 divide-y divide-[var(--border)] overflow-hidden rounded-2xl border">
            {products.map((p) => (
              <li key={p.slug}>
                <Link
                  href={`/admin/produk/${p.slug}`}
                  className="hover:bg-bg flex items-center gap-4 px-4 py-3"
                >
                  <span className="bg-walnut relative size-12 shrink-0 overflow-hidden rounded-lg">
                    {p.image && (
                      // eslint-disable-next-line @next/next/no-img-element -- admin thumbnail via protected route
                      <img
                        src={
                          storageKind() === "github"
                            ? `/admin/image?path=${encodeURIComponent(`public${p.image}`)}`
                            : p.image
                        }
                        alt=""
                        className="size-full object-cover"
                      />
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold">{p.title}</span>
                    <span className="text-muted block text-xs">/produk/{p.slug}</span>
                  </span>
                  <StatusBadge status={p.status} missing={p.missing} />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>
    </>
  );
}

function StatusBadge({ status, missing }: { status: "draft" | "published"; missing: string[] }) {
  if (status === "draft")
    return (
      <span className="border-jati text-jati rounded-full border border-dashed px-2.5 py-0.5 text-xs font-semibold">
        Draf
      </span>
    );
  if (missing.length)
    return (
      <span
        className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-900"
        title={`Belum tampil: ${missing.join(", ")}`}
      >
        Terbit · belum lengkap
      </span>
    );
  return (
    <span className="bg-lumut rounded-full px-2.5 py-0.5 text-xs font-semibold text-white">
      Tampil di situs
    </span>
  );
}
