import type { Metadata } from "next";
import { requireSession } from "@/lib/admin/auth";
import { emptyProduct } from "@/lib/admin/products";
import { storageKind } from "@/lib/admin/storage";
import { AdminHeader } from "@/components/admin/admin-header";
import { ProductEditor } from "@/components/admin/product-editor";

export const metadata: Metadata = { title: "Tambah produk" };

export default async function NewProductPage() {
  const session = await requireSession();
  return (
    <>
      <AdminHeader user={session.user} storage={storageKind()} />
      <ProductEditor mode="create" initial={emptyProduct()} imagesFromStorage={storageKind() === "github"} />
    </>
  );
}
