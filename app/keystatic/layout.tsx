import type { Metadata } from "next";
import KeystaticApp from "./keystatic";

// The admin is its own root layout (the public site's lives in app/[lang]).
export const metadata: Metadata = { title: "Kinetic — Admin", robots: { index: false, follow: false } };

// The editor is a client-side app with nothing to prerender, so skip instant-navigation validation.
export const instant = false;

export default function Layout() {
  return (
    <html lang="id">
      <body>
        <KeystaticApp />
      </body>
    </html>
  );
}
