# Agent guide — Kinetic.co

Website and company profile for Kinetic, a workshop that makes wood products. See `PLAN.md` for scope, site map and phases.

## Stack
Next.js (App Router) + TypeScript + Tailwind CSS. Content in `content/` as MDX with Zod-validated frontmatter. AI chat via the Anthropic SDK; smart search via a build-time embeddings index.

## Conventions
- TypeScript strict; no `any` without a comment explaining why.
- Server Components by default; add `"use client"` only for interactive pieces (search dialog, chat widget, filters).
- API keys are only read in server code (`app/api/*`, `lib/ai`, `lib/search`); never expose them to the client.
- Content is the single source of truth for pages, search and chat — don't hard-code product facts in components or prompts.
- Every image needs meaningful alt text (enforced by the content schema).
- Keep the chat assistant grounded: it answers from site content, doesn't invent prices or lead times, and hands custom requests to the WhatsApp enquiry flow.
- Indonesian is the default locale; every user-facing string goes through next-intl (no hard-coded copy).

## Commands (once scaffolded)
- `npm run dev` — local dev server
- `npm run build` — builds the search index, then the site
- `npm run lint` / `npm test` / `npm run test:e2e`

## Workflow
- Work on a branch per phase/feature; keep `main` deployable.
- Run lint and tests before committing.
