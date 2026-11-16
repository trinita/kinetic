# Kinetic.co — Project Plan

Website and company profile for **Kinetic**, a workshop that designs and builds wood products, with two AI features: a **chat assistant** and **smart search**.

## 1. Goals

- Present Kinetic's craft, products and people with a warm, photo-led site that feels handmade, not templated.
- Turn visitors into enquiries — custom orders, commissions, workshop visits — sent to the workshop on **WhatsApp**. No online sales, cart or checkout.
- Indonesian is the main language; every page also available in English.
- Let visitors ask questions ("Can you make a walnut dining table for 8?", "What finish is food-safe?") and find products/articles by meaning, not just keywords.
- Keep content easy to edit without a CMS at first (Markdown/MDX in the repo).

## 2. Stack

| Concern   | Choice                                                                                                                                                                                                        |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Framework | Next.js 16 (App Router, Cache Components) + TypeScript                                                                                                                                                        |
| Styling   | Tailwind CSS                                                                                                                                                                                                  |
| Content   | Markdown files in `content/` (`<slug>.id.md` + optional `<slug>.en.md`), YAML frontmatter validated with Zod; drafts and TODOs hidden in production (see `content/README.md`)                                 |
| Images    | `next/image`, originals in `public/images/`                                                                                                                                                                   |
| AI chat   | Provider-neutral layer (`lib/ai`): OpenRouter via the `openai` SDK now (`anthropic/claude-opus-5.5`), Anthropic via `@anthropic-ai/sdk` by setting `AI_PROVIDER=anthropic`; streaming NDJSON from `/api/chat` |
| Search    | MiniSearch keyword search (always on) + optional Voyage AI embeddings (`npm run search:index` → `data/search-vectors.json`), merged with reciprocal rank fusion                                               |
| Enquiries | WhatsApp click-to-chat (`wa.me`) links with a prefilled message (product, size, wood, name)                                                                                                                   |
| i18n      | Next.js built-in pattern: `app/[lang]` + JSON dictionaries (`lib/i18n/`), `proxy.ts` maps Indonesian URLs; Indonesian (`id`) default at `/`, English at `/en/...`                                             |
| Hosting   | Vercel                                                                                                                                                                                                        |
| Quality   | ESLint, Prettier, Vitest (unit), Playwright (smoke e2e)                                                                                                                                                       |

## 3. Site map

Indonesian at the root, English under `/en` (e.g. `/produk/meja-jati` ↔ `/en/products/teak-table`); language switcher in the header.

```
/                       Home: hero, what we make, featured pieces, process, testimonials, CTA
/about                  Story, workshop, values (materials, sustainability)
/about/team             Makers and roles
/products               Catalog grid with filters (category, wood type, made-to-order vs. ready)
/products/[slug]        Product detail: gallery, dimensions, woods/finishes, lead time, "Enquire"
/services               Custom commissions, restoration, workshops/classes, B2B (fit-outs)
/case-studies           Project stories
/case-studies/[slug]
/blog                   Care guides, wood species, behind the scenes
/blog/[slug]
/contact                WhatsApp button, short enquiry form that opens WhatsApp with the details prefilled, address/map, opening hours
/search                 Full search results page (also reachable from header)
```

## 4. Content model (`content/`)

- `products/` — title, status, featured, category, woods[], finishes[], dimensions, leadTimeWeeks, madeToOrder, priceFrom?, customizable[], images[{src, alt}], summary
- `services/` — title, status, order, summary, image?
- `case-studies/`, `blog/` — title, status, date, excerpt, cover, location?, related products[]
- `team/` — name, status, role, order, photo
- `pages/about` — the About page story
- Company facts (address, hours, WhatsApp, Instagram) live in `lib/site.ts` and the dictionaries.

Each entry is `<slug>.id.md` (Indonesian: facts + text, required) plus an optional `<slug>.en.md` (English text only). The file name is the URL slug in both languages; English falls back to Indonesian. Full guide: `content/README.md`.

All of this is also the knowledge source for chat and search, so there is one source of truth.

## 5. AI features

### 5.1 Smart search

1. **Build step** (`scripts/build-index.ts`, runs before `next build`): chunk every content file (~300–500 tokens per chunk, keep title/URL/type metadata), compute embeddings, write `data/search-index.json`.
2. **Query** (`/api/search`): embed the query, cosine-rank chunks, merge with MiniSearch keyword hits, group by page, return top results with snippets.
3. **UI**: header search box (⌘K dialog) with instant results grouped by Products / Articles / Services; `/search` page for full results.
4. Fallback: if the embeddings API is unavailable, serve keyword results only.

Content volume is small (tens–hundreds of pages), so an in-memory JSON index is enough; move to a vector DB (e.g. Postgres + pgvector) only if it grows.

