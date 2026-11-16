import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/admin/auth";
import { adminConfigured } from "@/lib/admin/users";
import { LoginForm } from "@/components/admin/login-form";

export const metadata: Metadata = { title: "Masuk" };

export default async function LoginPage() {
  if (await getSession()) redirect("/admin");
  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="border-border bg-surface w-full max-w-sm rounded-3xl border p-8 shadow-sm">
        {/* eslint-disable-next-line @next/next/no-img-element -- static logo */}
        <img src="/brand/kinetic-logo.svg" alt="Kinetic" className="h-10 w-auto" />
        <h1 className="font-display text-accent-strong mt-6 text-2xl font-semibold">Masuk ke admin</h1>
        <p className="text-muted mt-1 text-sm">Kelola produk di situs Kinetic.</p>
        {adminConfigured() ? (
          <LoginForm />
        ) : (
          <p className="border-jati text-muted mt-6 rounded-xl border border-dashed p-4 text-sm">
            Admin belum disiapkan: akun dan kunci sesi belum diatur. Lihat <code>content/README.md</code> →
            Admin.
          </p>
        )}
      </div>
    </main>
  );
}
