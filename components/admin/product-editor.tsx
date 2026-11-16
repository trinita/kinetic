"use client";

import Link from "next/link";
import Markdown from "react-markdown";
import { useRef, useState, useTransition } from "react";
import { deleteProduct, saveProduct, type SaveResult } from "@/app/admin/actions";
import type { ProductForm } from "@/lib/admin/products-shared";
import { missingForPublish, slugify } from "@/lib/admin/products-shared";

type ImageItem = {
  key: string;
  kind: "existing" | "new";
  image?: string; // existing: stored path
  file?: File; // new: compressed upload
  preview: string;
  alt: string;
  altEn: string;
};

const CATEGORIES = [
  ["", "— pilih —"],
  ["meja", "Meja"],
  ["kursi", "Kursi"],
  ["bangku", "Bangku"],
  ["rak", "Rak"],
  ["lemari", "Lemari"],
  ["dekorasi", "Dekorasi"],
  ["lainnya", "Lainnya"],
] as const;

const MAX_UPLOAD_BYTES = 3.8 * 1024 * 1024; // keep each save under Vercel's request limit
const toList = (s: string) =>
  s
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);
const fromList = (l: string[]) => l.join(", ");

/** Shrinks a photo in the browser (max 2000 px, JPEG) so phone photos upload quickly. */
async function compress(file: File): Promise<File> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, 2000 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  const blob = await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("compress failed"))), "image/jpeg", 0.85),
  );
  return new File([blob], file.name.replace(/\.[^.]+$/, "") + ".jpg", { type: "image/jpeg" });
}