### 5.2 Chat assistant

- Floating "Ask the workshop" widget on every page, plus an "Ask about this piece" entry point on product pages (pre-seeds context).
- `/api/chat` route handler streams responses from Claude (default `claude-sonnet-5-5`; consider `claude-haiku-5-5` if cost matters).
- **Grounding**: each turn retrieves top chunks from the same search index and puts them in the prompt; system prompt tells the assistant to answer only from Kinetic's content and say when it doesn't know.
- **Tools** the model can call:
  - `search_catalog(query, filters)` — find products
  - `get_product(slug)` — details for a specific piece
  - `start_enquiry(name, summary, details)` — builds a WhatsApp link with the enquiry prefilled; the visitor taps it to send
- **Guardrails**: no firm price quotes or delivery promises beyond what content states; hand off to the enquiry form for custom work; rate limiting per IP; max message length; no conversation storage beyond what's needed for the session (privacy note in the widget).
- Replies in the visitor's language (Indonesian or English); search covers both languages.
- Responses link to the relevant product/article pages.

## 6. Design direction

- Logo: concept **B · Sambungan** (a K made from three pieces of joined timber) + lowercase "kinetic" wordmark in Fraunces; final files in `brand/logo/` (text outlined), generator in `brand/build-logo.js`. Earlier concepts in `brand/concepts.html`.
- Palette: Walnut `#3E2B20`, Jati `#B07A45`, Oak `#D9B98C`, Krem `#F6F0E6`, Lumut `#5E6B4A`, Arang `#1E1A17`; dark mode supported.
- Fonts: Fraunces for headings, Plus Jakarta Sans for body (both Google Fonts).
- Large photography of pieces and the workshop; generous whitespace; subtle grain texture.
- Accessible: WCAG AA contrast, keyboard-navigable search dialog and chat widget, alt text required in frontmatter schema.

## 7. Project structure

```
app/                  routes (see site map), api/chat, api/search, api/enquiry
components/           ui/ (buttons, cards), layout/, search/, chat/, product/
content/              MDX + JSON content
lib/                  content loaders, schema (zod), search (embed, rank), ai (claude client, tools, prompts)
scripts/              build-index.ts
data/                 generated search-index.json (gitignored or committed — decide in phase 3)
public/images/
tests/                unit + e2e
```

## 8. Phases

| #    | Phase           | Deliverables                                                                                                                                                                                           |
| ---- | --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1 ✅ | Foundation      | Next.js + TS + Tailwind scaffold, lint/format/test setup, design tokens, layout (header/footer/nav), i18n routing (id/en), placeholder pages, deploy preview on Vercel (pending: needs Vercel account) |
| 2 ✅ | Content & pages | Content schemas + loaders, all pages with real structure and placeholder content, product filters, WhatsApp enquiry buttons                                                                            |
| 3 ✅ | Smart search    | Index build script, `/api/search`, ⌘K dialog, `/search` page, keyword fallback                                                                                                                         |
| 4 ✅ | Chat assistant  | `/api/chat` streaming, retrieval grounding, tools, widget UI, rate limiting, enquiry hand-off                                                                                                          |
| 5    | Polish & launch | Real photos/copy, SEO (metadata, sitemap, OG images, JSON-LD for products/organization), performance pass (Lighthouse ≥ 90), accessibility audit, analytics, domain                                    |

## 9. Environment variables

```
ANTHROPIC_API_KEY=
EMBEDDINGS_API_KEY=      # provider for embeddings (e.g. Voyage AI)
NEXT_PUBLIC_WHATSAPP_NUMBER=6281399325549   # wa.me format: no +, spaces or dashes
```

## 10. Decisions

- Enquiries only (no online sales); all enquiries go to WhatsApp at +62 813-9932-5549.
- Indonesian main language, English translation.
- Kinetic is presented as "the workshop behind Wood Knots" (Instagram @_woodknots).
- Address: Jl. Wibawa Mukti II No.39, RT.001/RW.004, Jatiluhur, Kec. Jatiasih, Kota Bekasi, Jawa Barat 17425. Open Sunday–Friday 09.00–17.00 WIB, closed Saturday.
- Product photos: 5 photos of 2 products taken from Instagram (`public/images/products/`); drafts in `content/products/` await details.
- Logo: concept B with lowercase "kinetic" wordmark; palette and fonts as in section 6.

- Admin: Keystatic at `/admin`, GitHub login, only the owner edits; products are YAML files edited there.

## 11. Open questions

- Product details for the 2 drafts (`content/products/*.md`, every `TODO`), service and About texts (drafts in `content/`) and more products/photos.
- Who writes the copy and the English translations?
