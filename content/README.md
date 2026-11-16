# Website content — how to fill in

## Products: use the admin

Products are edited in the admin editor, not by hand:

- **On your computer:** run `npm run dev`, open <http://localhost:3000/admin>. Saving writes the files in `content/products/` directly (commit and push them afterwards).
- **On the live site:** open `/admin` (e.g. <https://kinetic-red-nine.vercel.app/admin>) and log in with GitHub. Saving commits to GitHub and Vercel updates the site in 1–2 minutes. Only GitHub accounts with write access to the `trinita/kinetic` repository can edit.

Each product is one file, `content/products/<alamat>.yaml`, with Indonesian and English together. Photos are stored in `public/images/products/<alamat>/`. A product marked **Terbit (published)** only appears once category, summary, at least one photo, wood, size, lead time and availability are filled in; until then it stays hidden (the build log says what's missing).

### Admin setup (one time, for the live site)

1. Stop any running `npm run dev`, then start the editor in GitHub mode: `NEXT_PUBLIC_KEYSTATIC_STORAGE=github npm run dev`
2. Open <http://localhost:3000/keystatic> and follow **Create GitHub App** (give it a name like `kinetic-admin`). GitHub asks you to confirm, then to **install** the app — choose **Only select repositories → trinita/kinetic**.
3. Keystatic writes four values into a `.env` file in the project (never committed): `KEYSTATIC_GITHUB_CLIENT_ID`, `KEYSTATIC_GITHUB_CLIENT_SECRET`, `KEYSTATIC_SECRET`, `NEXT_PUBLIC_KEYSTATIC_GITHUB_APP_SLUG`.
4. In Vercel → Project → **Settings → Environment Variables**, add those four with the same values, then **Redeploy**.
5. In GitHub → **Settings → Developer settings → GitHub Apps → your app**, add the callback URL `https://kinetic-red-nine.vercel.app/api/keystatic/github/oauth/callback` (and the same with your real domain later).
6. Open `/admin` on the live site and log in with GitHub.

## Everything else: Markdown files

All text on the website that isn't a menu label lives here, as Markdown files:

| Folder          | What                                           | Web page                         |
| --------------- | ---------------------------------------------- | -------------------------------- |
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

Copy the `_template.id.md` (and `_template.en.md`) in that folder, rename them, and fill them in. (Products: use the admin instead.)
Photos go in `public/images/<folder>/`, e.g. `public/images/products/meja-kopi-jati-1.jpg`.
The first photo is the main one shown in lists. Landscape or portrait both work; at least 1200 px wide looks best.
