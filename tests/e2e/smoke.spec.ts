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
