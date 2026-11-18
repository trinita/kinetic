import type { Metadata } from "next";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { ChatWidget } from "@/components/chat/chat-widget";
import { chatEnabled } from "@/lib/ai/config";
import { getDictionary, getLocale } from "@/lib/i18n/dictionaries";
import { href, locales } from "@/lib/i18n/routing";
import { fraunces, inter, jakarta } from "@/lib/fonts";
import "../globals.css";

export async function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

export async function generateMetadata(): Promise<Metadata> {
  const dict = await getDictionary();
  return {
    title: { default: dict.meta.title, template: `%s · ${dict.meta.title}` },
    description: dict.meta.description,
    alternates: {
      languages: { id: href("id", "home"), en: href("en", "home") },
    },
  };
}

export default async function RootLayout({ children }: LayoutProps<"/[lang]">) {
  const [locale, dict] = await Promise.all([getLocale(), getDictionary()]);
  return (
    <html
      lang={locale}
      className={`${fraunces.variable} ${jakarta.variable} ${inter.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col font-sans">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
        {chatEnabled() && <ChatWidget locale={locale} labels={dict.chat} />}
      </body>
    </html>
  );
}
