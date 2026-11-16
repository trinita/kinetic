import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { expect, test } from "@playwright/test";

// Same folder as playwright.config.ts: a throwaway copy of the products.
const ROOT = path.join(os.tmpdir(), "kinetic-e2e-admin");

// These tests change shared files, so run them once, in order, on desktop only.
test.describe.configure({ mode: "serial" });
test.skip(({ isMobile }) => isMobile, "admin flow runs on desktop only");

test("admin pages and photos require a login", async ({ page, request }) => {
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/admin\/login$/);
  expect((await request.get("/admin/image?path=public/images/site/hero.jpg")).status()).toBe(401);
});

test("wrong password is rejected", async ({ page }) => {
  await page.goto("/admin/login");
  await page.getByLabel("Nama pengguna").fill("tester");
  await page.getByLabel("Kata sandi").fill("not-the-password");
  await page.getByRole("button", { name: "Masuk" }).click();
  await expect(page.getByText("Nama pengguna atau kata sandi salah.")).toBeVisible();
});

test("log in, edit, create with a photo, delete, log out", async ({ page }) => {
  await page.goto("/admin/login");
  await page.getByLabel("Nama pengguna").fill("Tester");
  await page.getByLabel("Kata sandi").fill("e2e-test-password");
  await page.getByRole("button", { name: "Masuk" }).click();
  await expect(page.getByRole("heading", { name: "Produk" })).toBeVisible();

  // Edit an existing product
  await page.getByRole("link", { name: /Meja Ukir Lukis Tropis/ }).click();
  await page.getByRole("textbox", { name: /^Ukuran/ }).fill("Ø 60 × 55 cm");
  await page.getByRole("button", { name: "Simpan" }).click();
  await expect(page.getByRole("status")).toContainText("Tersimpan");
  const yaml = fs.readFileSync(path.join(ROOT, "content/products/meja-ukir-lukis-tropis.yaml"), "utf8");
  expect(yaml).toContain("dimensions: Ø 60 × 55 cm");
  expect(yaml).toContain("image: /images/products/meja-ukir-lukis-tropis/images/0/image.jpg"); // photos kept

  // Create a new product with a photo
  await page.goto("/admin/produk/baru");
  await page.getByLabel("Nama produk").fill("Rak Uji Coba");
  await page.locator('input[type="file"]').setInputFiles("public/images/site/about.jpg");
  await page.getByPlaceholder("Deskripsi foto (Indonesia)").fill("Foto uji");
  await page.getByRole("button", { name: "Buat produk" }).click();
  await expect(page).toHaveURL(/\/admin\/produk\/rak-uji-coba\?disimpan=1$/);
  const created = fs.readFileSync(path.join(ROOT, "content/products/rak-uji-coba.yaml"), "utf8");
  const photo = created.match(/image: (\/images\/products\/rak-uji-coba\/\S+\.jpg)/)?.[1];
  expect(photo).toBeTruthy();
  expect(fs.statSync(path.join(ROOT, "public", photo!)).size).toBeGreaterThan(1000);

  // Delete it again
  await page.getByRole("button", { name: "Hapus produk ini…" }).click();
  await page.getByRole("button", { name: "Ya, hapus permanen" }).click();
  await expect(page).toHaveURL(/\/admin\?dihapus=rak-uji-coba$/);
  expect(fs.existsSync(path.join(ROOT, "content/products/rak-uji-coba.yaml"))).toBe(false);
  expect(fs.existsSync(path.join(ROOT, "public", photo!))).toBe(false); // its photo is gone too

  // Log out
  await page.getByRole("button", { name: /Keluar/ }).click();
  await expect(page).toHaveURL(/\/admin\/login$/);
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/admin\/login$/);
});
