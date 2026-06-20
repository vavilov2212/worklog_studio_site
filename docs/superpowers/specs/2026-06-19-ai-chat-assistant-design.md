# AI Chat Assistant — Design Spec

Date: 2026-06-19
Status: Implemented and merged to `dev`. See §11 for as-built deviations from this spec and outstanding operational steps.

## 1. Goal

Add an interactive, AI-powered chat assistant to the Worklog Studio landing page that lets visitors (recruiters, potential clients, technical readers) ask natural-language questions about the product (features, architecture, roadmap) and about the author, and get accurate, grounded answers. Built as a RAG (Retrieval-Augmented Generation) system, and intended to double as a portfolio case study (technical article + LinkedIn writeup).

## 2. Non-Goals

- No persistent server-side chat history or user accounts.
- No support for arbitrary/open-domain questions outside the supplied corpus — out-of-scope questions should be declined, not hallucinated.
- No vector database / managed retrieval infrastructure — corpus is small and finite by design.
- No Windows/other-platform-specific product support implied by the assistant; it only describes what's actually documented in the corpus (e.g. won't claim Windows support exists if the Roadmap marks it "Planned").

## 3. Hosting Migration

The site currently deploys as a static export to GitHub Pages ([.github/workflows/nextjs.yml](../../../.github/workflows/nextjs.yml)), which cannot run server code. This feature requires a server-side component (to keep the Gemini API key off the client and to do retrieval/generation), so:

- **Decision**: Migrate hosting from GitHub Pages to **Vercel**.
- Rationale: Vercel's free Hobby tier natively runs Next.js Route Handlers (Node/Edge serverless functions) and supports streaming responses, in the same repo/deploy as the static pages. This avoids running two separate deploy pipelines (a static site + a standalone Cloudflare Worker/Cloud Function), which was the alternative considered. Cost is $0 either way; Vercel wins on engineering simplicity.
- **As-built**: `.github/workflows/nextjs.yml` has been deleted and `next.config.ts`'s `output: 'standalone'` removed — both done. **Not yet done**: the repo has not been connected to a Vercel project. This is a manual dashboard step (no CLI/code action) — see §11.1 for the exact steps required before this feature works in production.

## 4. Architecture

```
┌─────────────────┐      ┌──────────────────────┐      ┌─────────────────┐
│  Browser         │─────▶│  Vercel: Next.js App  │─────▶│  Gemini API      │
│  - Inline section │◀─────│  /api/chat route      │◀─────│  (free tier)     │
│  - Header pill    │ SSE/ │  - rate limiter       │      │  - embedding-001 │
│  - sessionStorage │stream│  - retrieval (cosine) │      │  - 2.5-flash     │
│    (history)      │      │  - prompt assembly    │      └─────────────────┘
└──────────────────┘      │  embeddings.json       │
                          │  (built at build time)  │
                          └──────────────────────┘
```

- **Frontend**: Two entry points sharing one chat panel component and one client-side conversation state (see §6). State lives in `sessionStorage` only — cleared on tab close, no backend persistence, no privacy/storage concerns.
- **Backend**: A single Next.js Route Handler, `app/api/chat/route.ts`, deployed as a Vercel serverless function. Holds `GEMINI_API_KEY` as a server-only environment variable — never sent to the client.
- **Retrieval**: At request time, embed the user's question via Gemini `gemini-embedding-001`, compute cosine similarity in plain JS against every row of a precomputed `embeddings.json` (linear scan — fast enough at this corpus size, no index needed), return top-k chunks above a similarity floor.
- **Generation**: Retrieved chunks + system prompt + recent conversation turns (sent from the client) → `gemini-2.5-flash`, response streamed back to the client.
- **Rate limiting**: Per-IP throttle via Upstash Redis (free tier), enforced inside the route handler before calling Gemini, to protect the free quota from scripted abuse.
- No vector DB, no application database. The only infrastructure beyond Vercel + Gemini is one free Upstash Redis instance.

## 5. RAG Data Pipeline

### Source content

