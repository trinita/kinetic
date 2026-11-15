import { expect, test } from "@playwright/test";

test("Indonesian home page is the default", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("lang", "id");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Dibuat dengan tangan");
  await expect(page).toHaveTitle(/Kinetic/);
});

test("English home page lives under /en", async ({ page }) => {
  await page.goto("/en");
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Made by hand");
});

test("WhatsApp buttons open a chat with the workshop number", async ({ page }) => {
  await page.goto("/");
  const links = page.locator('a[href^="https://wa.me/6281399325549"]');
  expect(await links.count()).toBeGreaterThan(0);
});

test("language switcher keeps the visitor on the same page", async ({ page }) => {
  await page.goto("/produk");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Produk");
  await page.getByRole("link", { name: "en", exact: true }).click();
  await expect(page).toHaveURL(/\/en\/products$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Products");
  await page.getByRole("link", { name: "id", exact: true }).click();
  await expect(page).toHaveURL(/\/produk$/);
});

test("English paths without /en redirect to the Indonesian URL", async ({ page }) => {
  await page.goto("/products");
  await expect(page).toHaveURL(/\/produk$/);
});

test("unknown pages show a translated 404", async ({ page }) => {
  const res = await page.goto("/tidak-ada");
  expect(res?.status()).toBe(404);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Halaman tidak ditemukan");
});

test("draft products stay hidden on the live site", async ({ page }) => {
  await page.goto("/produk");
  await expect(page.getByText("Katalog sedang kami siapkan")).toBeVisible();
  // Detail pages stream, so a hidden product is a "not found" page marked noindex (status stays 200).
  await page.goto("/produk/meja-ukir-lukis-tropis");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Halaman tidak ditemukan");
  await expect(page.locator('meta[name="robots"][content*="noindex"]')).toHaveCount(1);
});

test("contact form opens WhatsApp with the enquiry filled in", async ({ page, context }) => {
  await context.route("https://wa.me/**", (route) => route.fulfill({ body: "ok" }));
  await page.goto("/kontak");
  await page.getByLabel("Nama").fill("Budi");
  await page.getByLabel("Yang ingin ditanyakan").fill("meja makan jati");
  await page.getByLabel("Pesan").fill("Ukuran 180 cm");
  const [popup] = await Promise.all([
    page.waitForEvent("popup"),
    page.getByRole("button", { name: "Lanjut ke WhatsApp" }).click(),
  ]);
  const url = new URL(popup.url());
  expect(url.origin + url.pathname).toBe("https://wa.me/6281399325549");
  expect(url.searchParams.get("text")).toBe(
    "Halo Kinetic, saya Budi.\nSaya ingin bertanya tentang: meja makan jati\n\nUkuran 180 cm",
  );
});

test("about and contact pages show the workshop address and hours", async ({ page }) => {
  await page.goto("/en/about");
  await expect(page.getByText("the workshop behind Wood Knots").first()).toBeVisible();
  await page.goto("/kontak");
  await expect(page.getByText("Jl. Wibawa Mukti II No.39").first()).toBeVisible();
  await expect(page.getByText("Minggu–Jumat, 09.00–17.00 WIB").first()).toBeVisible();
});
