import type { Metadata } from "next";
import { Suspense } from "react";
import { fraunces, jakarta } from "@/lib/fonts";
import "../globals.css";

// The admin is its own root layout (the public site's lives in app/[lang]).
export const metadata: Metadata = {
  title: { default: "Admin · Kinetic", template: "%s · Admin Kinetic" },
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return (
    <html lang="id" className={`${fraunces.variable} ${jakarta.variable} antialiased`}>
      <body className="min-h-screen font-sans">
        {/* Every admin page reads the login cookie, so it renders per request. */}
        <Suspense fallback={<p className="text-muted p-8">Memuat…</p>}>{children}</Suspense>
      </body>
    </html>
  );
}