Markdown files (to be authored separately by the project owner before ingestion), e.g.:

```
content/rag/
  product-overview.md
  features-tracking.md
  features-analytics.md
  features-integrations.md
  roadmap.md
  architecture.md
  about-author.md
```

**As-built**: `content/rag/architecture.md` was never authored — only the other six files exist. `about-author.md` exists but its content is explicitly marked `[PLACEHOLDER]` (not real biographical content yet). Both are open authoring gaps, not implementation bugs — see §11.2.

### Chunking

Split each markdown file by `##` heading sections, not fixed token windows — keeps each chunk topically coherent. Each chunk: `{ id, source, heading, text }`.

### Embedding

Gemini `gemini-embedding-001` (free tier), run once per chunk during ingestion (build-time script, not runtime).

### Storage

A single `embeddings.json` checked into the repo: `[{ id, source, heading, text, embedding: number[] }]`. Expected size: a few hundred KB for ~20-40 chunks. Loaded into memory by the route handler.

**As-built**: the real corpus (6 markdown files, see above) currently chunks into only 7 entries, each a 3072-dimension `gemini-embedding-001` vector — smaller than the 20-40 chunk estimate, mainly because `architecture.md` doesn't exist yet and the other files are short. This is not a problem at this scale (linear scan is still instant), but it does mean retrieval coverage is thinner than originally planned until more content is authored.

**Regenerating `embeddings.json`**: run `npm run ingest:rag` (wraps `scripts/ingest-rag-content.ts`) any time a file under `content/rag/` is added, removed, or edited. It requires `GEMINI_API_KEY` to be set (e.g. sourced from `.env.local`) and overwrites `lib/rag/embeddings.json` wholesale — there is no incremental/partial update. It is a one-off manual script, not run automatically by any build step or CI job.

### Retrieval algorithm

1. Embed the user's query (1 Gemini call).
2. Cosine similarity against every row in `embeddings.json`.
3. Take top-k (k=4) above a similarity floor (0.7) — these are the final constants used in `app/api/chat/route.ts` (`TOP_K`, `SIMILARITY_THRESHOLD`), not placeholder examples. If nothing clears the floor, retrieval returns empty and the assistant must say it doesn't know rather than answer from the raw LLM's general knowledge.

### Prompt assembly

```
System: You are the Worklog Studio assistant. Answer only using the provided
context about the product and its author. If the answer isn't in the context,
say you don't know and suggest contacting Roman directly. Be concise.

Context:
[retrieved chunk(s)]

Conversation history: [last N turns from client]
User: [question]
```

### Why no vector DB

At 20-40 chunks, an in-memory linear cosine scan is faster than a network round-trip to a managed vector store would be, costs nothing, and has zero additional infrastructure to operate. A vector DB earns its keep at a much larger corpus — not the case here.

## 6. UI/UX Design

### Entry points (hybrid placement)

1. **Inline section** — placed directly below the Hero section, above Features. Styled consistently with the existing feature-row visual language (white panel, `border-border`, rounded-2xl, soft shadow — see [components/Features.tsx](../../../components/Features.tsx) for the pattern to match). Contains a live input field; submitting expands it in place into the full chat panel (stays in page flow, not a modal).
2. **Header pill** — a secondary, always-available shortcut added to the existing fixed header ([components/Header.tsx](../../../components/Header.tsx)), next to the GitHub icon. Generic AI/sparkle icon (not Gemini-branded) + text label "Ask AI" (text is required, not icon-only). Opens the same chat panel as an overlay (desktop: anchored top-right below header; mobile: full-screen sheet), since there's no inline section to expand into from elsewhere on the page.
3. Both entry points render the same shared chat panel component and read/write the same conversation state, so a conversation started inline continues seamlessly if reopened from the header.

### Attention animation (header pill only)

Not a constant pulse — a brief glow/ring animation (`box-shadow` ring expanding and fading, ~1.2s) fires once every ~8-10 seconds, then sits still in between. Should read as a gentle, occasional nudge, consistent with the restrained pulse already used on the Hero's "Live" badge ([components/Hero.tsx](../../../components/Hero.tsx)) — not anxious or naggy.

