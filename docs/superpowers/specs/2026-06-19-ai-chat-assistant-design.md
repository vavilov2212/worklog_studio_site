# AI Chat Assistant — Design Spec

Date: 2026-06-19
Status: Approved (design phase) — implementation not yet started

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
- The existing GitHub Pages Actions workflow will be retired once the Vercel deployment is verified working.
- `next.config.ts`'s `output: 'standalone'` (already inconsistent with the old GH Pages static-export requirement, see [CLAUDE.md](../../../CLAUDE.md) Open Items) should be revisited as part of this migration — Vercel does not require `output: 'export'` or `'standalone'` for a normal deployment; this should be removed/adjusted.

## 4. Architecture

```
┌─────────────────┐      ┌──────────────────────┐      ┌─────────────────┐
│  Browser         │─────▶│  Vercel: Next.js App  │─────▶│  Gemini API      │
│  - Inline section │◀─────│  /api/chat route      │◀─────│  (free tier)     │
│  - Header pill    │ SSE/ │  - rate limiter       │      │  - embedding-004 │
│  - sessionStorage │stream│  - retrieval (cosine) │      │  - 2.5-flash     │
│    (history)      │      │  - prompt assembly    │      └─────────────────┘
└──────────────────┘      │  embeddings.json       │
                          │  (built at build time)  │
                          └──────────────────────┘
```

- **Frontend**: Two entry points sharing one chat panel component and one client-side conversation state (see §6). State lives in `sessionStorage` only — cleared on tab close, no backend persistence, no privacy/storage concerns.
- **Backend**: A single Next.js Route Handler, `app/api/chat/route.ts`, deployed as a Vercel serverless function. Holds `GEMINI_API_KEY` as a server-only environment variable — never sent to the client.
- **Retrieval**: At request time, embed the user's question via Gemini `text-embedding-004`, compute cosine similarity in plain JS against every row of a precomputed `embeddings.json` (linear scan — fast enough at this corpus size, no index needed), return top-k chunks above a similarity floor.
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

### Chunking

Split each markdown file by `##` heading sections, not fixed token windows — keeps each chunk topically coherent. Each chunk: `{ id, source, heading, text }`.

### Embedding

Gemini `text-embedding-004` (free tier, 768-dim), run once per chunk during ingestion (build-time script, not runtime).

### Storage

A single `embeddings.json` checked into the repo: `[{ id, source, heading, text, embedding: number[] }]`. Expected size: a few hundred KB for ~20-40 chunks. Loaded into memory by the route handler.

### Retrieval algorithm

1. Embed the user's query (1 Gemini call).
2. Cosine similarity against every row in `embeddings.json`.
3. Take top-k (k=4) above a similarity floor (e.g. 0.7); if nothing clears the floor, retrieval returns empty and the assistant must say it doesn't know rather than answer from the raw LLM's general knowledge.

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
- Per-IP rate limiting (Upstash Redis free tier) inside the route handler, e.g. 10 requests/minute/IP, to prevent scripted abuse from exhausting the Gemini free-tier quota.

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
| LLM/embedding vendor | Gemini free tier (`text-embedding-004` + `gemini-2.5-flash`), not Claude (no embeddings API) or Vertex AI (unneeded complexity for a finite corpus) |
| Vector storage | Flat-file `embeddings.json`, no vector DB |
| UI placement | Hybrid: inline section below Hero + header pill shortcut |
| Rate limiting | Yes, Upstash Redis free tier |
| Conversation memory | Multi-turn, session-only, client-side only |
| Content authoring | Deferred — handled separately by project owner |
