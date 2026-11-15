<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Agent guide — Kinetic.co

Website and company profile for Kinetic, a workshop that makes wood products. See `PLAN.md` for scope, site map and phases.

## Stack

Next.js 16 (App Router, Cache Components) + TypeScript + Tailwind CSS v4. Content in `content/` as MDX with Zod-validated frontmatter. AI chat via the Anthropic SDK; smart search via a build-time embeddings index.

## Conventions

- TypeScript strict; no `any` without a comment explaining why.
- Server Components by default; add `"use client"` only for interactive pieces (search dialog, chat widget, filters).
- API keys are only read in server code (`app/api/*`, `lib/ai`, `lib/search`); never expose them to the client.
- Content is the single source of truth for pages, search and chat — don't hard-code product facts in components or prompts.
- Every image needs meaningful alt text (enforced by the content schema).
- Keep the chat assistant grounded: it answers from site content, doesn't invent prices or lead times, and hands custom requests to the WhatsApp enquiry flow.
- Indonesian is the default locale. Every user-facing string lives in `lib/i18n/dictionaries/{id,en}.json` (no hard-coded copy); read it with `getDictionary()` in server components.
- Pages live in `app/[lang]/<english-segment>`. Indonesian URLs are mapped in `lib/i18n/routing.ts` (`routes`) and rewritten by `proxy.ts`; always build links with `href(locale, key)`.
- Colours: use semantic Tailwind tokens (`bg-bg`, `text-fg`, `text-muted`, `bg-surface`, `border-border`, `text-accent`, `bg-accent-strong`) so dark mode works; brand colours (`walnut`, `jati`, `oak`, `krem`, `lumut`, `arang`) are for fixed-colour areas like the footer.
- WhatsApp links: `whatsappLink(message)` from `lib/site.ts`.
- Content lives in `content/` (see `content/README.md`) and is read only through `lib/content` (`getProducts`, `getArticles`, …). Indonesian files hold the facts; English files hold translated text only. `TODO` values count as missing; drafts show in dev and are hidden in production; a published entry with TODOs fails the build on purpose.
- Detail pages (`[slug]`) list their params with `slugParams()` (Cache Components needs at least one) and set `export const instant = false`.

## Commands

- `npm run dev` — local dev server
- `npm run build` — builds the search index, then the site
- `npm run lint` / `npm run typecheck` / `npm run format`
- `npm test` — unit tests (Vitest)
- `npm run test:e2e` — builds and runs Playwright smoke tests in the installed Chrome

## Workflow

- Work on a branch per phase/feature; keep `main` deployable.
- Run lint and tests before committing.
