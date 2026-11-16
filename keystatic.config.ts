// Admin editor (Keystatic) at /keystatic — also reachable at /admin.
// On your computer (npm run dev) it saves straight to the files in content/.
// On the live site it saves to GitHub through your GitHub login, and Vercel rebuilds the site.

import { collection, config, fields } from "@keystatic/core";

const useGitHub =
  process.env.NODE_ENV === "production" || process.env.NEXT_PUBLIC_KEYSTATIC_STORAGE === "github";

const list = (label: string, description: string) =>
  fields.array(fields.text({ label }), { label, description, itemLabel: (p) => p.value || "…" });

export default config({
  storage: useGitHub ? { kind: "github", repo: "trinita/kinetic" } : { kind: "local" },
  ui: {
    brand: { name: "Kinetic — Admin" },
  },
  collections: {
    products: collection({
      label: "Produk",
      path: "content/products/*",
      slugField: "title",
      format: { data: "yaml" },
      entryLayout: "form",
      columns: ["title", "status"],
      schema: {
        title: fields.slug({
          name: { label: "Nama produk", validation: { isRequired: true } },
          slug: {
            label: "Alamat halaman",
            description:
              "Bagian akhir alamat, misalnya /produk/meja-jati. Huruf kecil dan tanda hubung saja. Jangan diubah setelah produk terbit.",
          },
        }),
        status: fields.select({
          label: "Status",
          description:
            "Terbit hanya tampil di situs jika kategori, ringkasan, foto, kayu, ukuran, waktu pengerjaan, dan ketersediaan sudah diisi.",
          options: [
            { label: "Draf — belum tampil di situs", value: "draft" },
            { label: "Terbit — tampil di situs", value: "published" },
          ],
          defaultValue: "draft",
        }),
        featured: fields.checkbox({ label: "Tampilkan di beranda (Karya pilihan)" }),
        category: fields.select({
          label: "Kategori",
          options: [
            { label: "— pilih —", value: "" },
            { label: "Meja", value: "meja" },
            { label: "Kursi", value: "kursi" },
            { label: "Bangku", value: "bangku" },
            { label: "Rak", value: "rak" },
            { label: "Lemari", value: "lemari" },
            { label: "Dekorasi", value: "dekorasi" },
            { label: "Lainnya", value: "lainnya" },
          ],
          defaultValue: "",
        }),
        images: fields.array(
          fields.object({
            image: fields.image({
              label: "Foto",
              directory: "public/images/products",
              publicPath: "/images/products/",
              validation: { isRequired: true },
            }),
            alt: fields.text({
              label: "Deskripsi foto (Indonesia)",
              description: "Apa yang terlihat di foto. Dibacakan untuk tunanetra dan dipakai pencarian.",
            }),
            altEn: fields.text({ label: "Photo description (English)" }),
          }),
          {
            label: "Foto",
            description: "Foto pertama menjadi foto utama di katalog. Minimal lebar 1200 px agar tajam.",
            itemLabel: (p) => p.fields.alt.value || "Foto",
          },
        ),
        summary: fields.text({
          label: "Ringkasan",
          description: "Satu atau dua kalimat untuk kartu katalog.",
          multiline: true,
        }),
        body: fields.markdoc.inline({
          label: "Deskripsi lengkap",
          options: { image: false, table: false },
        }),
        woods: list("Jenis kayu", "Misalnya: jati, mahoni."),
        finishes: list("Finishing", "Misalnya: cat akrilik, pernis."),
        customizable: list("Bisa disesuaikan", "Misalnya: ukuran, warna, motif."),
        dimensions: fields.text({
          label: "Ukuran",
          description: "Misalnya: 120 × 60 × 75 cm, atau Ø 60 × 55 cm.",
        }),
        leadTimeWeeks: fields.integer({ label: "Waktu pengerjaan (minggu)", validation: { min: 1 } }),
        madeToOrder: fields.select({
          label: "Ketersediaan",
          options: [
            { label: "— pilih —", value: "" },
            { label: "Bisa dipesan lagi", value: "yes" },
            { label: "Karya tunggal (hanya satu)", value: "no" },
          ],
          defaultValue: "",
        }),
        priceFrom: fields.integer({
          label: "Harga mulai (Rp)",
          description:
            'Angka saja, misalnya 2500000. Kosongkan untuk menampilkan "Tanya harga via WhatsApp".',
          validation: { min: 1 },
        }),
        en: fields.object(
          {
            title: fields.text({ label: "Product name" }),
            summary: fields.text({ label: "Summary", multiline: true }),
            body: fields.markdoc.inline({
              label: "Full description",
              options: { image: false, table: false },
            }),
            woods: list("Wood", "e.g. teak, mahogany. Leave empty to use the Indonesian words."),
            finishes: list("Finish", "e.g. acrylic paint, varnish."),
            customizable: list("Can be customised", "e.g. size, colour, pattern."),
          },
          {
            label: "English",
            description: "Optional. Anything left empty shows the Indonesian text on the English site.",
          },
        ),
      },
    }),
  },
});
