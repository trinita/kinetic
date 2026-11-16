# Website content — how to fill in

## Products: use the admin

Products are edited in the admin at **`/admin`** (e.g. <https://kinetic-red-nine.vercel.app/admin>), with a username and password:

- **Live site:** saving stores the change on GitHub automatically and Vercel updates the site in 1–2 minutes. Editors never need a GitHub account.
- **On your computer** (`npm run dev`, <http://localhost:3000/admin>): saving writes the files in `content/products/` directly; commit and push them afterwards.

Each product is one file, `content/products/<alamat>.yaml` (Indonesian and English together); photos are in `public/images/products/<alamat>/`. A product set to **Terbit** only appears once category, summary, at least one photo, wood, size, lead time and availability are filled in. The admin shows what's missing.

### Admin setup (one time)

1. **Create a login** (on your computer, in the project folder): `npm run admin:user`. Type a username and a password (at least 12 characters; it isn't shown or saved). It prints two lines: `ADMIN_USERS=…` and `ADMIN_SESSION_SECRET=…`. For several people, run it once per person and join the entries with a comma: `ADMIN_USERS=klien:…,trinita:…` (one `ADMIN_SESSION_SECRET` for all).
2. **Create a GitHub token** so the live site can save: GitHub → Settings → Developer settings → Personal access tokens → **Fine-grained tokens** → Generate new token. Repository access: **Only select repositories → trinita/kinetic**. Permissions → Repository permissions → **Contents: Read and write**. Copy the token (it starts with `github_pat_`). Note its expiry date: the admin stops saving when it expires, so renew it before then.
3. **Add to Vercel** → Project → Settings → Environment Variables: `ADMIN_USERS`, `ADMIN_SESSION_SECRET`, `GITHUB_TOKEN`. Then **Redeploy**.
4. For local use, put `ADMIN_USERS` and `ADMIN_SESSION_SECRET` in `.env.local` too (`GITHUB_TOKEN` isn't needed on your computer).

To remove someone's access, delete their entry from `ADMIN_USERS` and redeploy. To log everyone out, change `ADMIN_SESSION_SECRET`. Wrong passwords are limited to 5 tries per 15 minutes.

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
