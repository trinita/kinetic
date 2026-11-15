# Products — how to fill in

Each product has two files: `<slug>.id.mdx` (Indonesian, main) and `<slug>.en.mdx` (English).
Fill in every `TODO`, then change `status: draft` to `status: published`.
Drafts are not shown on the website.

To add a new product, copy `_template.id.mdx` and `_template.en.mdx`, rename them to the
product's slug (lowercase, words separated by `-`, e.g. `meja-kopi-jati`), and fill them in.
Photos go in `public/images/products/` named `<slug>-1.jpg`, `<slug>-2.jpg`, …
The first photo is the main one shown in the catalog.

## Fields

| Field | What to write | Example |
|---|---|---|
| `title` | Product name | Meja Ukir Lukis Tropis |
| `category` | One of: meja, kursi, bangku, rak, lemari, dekorasi, lainnya | meja |
| `woods` | Wood types | [jati, mahoni] |
| `finishes` | Finish / paint | [cat akrilik, pernis] |
| `dimensions` | Size in cm (W × D × H, or diameter × H) | Ø 60 × 55 cm |
| `leadTimeWeeks` | How long it takes to make, in weeks | 3 |
| `madeToOrder` | `true` = can be ordered again, `false` = one-off piece | true |
| `priceFrom` | Starting price in rupiah, or leave empty to show "Tanya harga via WhatsApp" | 2500000 |
| `customizable` | What a customer can change | [ukuran, warna, motif] |
| `images` | Photos and a short description of each (for blind visitors and search) | |
| `summary` | One or two sentences for the catalog card | |

The text below the `---` is the full description on the product page.
