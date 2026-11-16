import Link from "next/link";
import { logout } from "@/app/admin/actions";

export function AdminHeader({ user, storage }: { user: string; storage: "local" | "github" | null }) {
  return (
    <header className="border-border bg-surface border-b">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-4 px-4 py-3 sm:px-6">
        <Link href="/admin" className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element -- static logo */}
          <img src="/brand/kinetic-logo.svg" alt="Kinetic" className="h-8 w-auto" />
          <span className="text-muted text-sm font-semibold">Admin</span>
        </Link>
        <span className="text-muted ml-auto text-xs">
          {storage === "local"
            ? "Mode komputer: menyimpan ke file lokal"
            : storage === "github"
              ? "Situs langsung"
              : ""}
        </span>
        <a
          href="/"
          target="_blank"
          className="text-accent text-sm font-semibold underline underline-offset-4"
        >
          Lihat situs
        </a>
        <form action={logout}>
          <button
            type="submit"
            className="border-border rounded-full border px-4 py-1.5 text-sm font-semibold"
          >
            Keluar ({user})
          </button>
        </form>
      </div>
    </header>
  );
}
