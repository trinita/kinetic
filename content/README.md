# Website content — how to fill in

All text on the website that isn't a menu label lives here, as Markdown files:

| Folder          | What                                           | Web page                         |
| --------------- | ---------------------------------------------- | -------------------------------- |
| `products/`     | Products in the catalog                        | `/produk`, `/produk/<nama-file>` |
| `services/`     | Services                                       | `/layanan`                       |
| `case-studies/` | Projects (finished work for a client or place) | `/proyek`, `/proyek/<nama-file>` |
| `blog/`         | Articles (care tips, behind the scenes…)       | `/blog`, `/blog/<nama-file>`     |
| `team/`         | Team members                                   | `/tentang/tim`                   |
| `pages/about.*` | The story on the About page                    | `/tentang`                       |

## Two files per item

- `<nama>.id.md` — **Indonesian, required.** Holds all the facts (size, price, photos, date…).
- `<nama>.en.md` — **English, optional.** Only the translated text. If it's missing, the English site shows the Indonesian text.

The file name becomes the web address, in both languages: `meja-ukir-lukis-tropis.id.md` → `/produk/meja-ukir-lukis-tropis` and `/en/products/meja-ukir-lukis-tropis`. Use lowercase letters, numbers and `-` only.

## Drafts and TODO

- Every file starts as `status: draft`. Drafts show on your computer (`npm run dev`, with a "Draf" badge) but **not** on the live website.
- Anything written as `TODO …` counts as "not filled in yet" and is hidden.
- When an item is complete, change `status: draft` to `status: published`. The build stops with a clear message if a published item still has a `TODO` or a required field missing, so nothing half-finished goes live.

## Adding something new

Copy the `_template.id.md` (and `_template.en.md`) in that folder, rename them, and fill them in.
Photos go in `public/images/<folder>/`, e.g. `public/images/products/meja-kopi-jati-1.jpg`.
The first photo is the main one shown in lists. Landscape or portrait both work; at least 1200 px wide looks best.

## Product fields

| Field           | What to write                                                                            | Example                |
| --------------- | ---------------------------------------------------------------------------------------- | ---------------------- |
| `title`         | Product name                                                                             | Meja Ukir Lukis Tropis |
| `featured`      | `true` to show it on the home page                                                       | true                   |
| `category`      | One of: meja, kursi, bangku, rak, lemari, dekorasi, lainnya                              | meja                   |
| `woods`         | Wood types                                                                               | [jati, mahoni]         |
| `finishes`      | Finish / paint                                                                           | [cat akrilik, pernis]  |
| `dimensions`    | Size                                                                                     | Ø 60 × 55 cm           |
| `leadTimeWeeks` | How many weeks it takes to make                                                          | 3                      |
| `madeToOrder`   | `true` = can be ordered again, `false` = one-off piece                                   | true                   |
| `priceFrom`     | Starting price in rupiah (numbers only), or empty to show "Tanya harga via WhatsApp"     | 2500000                |
| `customizable`  | What a customer can change                                                               | [ukuran, warna, motif] |
| `images`        | Photos, each with a short description (read aloud to blind visitors, and used by search) |                        |
| `summary`       | One or two sentences for the catalog card                                                |                        |

The text below the second `---` is the full description on the product page. `## Heading` makes a heading, `- item` makes a bullet list, `**bold**` makes bold text.
