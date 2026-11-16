import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireSession } from "@/lib/admin/auth";
import { productPath, toForm } from "@/lib/admin/products";
import { getStorage, storageKind } from "@/lib/admin/storage";
import { AdminHeader } from "@/components/admin/admin-header";
import { ProductEditor } from "@/components/admin/product-editor";

export const metadata: Metadata = { title: "Ubah produk" };

export default async function EditProductPage({ params, searchParams }: PageProps<"/admin/produk/[slug]">) {
  const session = await requireSession();
  const [{ slug }, { disimpan }] = await Promise.all([params, searchParams]);
  const storage = getStorage();
  const file = storage && /^[a-z0-9-]+$/.test(slug) ? await storage.read(productPath(slug)) : null;
  if (!file) notFound();

  return (
    <>
      <AdminHeader user={session.user} storage={storageKind()} />
      <ProductEditor
        mode="edit"
        slug={slug}
        version={file.version}
        initial={toForm(file.data.toString())}
        imagesFromStorage={storageKind() === "github"}
        justCreated={disimpan === "1"}
      />
    </>
  );
}