### Chat panel interactions

- Streaming responses: text renders token-by-token as it streams from `/api/chat`, never a spinner-then-dump.
- Thinking state: pulsing dots or a subtle shimmer skeleton bubble in `accent` color — not a generic spinner.
- Suggested prompt chips shown on first open (e.g. "What integrations are planned?", "Tell me about the author") to lower the blank-input barrier.
- Send button morphs into a stop/cancel icon while a response is streaming.
- If retrieval returns nothing above the similarity floor, the assistant explicitly says it doesn't know rather than answering from general knowledge — a deliberate trust/quality decision worth highlighting in the case-study writeup.

### Conversation state

Multi-turn, session-only. History held client-side in `sessionStorage`; sent to `/api/chat` with each request so the model has conversational context. No backend persistence — resets on tab close/reload.

## 7. Security & Abuse Protection

- `GEMINI_API_KEY` stored only as a Vercel server-side environment variable.
- Per-IP rate limiting (Upstash Redis free tier) inside the route handler — final constant is `Ratelimit.slidingWindow(10, '60 s')` (10 requests/minute/IP), to prevent scripted abuse from exhausting the Gemini free-tier quota.
- **IP extraction caveat**: the identifier used for rate limiting is read from the `x-forwarded-for` request header (first comma-separated value, trimmed; falls back to the literal string `'unknown'` if the header is absent). This header is only trustworthy when the app runs behind a proxy that sets it correctly — Vercel does this for production traffic. If this code is ever run behind a different proxy/host, re-verify the header is actually being set, or all traffic collapses onto a single `'unknown'` rate-limit bucket.
- **Transient upstream errors**: Gemini occasionally returns HTTP 503 ("model overloaded / high demand") under normal operation, not a code bug. `lib/rag/gemini.ts` retries both `embedQuery` and `streamAnswer` up to 3 attempts total with exponential backoff (500ms base, doubling) when the error's `status === 503`. Any other error status, or exhausting all 3 attempts, propagates up; the route handler catches embed/retrieval failures and returns HTTP 502 (with `console.error` logging server-side for diagnosis), and a failure while already streaming the generation response aborts the stream via `controller.error()`.

### Obtaining API keys

Two external services back this feature, both required for local development and production:

