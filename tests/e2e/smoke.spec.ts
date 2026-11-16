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
  // Next may add its own noindex tag next to the page's; at least one must be present.
  expect(await page.locator('meta[name="robots"][content*="noindex"]').count()).toBeGreaterThan(0);
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

test("search page finds workshop info without JavaScript-dependent UI", async ({ page }) => {
  await page.goto("/cari?q=jam+buka");
  await expect(page.getByText("hasil untuk “jam buka”")).toBeVisible();
  await expect(page.getByRole("link", { name: /Kontak/ }).last()).toHaveAttribute("href", "/kontak");
  await page.goto("/en/search?q=opening+hours");
  await expect(page.getByRole("link", { name: /Contact/ }).last()).toHaveAttribute("href", "/en/contact");
  await page.goto("/cari?q=xyzzy");
  await expect(page.getByText("Tidak ada hasil untuk “xyzzy”")).toBeVisible();
});

test("search dialog opens from the header and navigates to a result", async ({ page, isMobile }) => {
  // Wait for the page to become interactive before using the keyboard shortcut.
  await page.goto("/", { waitUntil: "networkidle" });
  if (isMobile) await page.getByRole("link", { name: "Cari di situs" }).click();
  else await page.keyboard.press("ControlOrMeta+k");
  const input = page.getByRole("combobox", { name: "Cari di situs" });
  await expect(input).toBeFocused();
  await input.fill("cara memesan");
  await expect(page.getByRole("option").first()).toContainText("Cara memesan");
  await input.press("Enter");
  await expect(page).toHaveURL(/\/#order$/);
});

test("search API returns results for the requested language", async ({ request }) => {
  const res = await request.get("/api/search?q=wood%20knots&lang=en");
  expect(res.ok()).toBe(true);
  const body = await res.json();
  expect(body.results[0]).toMatchObject({ type: "page", url: "/en/about" });
});

test("chat assistant answers from the site and hands orders to WhatsApp", async ({ page }) => {
  await page.goto("/", { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Tanya kami" }).click();
  const chat = page.getByRole("dialog", { name: "Asisten Kinetic" });
  await expect(chat).toBeVisible();

  const box = chat.getByRole("textbox");
  await box.fill("jam buka");
  await box.press("Enter");
  await expect(chat.getByRole("link", { name: "Kontak" })).toHaveAttribute("href", "/kontak");

  await box.fill("Saya mau pesan meja");
  await chat.getByRole("button", { name: "Kirim" }).click();
  const whatsapp = chat.getByRole("link", { name: "Lanjutkan di WhatsApp" });
  await expect(whatsapp).toHaveAttribute("href", /^https:\/\/wa\.me\/6281399325549\?text=/);

  // The conversation survives navigating to another page.
  await page.goto("/kontak");
  await page.getByRole("button", { name: "Tanya kami" }).click();
  await expect(page.getByRole("dialog").getByText("Saya mau pesan meja")).toBeVisible();
});

test("chat API rejects other websites and malformed requests", async ({ request }) => {
  const body = { locale: "id", messages: [{ role: "user", content: "halo" }] };
  const crossSite = await request.post("/api/chat", {
    data: body,
    headers: { origin: "https://evil.example" },
  });
  expect(crossSite.status()).toBe(403);
  const bad = await request.post("/api/chat", { data: { locale: "id", messages: [] } });
  expect(bad.status()).toBe(400);
});

test("admin is reachable at /admin and stays closed until GitHub login is set up", async ({ request }) => {
  const res = await request.get("/admin", { maxRedirects: 0 });
  expect(res.status()).toBe(307);
  expect(res.headers()["location"]).toBe("/keystatic");
  // Production uses GitHub storage; without the GitHub App credentials the API refuses.
  const api = await request.get("/api/keystatic/github/login");
  expect(api.status()).toBe(503);
});
