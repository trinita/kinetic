import type { Metadata } from "next";
import { getDictionary, getLocale } from "@/lib/i18n/dictionaries";
import { getProducts } from "@/lib/content";
import { productCategories } from "@/lib/content/schemas";
import { EmptyState, PageHeader, Section } from "@/components/ui/page-header";
import { InstagramLink, WhatsAppButton } from "@/components/ui/links";
import { ProductGrid } from "@/components/product/product-grid";
import { toCard } from "@/components/product/to-card";

export async function generateMetadata(): Promise<Metadata> {
  const dict = await getDictionary();
  return { title: dict.nav.products, description: dict.products.intro };
}

export default async function ProductsPage() {
  const [locale, dict] = await Promise.all([getLocale(), getDictionary()]);
  const products = getProducts(locale);

  return (
    <>
      <PageHeader title={dict.nav.products} intro={dict.products.intro} />
      <Section>
        {products.length ? (
          <ProductGrid
            products={products.map((p) => toCard(p, locale, dict))}
            categories={productCategories.map((c) => [c, dict.categories[c]])}
            labels={{
              all: dict.products.all,
              filterLabel: dict.products.filterLabel,
              draft: dict.common.draft,
            }}
          />
        ) : (
          <EmptyState message={dict.products.empty}>
            <WhatsAppButton message={dict.home.whatsappMessage}>{dict.common.whatsapp}</WhatsAppButton>
            <InstagramLink>{dict.common.seeInstagram}</InstagramLink>
          </EmptyState>
        )}
      </Section>
    </>
  );
}