export function ProductEditor({
  mode,
  slug: initialSlug = "",
  version: initialVersion = "",
  initial,
  imagesFromStorage,
  justCreated = false,
}: {
  mode: "create" | "edit";
  slug?: string;
  version?: string;
  initial: ProductForm;
  /** Live site: preview photos through the protected admin route (new photos aren't deployed yet). */
  imagesFromStorage: boolean;
  justCreated?: boolean;
}) {
  const [form, setForm] = useState(initial);
  const [lists, setLists] = useState({
    woods: fromList(initial.woods),
    finishes: fromList(initial.finishes),
    customizable: fromList(initial.customizable),
    enWoods: fromList(initial.en.woods),
    enFinishes: fromList(initial.en.finishes),
    enCustomizable: fromList(initial.en.customizable),
  });
  const [slug, setSlug] = useState(initialSlug);
  const [slugEdited, setSlugEdited] = useState(mode === "edit");
  const [version, setVersion] = useState(initialVersion);
  const [images, setImages] = useState<ImageItem[]>(() =>
    initial.images.map((img, i) => ({
      key: `e${i}`,
      kind: "existing",
      image: img.image,
      preview: imagesFromStorage
        ? `/admin/image?path=${encodeURIComponent(`public${img.image}`)}`
        : img.image,
      alt: img.alt,
      altEn: img.altEn,
    })),
  );
  const [result, setResult] = useState<SaveResult | null>(
    justCreated ? { ok: true, message: "Produk dibuat." } : null,
  );
  const [busy, startTransition] = useTransition();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [preview, setPreview] = useState<"id" | "en" | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const counter = useRef(0);

  const set = <K extends keyof ProductForm>(key: K, value: ProductForm[K]) =>
    setForm((f) => ({ ...f, [key]: value }));
  const setEn = <K extends keyof ProductForm["en"]>(key: K, value: ProductForm["en"][K]) =>
    setForm((f) => ({ ...f, en: { ...f.en, [key]: value } }));

  const current: ProductForm = {
    ...form,
    woods: toList(lists.woods),
    finishes: toList(lists.finishes),
    customizable: toList(lists.customizable),
    images: images.map((i) => ({ image: i.image ?? "new", alt: i.alt, altEn: i.altEn })),
    en: {
      ...form.en,
      woods: toList(lists.enWoods),
      finishes: toList(lists.enFinishes),
      customizable: toList(lists.enCustomizable),
    },
  };
  const missing = missingForPublish(current);

  async function addPhotos(files: FileList | null) {
    if (!files) return;
    const added: ImageItem[] = [];
    for (const file of Array.from(files)) {
      if (!file.type.startsWith("image/")) continue;
      const small = await compress(file).catch(() => file);
      added.push({
        key: `n${counter.current++}`,
        kind: "new",
        file: small,
        preview: URL.createObjectURL(small),
        alt: "",
        altEn: "",
      });
    }
    setImages((list) => [...list, ...added]);
    if (fileInput.current) fileInput.current.value = "";
  }

  const move = (i: number, d: -1 | 1) =>
    setImages((list) => {
      const next = [...list];
      const j = i + d;
      if (j < 0 || j >= next.length) return list;
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });

  function save() {
    const newFiles = images.filter((i) => i.kind === "new");
    const bytes = newFiles.reduce((n, i) => n + (i.file?.size ?? 0), 0);
    if (bytes > MAX_UPLOAD_BYTES) {
      setResult({
        ok: false,
        message: "Terlalu banyak foto baru sekaligus. Simpan sebagian dulu, lalu tambahkan sisanya.",
      });
      return;
    }
    const data = {
      ...current,
      images: images.map((i) =>
        i.kind === "existing"
          ? { kind: "existing", image: i.image, alt: i.alt, altEn: i.altEn }
          : { kind: "new", id: i.key, alt: i.alt, altEn: i.altEn },
      ),
    };
    const fd = new FormData();
    fd.set("mode", mode);
    fd.set("slug", slug);
    fd.set("version", version);
    fd.set("data", JSON.stringify(data));
    for (const i of newFiles) if (i.file) fd.set(`image:${i.key}`, i.file);

    startTransition(async () => {
      const res = await saveProduct(fd);
      setResult(res);
      if (res.ok && res.version) {
        setVersion(res.version);
        // Saved photos are now stored; reload to get their real paths.
        if (newFiles.length) window.location.reload();
      }
    });
  }

  const field =
    "border-border bg-bg focus:border-accent mt-1 w-full rounded-xl border px-3 py-2.5 text-base outline-none focus-visible:outline-none";
  const label = "block text-sm font-semibold";
  const hint = "text-muted mt-0.5 block text-xs font-normal";

  return (
    <main className="mx-auto max-w-3xl px-4 pt-8 pb-32 sm:px-6">
      <Link href="/admin" className="text-muted text-sm font-semibold hover:underline">
        ← Semua produk
      </Link>
      <h1 className="font-display text-accent-strong mt-3 text-3xl font-semibold">
        {mode === "create" ? "Tambah produk" : form.title || "Produk"}
      </h1>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          save();
        }}
        className="mt-8 space-y-10"
      >
        {/* --- Basics */}
        <Section title="Dasar">
          <label className={label}>
            Nama produk *
            <input
              required
              maxLength={120}
              value={form.title}
              onChange={(e) => {
                set("title", e.target.value);
                if (!slugEdited) setSlug(slugify(e.target.value));
              }}
              className={field}
            />
          </label>
          <label className={label}>
            Alamat halaman
            <span className={hint}>
              {mode === "create"
                ? "Bagian akhir alamat: /produk/… Huruf kecil, angka, dan tanda hubung. Tidak bisa diubah setelah dibuat."
                : "Tidak bisa diubah setelah dibuat."}
            </span>
            <div className="mt-1 flex items-center gap-1">
              <span className="text-muted text-sm">/produk/</span>
              <input
                required
                pattern="[a-z0-9]+(-[a-z0-9]+)*"
                maxLength={80}
                value={slug}
                readOnly={mode === "edit"}
                onChange={(e) => {
                  setSlug(e.target.value);
                  setSlugEdited(true);
                }}
                className={`${field} mt-0 ${mode === "edit" ? "text-muted" : ""}`}
              />
            </div>
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className={label}>
              Status
              <select
                value={form.status}
                onChange={(e) => set("status", e.target.value as ProductForm["status"])}
                className={field}
              >
                <option value="draft">Draf — belum tampil</option>
                <option value="published">Terbit — tampil di situs</option>
              </select>
            </label>
            <label className={label}>
              Kategori
              <select
                value={form.category}
                onChange={(e) => set("category", e.target.value as ProductForm["category"])}
                className={field}
              >
                {CATEGORIES.map(([v, l]) => (
                  <option key={v} value={v}>
                    {l}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label className="flex items-center gap-2 text-sm font-semibold">
            <input
              type="checkbox"
              checked={form.featured}
              onChange={(e) => set("featured", e.target.checked)}
              className="size-4"
            />
            Tampilkan di beranda (Karya pilihan)
          </label>
          {form.status === "published" && missing.length > 0 && (
            <p className="rounded-xl bg-amber-100 px-3 py-2 text-sm text-amber-900">
              Belum akan tampil di situs sampai diisi: <strong>{missing.join(", ")}</strong>.
            </p>
          )}
        </Section>

        {/* --- Photos */}
        <Section
          title="Foto"
          description="Foto pertama menjadi foto utama. Foto otomatis diperkecil sebelum diunggah."
        >
          {images.length > 0 && (
            <ul className="space-y-3">
              {images.map((img, i) => (
                <li key={img.key} className="border-border flex gap-3 rounded-2xl border p-3">
                  {/* eslint-disable-next-line @next/next/no-img-element -- local/blob preview */}
                  <img
                    src={img.preview}
                    alt=""
                    className="bg-walnut size-24 shrink-0 rounded-xl object-cover"
                  />
                  <div className="min-w-0 flex-1 space-y-2">
                    <input
                      aria-label={`Deskripsi foto ${i + 1} (Indonesia)`}
                      placeholder="Deskripsi foto (Indonesia) — apa yang terlihat"
                      value={img.alt}
                      maxLength={300}
                      onChange={(e) =>
                        setImages((l) =>
                          l.map((x) => (x.key === img.key ? { ...x, alt: e.target.value } : x)),
                        )
                      }
                      className={`${field} mt-0 text-sm`}
                    />
                    <input
                      aria-label={`Photo ${i + 1} description (English)`}
                      placeholder="Photo description (English)"
                      value={img.altEn}
                      maxLength={300}
                      onChange={(e) =>
                        setImages((l) =>
                          l.map((x) => (x.key === img.key ? { ...x, altEn: e.target.value } : x)),
                        )
                      }
                      className={`${field} mt-0 text-sm`}
                    />
                    <div className="flex flex-wrap gap-2 text-xs font-semibold">
                      {i === 0 && (
                        <span className="bg-accent-strong text-on-accent-strong rounded-full px-2 py-1">
                          Foto utama
                        </span>
                      )}
                      {img.kind === "new" && (
                        <span className="text-jati px-1 py-1">Baru — tersimpan saat Anda klik Simpan</span>
                      )}
                      <button
                        type="button"
                        onClick={() => move(i, -1)}
                        disabled={i === 0}
                        className="border-border rounded-full border px-2.5 py-1 disabled:opacity-30"
                      >
                        ↑ Naik
                      </button>
                      <button
                        type="button"
                        onClick={() => move(i, 1)}
                        disabled={i === images.length - 1}
                        className="border-border rounded-full border px-2.5 py-1 disabled:opacity-30"
                      >
                        ↓ Turun
                      </button>
                      <button
                        type="button"
                        onClick={() => setImages((l) => l.filter((x) => x.key !== img.key))}
                        className="rounded-full border border-red-300 px-2.5 py-1 text-red-700"
                      >
                        Hapus foto
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
          <input
            ref={fileInput}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/heic"
            multiple
            onChange={(e) => void addPhotos(e.target.files)}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInput.current?.click()}
            className="border-border hover:border-accent rounded-full border px-4 py-2 text-sm font-semibold"
          >
            + Tambah foto
          </button>
        </Section>

        {/* --- Text (Indonesian) */}
        <Section title="Teks (Indonesia)">
          <label className={label}>
            Ringkasan
            <span className={hint}>Satu atau dua kalimat untuk kartu katalog.</span>
            <textarea
              rows={2}
              maxLength={500}
              value={form.summary}
              onChange={(e) => set("summary", e.target.value)}
              className={field}
            />
          </label>
          <BodyField
            label="Deskripsi lengkap"
            value={form.body}
            onChange={(v) => set("body", v)}
            showPreview={preview === "id"}
            togglePreview={() => setPreview(preview === "id" ? null : "id")}
            className={field}
          />
        </Section>

        {/* --- Details */}
        <Section title="Detail">
          <ListField
            label="Jenis kayu"
            hint="Pisahkan dengan koma, misalnya: jati, mahoni"
            value={lists.woods}
            onChange={(v) => setLists((l) => ({ ...l, woods: v }))}
            className={field}
          />
          <ListField
            label="Finishing"
            hint="Misalnya: cat akrilik, pernis"
            value={lists.finishes}
            onChange={(v) => setLists((l) => ({ ...l, finishes: v }))}
            className={field}
          />
          <ListField
            label="Bisa disesuaikan"
            hint="Misalnya: ukuran, warna, motif"
            value={lists.customizable}
            onChange={(v) => setLists((l) => ({ ...l, customizable: v }))}
            className={field}
          />
          <label className={label}>
            Ukuran
            <span className={hint}>Misalnya: 120 × 60 × 75 cm, atau Ø 60 × 55 cm</span>
            <input
              maxLength={120}
              value={form.dimensions}
              onChange={(e) => set("dimensions", e.target.value)}
              className={field}
            />
          </label>
          <div className="grid gap-4 sm:grid-cols-3">
            <label className={label}>
              Waktu pengerjaan (minggu)
              <input
                type="number"
                min={1}
                max={104}
                inputMode="numeric"
                value={form.leadTimeWeeks ?? ""}
                onChange={(e) => set("leadTimeWeeks", e.target.value ? Number(e.target.value) : null)}
                className={field}
              />
            </label>
            <label className={label}>
              Ketersediaan
              <select
                value={form.madeToOrder}
                onChange={(e) => set("madeToOrder", e.target.value as ProductForm["madeToOrder"])}
                className={field}
              >
                <option value="">— pilih —</option>
                <option value="yes">Bisa dipesan lagi</option>
                <option value="no">Karya tunggal</option>
              </select>
            </label>
            <label className={label}>
              Harga mulai (Rp)
              <input
                type="number"
                min={1}
                inputMode="numeric"
                placeholder="Kosong = tanya via WA"
                value={form.priceFrom ?? ""}
                onChange={(e) => set("priceFrom", e.target.value ? Number(e.target.value) : null)}
                className={field}
              />
            </label>
          </div>
        </Section>

        {/* --- English */}
        <Section
          title="English (opsional)"
          description="Yang dikosongkan akan memakai teks Indonesia di situs bahasa Inggris."
        >
          <label className={label}>
            Product name
            <input
              maxLength={120}
              value={form.en.title}
              onChange={(e) => setEn("title", e.target.value)}
              className={field}
            />
          </label>
          <label className={label}>
            Summary
            <textarea
              rows={2}
              maxLength={500}
              value={form.en.summary}
              onChange={(e) => setEn("summary", e.target.value)}
              className={field}
            />
          </label>
          <BodyField
            label="Full description"
            value={form.en.body}
            onChange={(v) => setEn("body", v)}
            showPreview={preview === "en"}
            togglePreview={() => setPreview(preview === "en" ? null : "en")}
            className={field}
          />
          <ListField
            label="Wood"
            hint="e.g. teak, mahogany"
            value={lists.enWoods}
            onChange={(v) => setLists((l) => ({ ...l, enWoods: v }))}
            className={field}
          />
          <ListField
            label="Finish"
            hint="e.g. acrylic paint, varnish"
            value={lists.enFinishes}
            onChange={(v) => setLists((l) => ({ ...l, enFinishes: v }))}
            className={field}
          />
          <ListField
            label="Can be customised"
            hint="e.g. size, colour, pattern"
            value={lists.enCustomizable}
            onChange={(v) => setLists((l) => ({ ...l, enCustomizable: v }))}
            className={field}
          />
        </Section>

        {/* --- Delete */}
        {mode === "edit" && (
          <Section title="Hapus produk">
            {!confirmDelete ? (
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                className="rounded-full border border-red-300 px-4 py-2 text-sm font-semibold text-red-700"
              >
                Hapus produk ini…
              </button>
            ) : (
              <div className="rounded-2xl border border-red-300 p-4">
                <p className="text-sm">
                  Produk dan semua fotonya akan dihapus dari situs.{" "}
                  <strong>Ini tidak bisa dibatalkan dari admin.</strong>
                </p>
                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() =>
                      startTransition(async () => setResult(await deleteProduct(initialSlug, version)))
                    }
                    className="rounded-full bg-red-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                  >
                    Ya, hapus permanen
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(false)}
                    className="border-border rounded-full border px-4 py-2 text-sm font-semibold"
                  >
                    Batal
                  </button>
                </div>
              </div>
            )}
          </Section>
        )}

        {/* --- Save bar */}
        <div className="border-border bg-surface/95 fixed inset-x-0 bottom-0 border-t backdrop-blur">
          <div className="mx-auto flex max-w-3xl flex-wrap items-center gap-3 px-4 py-3 sm:px-6">
            <button
              type="submit"
              disabled={busy}
              className="bg-accent-strong text-on-accent-strong rounded-full px-6 py-2.5 font-semibold hover:opacity-90 disabled:opacity-50"
            >
              {busy ? "Menyimpan…" : mode === "create" ? "Buat produk" : "Simpan"}
            </button>
            {result && (
              <p
                role="status"
                className={`text-sm ${result.ok ? "text-lumut" : "font-semibold text-red-700 dark:text-red-400"}`}
              >
                {result.message}
                {result.ok && result.missing?.length
                  ? ` Belum tampil sampai diisi: ${result.missing.join(", ")}.`
                  : ""}
              </p>
            )}
          </div>
        </div>
      </form>
    </main>
  );
}

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-4">
      <div>
        <h2 className="font-display text-accent-strong text-xl font-semibold">{title}</h2>
        {description && <p className="text-muted text-sm">{description}</p>}
      </div>
      {children}
    </section>
  );
}

function ListField(props: {
  label: string;
  hint: string;
  value: string;
  onChange: (v: string) => void;
  className: string;
}) {
  return (
    <label className="block text-sm font-semibold">
      {props.label}
      <span className="text-muted mt-0.5 block text-xs font-normal">{props.hint}</span>
      <input
        value={props.value}
        maxLength={600}
        onChange={(e) => props.onChange(e.target.value)}
        className={props.className}
      />
    </label>
  );
}

function BodyField(props: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  showPreview: boolean;
  togglePreview: () => void;
  className: string;
}) {
  return (
    <div>
      <div className="flex items-end justify-between gap-2">
        <label htmlFor={props.label} className="block text-sm font-semibold">
          {props.label}
          <span className="text-muted mt-0.5 block text-xs font-normal">
            Baris kosong = paragraf baru · <code>## Judul</code> · <code>- daftar</code> ·{" "}
            <code>**tebal**</code>
          </span>
        </label>
        <button
          type="button"
          onClick={props.togglePreview}
          className="text-accent text-xs font-semibold underline"
        >
          {props.showPreview ? "Tutup pratinjau" : "Pratinjau"}
        </button>
      </div>
      <textarea
        id={props.label}
        rows={8}
        maxLength={10000}
        value={props.value}
        onChange={(e) => props.onChange(e.target.value)}
        className={props.className}
      />
      {props.showPreview && (
        <div className="border-border [&_h2]:font-display mt-2 rounded-xl border p-4 text-sm leading-relaxed [&_h2]:mt-4 [&_h2]:text-lg [&_h2]:font-semibold [&_li]:ml-5 [&_li]:list-disc [&_p]:my-2">
          <Markdown components={{ img: () => null }}>{props.value || "_(kosong)_"}</Markdown>
        </div>
      )}
    </div>
  );
}