- **`GEMINI_API_KEY`** — Get one at [Google AI Studio](https://aistudio.google.com/apikey) ("Get API key" → "Create API key"). This is the consumer Gemini API key flow, not the GCP Console/Vertex AI flow — no GCP project or billing account is required for the free tier. Set it in `.env.local` for local dev, and as a server-side environment variable in the Vercel project settings for production.
- **`UPSTASH_REDIS_REST_URL`** / **`UPSTASH_REDIS_REST_TOKEN`** — Create a free Redis database at [Upstash](https://console.upstash.com/) (Redis → Create Database). Use the **REST API** credentials shown on the database's details page (not the native Redis protocol connection string) — these two values map directly to the env var names above. Set both in `.env.local` for local dev, and as server-side environment variables in Vercel for production.

## 8. Content Authoring (deferred)

The markdown source content listed in §5 does not exist yet and will be authored by the project owner separately, then handed off before the ingestion phase begins. The ingestion script (ingestion phase) must be designed to consume whatever file structure is handed over, validated against the `content/rag/*.md` convention above.

## 9. Implementation Phase Order

Per project owner preference, implementation proceeds in this order rather than the natural data-dependency order:

1. **Phase 2 first**: Backend/serverless route setup (`/api/chat`, rate limiting, Vercel migration) — built and testable with a small hardcoded/stub corpus before real content exists.
2. **Phase 3 next**: Frontend UI and streaming components (inline section, header pill, chat panel, animations) — wired against the Phase 2 route.
3. **Phase 1 last**: Data preparation & embedding generation (ingestion script, real `embeddings.json`) — swapped in to replace the stub corpus once content is authored.

This ordering means Phases 2 and 3 must be built against a placeholder/stub `embeddings.json` (a handful of hand-written fake chunks) so the API contract and UI can be fully implemented and demoed before real content exists.

## 10. Open Decisions Resolved During Design

| Decision | Resolution |
|---|---|
| Hosting | Migrate to Vercel (from GitHub Pages) |
| LLM/embedding vendor | Gemini free tier (`gemini-embedding-001` + `gemini-2.5-flash`), not Claude (no embeddings API) or Vertex AI (unneeded complexity for a finite corpus) |
| Vector storage | Flat-file `embeddings.json`, no vector DB |
| UI placement | Hybrid: inline section below Hero + header pill shortcut |
| Rate limiting | Yes, Upstash Redis free tier |
| Conversation memory | Multi-turn, session-only, client-side only |
| Content authoring | Deferred — handled separately by project owner |

## 11. As-Built Notes & Outstanding Steps

This section exists because the implementation diverged from this spec in a few places, and because several manual/operational steps are easy to forget once the feature is "done" in git but not yet live. Read this section first if picking this feature back up after a gap.

### 11.1 Connecting the repo to Vercel (manual, not yet done)

The code is ready (GH Pages workflow deleted, `output: 'standalone'` removed), but the repo has never been linked to a Vercel project. This is a one-time manual step, done in the Vercel dashboard, not via any script in this repo:

1. At [vercel.com/new](https://vercel.com/new), import this GitHub repository.
2. Framework preset should auto-detect as Next.js — no build command changes needed.
3. Before the first deploy, add the environment variables from §7's "Obtaining API keys" subsection (`GEMINI_API_KEY`, `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`) in the Vercel project's Settings → Environment Variables. Without these, `/api/chat` will 500/502 on every request in production even though it works locally with `.env.local`.
4. Deploy. Verify the chat assistant works against the live URL, then update any hardcoded links/README references that still point at the old GitHub Pages URL.
5. No DNS/domain changes were in scope for this feature — if a custom domain was previously pointed at GitHub Pages, that's a separate follow-up, not covered here.

### 11.2 Content gaps (author follow-up, not a code task)

- `content/rag/architecture.md` (listed in §5's source content example) was never written. The assistant currently cannot answer architecture-specific questions beyond what's incidentally covered in the other 6 files.
- `content/rag/about-author.md` exists but its body is a placeholder, not real biographical content. Until replaced, "tell me about the author" questions will only retrieve whatever placeholder text is there.
- After adding or editing any file under `content/rag/`, re-run `npm run ingest:rag` (see §5 "Storage" subsection) — edits to markdown alone do nothing until ingestion regenerates `embeddings.json`.

### 11.3 Gemini model-name gotcha (historical, for future debugging)

The original implementation used `text-embedding-004` for embeddings, per an earlier draft of this spec. That model was retired by Google and started 404ing on `embedContent` calls; it was migrated to `gemini-embedding-001` everywhere (`lib/rag/gemini.ts`, `scripts/ingest-rag-content.ts`, this spec, and `lib/rag/embeddings.json` was regenerated from scratch with the new model — embeddings from different models/dimensions are not interchangeable, so a model change always requires a full re-ingestion). If `/api/chat` starts 404ing again in the future, check the [Gemini API model list](https://ai.google.dev/gemini-api/docs/models) for renames/retirements before assuming a code bug.

### 11.4 Testing

Implementation followed TDD throughout (Vitest + jsdom). Notable test files: `lib/rag/retrieval.test.ts`, `lib/rag/gemini.test.ts` (mocks the SDK, covers retry/backoff behavior), `app/api/chat/route.test.ts` (unit-level, mocks all dependencies), `app/api/chat/route.integration.test.ts` (mocks only the two Gemini calls; exercises real retrieval logic against the real `lib/rag/embeddings.json`, so it stays correct regardless of embedding dimensionality or corpus content). `vitest.config.ts` excludes `.claude/` and `.superpowers/` to avoid double-counting tests if a Superpowers worktree is ever nested under the repo root again.
