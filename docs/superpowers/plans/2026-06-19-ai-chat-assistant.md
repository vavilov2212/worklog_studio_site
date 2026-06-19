# AI Chat Assistant Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a RAG-powered chat assistant to the Worklog Studio landing page (inline section below Hero + header pill shortcut), backed by a Next.js API route on Vercel that retrieves from a flat-file embeddings store and generates streamed answers via the Gemini API.

**Architecture:** A single `/api/chat` Route Handler embeds the user's question with Gemini `text-embedding-004`, does an in-memory cosine-similarity search over a precomputed `embeddings.json`, then streams a `gemini-2.5-flash` answer back to the client. Two frontend entry points (inline section, header pill) share one `ChatContext` (session-only state) and one `ChatPanel` component. Implementation proceeds backend → frontend → data pipeline, per project owner's requested order, so Phases 2 and 3 are built and tested against a small hand-written stub `embeddings.json` before real content exists.

**Tech Stack:** Next.js 15 (App Router) on Vercel, `@google/genai` (already a dependency) for Gemini, `@upstash/ratelimit` + `@upstash/redis` for rate limiting, `vitest` + `@testing-library/react` for tests (new — no test runner exists yet), Tailwind CSS 4 + `motion` for UI (existing).

## Global Constraints

- `GEMINI_API_KEY` must never be sent to the client — all Gemini calls happen inside `app/api/chat/route.ts` or `scripts/ingest-rag-content.ts`, never in client components.
- Embedding model: `text-embedding-004`. Generation model: `gemini-2.5-flash`. (Spec §5, §6)
- No vector database, no application database — retrieval is an in-memory linear cosine scan over `lib/rag/embeddings.json`. (Spec §5)
- Conversation history is session-only, client-side (`sessionStorage`), never persisted server-side. (Spec §6)
- Header pill must show an icon **and** text label "Ask AI" — never icon-only, never a Gemini-branded icon. (Spec §6)
- Header pill attention animation fires briefly (~1.2s) every 8-10s, not a constant pulse. (Spec §6)
- If retrieval finds nothing above the similarity floor (0.7), the assistant must explicitly decline rather than answer from general knowledge. (Spec §5, §6)
- Rate limit: 10 requests/minute/IP via Upstash Redis. (Spec §7)
- Follow existing code conventions: Tailwind utility classes matching `--color-accent`/`--color-ink`/`--color-slate`/`--color-border` tokens from [app/globals.css](../../../app/globals.css), `motion/react` for animation, `@/*` path alias.

---

## File Structure

New files:
- `lib/rag/types.ts` — shared types (`RagChunk`, `ChatMessage`)
- `lib/rag/retrieval.ts` — `cosineSimilarity`, `retrieveTopChunks`
- `lib/rag/embeddings.json` — stub corpus (Phase 2/3), replaced with real data in Phase 1
- `lib/rag/gemini.ts` — `embedQuery`, `streamAnswer` (wraps `@google/genai`)
- `lib/rag/ratelimit.ts` — `checkRateLimit`
- `app/api/chat/route.ts` — POST handler
- `components/chat/ChatContext.tsx` — `ChatProvider`, `useChat`
- `components/chat/ChatPanel.tsx` — shared message list + input + streaming UI
- `components/chat/AskAISection.tsx` — inline section below Hero
- `components/chat/AskAIHeaderPill.tsx` — header trigger button
- `lib/rag/chunkMarkdown.ts` — markdown → chunk splitter (Phase 1)
- `scripts/ingest-rag-content.ts` — ingestion script (Phase 1)
- `content/rag/*.md` — placeholder source docs (Phase 1)
- `vitest.config.ts`, `vitest.setup.ts` — test infra

Modified files:
- `package.json` — new deps + `test` script
- `.env.example` — new env vars
- `next.config.ts` — drop `output: 'standalone'` (Vercel doesn't need it)
- `app/layout.tsx` — wrap children in `ChatProvider`
- `app/page.tsx` — render `AskAISection` below `Hero`
- `components/Header.tsx` — render `AskAIHeaderPill`

---

## Phase 2: Backend

### Task 1: Test infrastructure + new dependencies

**Files:**
- Modify: `package.json`
- Create: `vitest.config.ts`
- Create: `vitest.setup.ts`

**Interfaces:**
- Produces: `npm test` script runnable by every later task's tests.

- [ ] **Step 1: Install dependencies**

```bash
npm install @upstash/ratelimit @upstash/redis
npm install -D vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event
```

- [ ] **Step 2: Create `vitest.config.ts`**

```ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    globals: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
});
```

- [ ] **Step 3: Create `vitest.setup.ts`**

```ts
import '@testing-library/jest-dom/vitest';
```

- [ ] **Step 4: Add `test` script to `package.json`**

Add to the `"scripts"` object:

```json
"test": "vitest run"
```

- [ ] **Step 5: Verify the test runner works**

Create a throwaway `sanity.test.ts` at the repo root with:

```ts
import { describe, it, expect } from 'vitest';

describe('sanity', () => {
  it('runs', () => {
    expect(1 + 1).toBe(2);
  });
});
```

Run: `npm test`
Expected: 1 test passes. Then delete `sanity.test.ts`.

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json vitest.config.ts vitest.setup.ts
git commit -m "chore: add vitest test infrastructure and rag dependencies"
```

---

### Task 2: Retrieval module (cosine similarity + top-k)

**Files:**
- Create: `lib/rag/types.ts`
- Create: `lib/rag/retrieval.ts`
- Test: `lib/rag/retrieval.test.ts`

**Interfaces:**
- Produces:
  - `interface RagChunk { id: string; source: string; heading: string; text: string; embedding: number[] }`
  - `cosineSimilarity(a: number[], b: number[]): number`
  - `retrieveTopChunks(queryEmbedding: number[], chunks: RagChunk[], k: number, threshold: number): RagChunk[]`

- [ ] **Step 1: Create `lib/rag/types.ts`**

```ts
export interface RagChunk {
  id: string;
  source: string;
  heading: string;
  text: string;
  embedding: number[];
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}
```

- [ ] **Step 2: Write the failing test for `retrieval.ts`**

```ts
// lib/rag/retrieval.test.ts
import { describe, it, expect } from 'vitest';
import { cosineSimilarity, retrieveTopChunks } from './retrieval';
import type { RagChunk } from './types';

describe('cosineSimilarity', () => {
  it('returns 1 for identical vectors', () => {
    expect(cosineSimilarity([1, 0, 0], [1, 0, 0])).toBeCloseTo(1);
  });

  it('returns 0 for orthogonal vectors', () => {
    expect(cosineSimilarity([1, 0], [0, 1])).toBeCloseTo(0);
  });

  it('returns -1 for opposite vectors', () => {
    expect(cosineSimilarity([1, 0], [-1, 0])).toBeCloseTo(-1);
  });
});

describe('retrieveTopChunks', () => {
  const chunks: RagChunk[] = [
    { id: 'a', source: 's.md', heading: 'A', text: 'about tracking', embedding: [1, 0] },
    { id: 'b', source: 's.md', heading: 'B', text: 'about analytics', embedding: [0, 1] },
    { id: 'c', source: 's.md', heading: 'C', text: 'about roadmap', embedding: [0.9, 0.1] },
  ];

  it('returns chunks above the similarity threshold, sorted by relevance', () => {
    const result = retrieveTopChunks([1, 0], chunks, 2, 0.5);
    expect(result.map((c) => c.id)).toEqual(['a', 'c']);
  });

  it('returns an empty array when nothing clears the threshold', () => {
    const result = retrieveTopChunks([0, 1], chunks, 2, 1.5);
    expect(result).toEqual([]);
  });

  it('caps results at k', () => {
    const result = retrieveTopChunks([0.5, 0.5], chunks, 1, -1);
    expect(result).toHaveLength(1);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- retrieval`
Expected: FAIL — `retrieval.ts` does not exist yet.

- [ ] **Step 3: Implement `lib/rag/retrieval.ts`**

```ts
import type { RagChunk } from './types';

export function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

export function retrieveTopChunks(
  queryEmbedding: number[],
  chunks: RagChunk[],
  k: number,
  threshold: number
): RagChunk[] {
  return chunks
    .map((chunk) => ({ chunk, score: cosineSimilarity(queryEmbedding, chunk.embedding) }))
    .filter(({ score }) => score >= threshold)
    .sort((a, b) => b.score - a.score)
    .slice(0, k)
    .map(({ chunk }) => chunk);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- retrieval`
Expected: PASS (6 tests)

- [ ] **Step 5: Commit**

```bash
git add lib/rag/types.ts lib/rag/retrieval.ts lib/rag/retrieval.test.ts
git commit -m "feat: add cosine-similarity retrieval for RAG chunks"
```

---

### Task 3: Gemini client wrapper

**Files:**
- Create: `lib/rag/gemini.ts`
- Test: `lib/rag/gemini.test.ts`

**Interfaces:**
- Consumes: `@google/genai` (`GoogleGenAI`, confirmed API: `ai.models.embedContent({model, contents}) → { embeddings: [{ values: number[] }] }`; `ai.models.generateContentStream({model, contents, config}) → AsyncGenerator<{ text: string }>`)
- Produces:
  - `embedQuery(text: string): Promise<number[]>`
  - `streamAnswer(params: { systemInstruction: string; history: ChatMessage[]; question: string }): AsyncGenerator<string>`

- [ ] **Step 1: Write the failing test**

```ts
// lib/rag/gemini.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';

const embedContent = vi.fn();
const generateContentStream = vi.fn();

vi.mock('@google/genai', () => ({
  GoogleGenAI: class {
    models = { embedContent, generateContentStream };
  },
}));

import { embedQuery, streamAnswer } from './gemini';

beforeEach(() => {
  embedContent.mockReset();
  generateContentStream.mockReset();
});

describe('embedQuery', () => {
  it('extracts the embedding values from the SDK response', async () => {
    embedContent.mockResolvedValue({ embeddings: [{ values: [0.1, 0.2, 0.3] }] });
    const result = await embedQuery('hello');
    expect(result).toEqual([0.1, 0.2, 0.3]);
    expect(embedContent).toHaveBeenCalledWith({
      model: 'text-embedding-004',
      contents: ['hello'],
    });
  });

  it('throws if the SDK returns no embeddings', async () => {
    embedContent.mockResolvedValue({ embeddings: [] });
    await expect(embedQuery('hello')).rejects.toThrow('No embedding returned');
  });
});

describe('streamAnswer', () => {
  it('yields each chunk\'s text', async () => {
    async function* fakeStream() {
      yield { text: 'Hello' };
      yield { text: ' world' };
    }
    generateContentStream.mockResolvedValue(fakeStream());

    const chunks: string[] = [];
    for await (const chunk of streamAnswer({
      systemInstruction: 'be helpful',
      history: [],
      question: 'hi',
    })) {
      chunks.push(chunk);
    }

    expect(chunks).toEqual(['Hello', ' world']);
    expect(generateContentStream).toHaveBeenCalledWith(
      expect.objectContaining({
        model: 'gemini-2.5-flash',
        config: expect.objectContaining({ systemInstruction: 'be helpful' }),
      })
    );
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- gemini`
Expected: FAIL — `gemini.ts` does not exist yet.

- [ ] **Step 3: Implement `lib/rag/gemini.ts`**

```ts
import { GoogleGenAI } from '@google/genai';
import type { ChatMessage } from './types';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const EMBEDDING_MODEL = 'text-embedding-004';
const GENERATION_MODEL = 'gemini-2.5-flash';

export async function embedQuery(text: string): Promise<number[]> {
  const response = await ai.models.embedContent({
    model: EMBEDDING_MODEL,
    contents: [text],
  });
  const values = response.embeddings?.[0]?.values;
  if (!values) {
    throw new Error('No embedding returned from Gemini API');
  }
  return values;
}

export async function* streamAnswer(params: {
  systemInstruction: string;
  history: ChatMessage[];
  question: string;
}): AsyncGenerator<string> {
  const contents = [
    ...params.history.map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    })),
    { role: 'user', parts: [{ text: params.question }] },
  ];

  const stream = await ai.models.generateContentStream({
    model: GENERATION_MODEL,
    contents,
    config: { systemInstruction: params.systemInstruction },
  });

  for await (const chunk of stream) {
    if (chunk.text) yield chunk.text;
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- gemini`
Expected: PASS (3 tests)

- [ ] **Step 5: Commit**

```bash
git add lib/rag/gemini.ts lib/rag/gemini.test.ts
git commit -m "feat: add Gemini embedding and streaming generation wrapper"
```

---

### Task 4: Rate limiter

**Files:**
- Create: `lib/rag/ratelimit.ts`
- Test: `lib/rag/ratelimit.test.ts`
- Modify: `.env.example`

**Interfaces:**
- Consumes: `@upstash/ratelimit` (`Ratelimit`), `@upstash/redis` (`Redis`)
- Produces: `checkRateLimit(identifier: string): Promise<{ success: boolean }>`

- [ ] **Step 1: Write the failing test**

```ts
// lib/rag/ratelimit.test.ts
import { describe, it, expect, vi } from 'vitest';

const limit = vi.fn();

vi.mock('@upstash/ratelimit', () => ({
  Ratelimit: class {
    static slidingWindow() {
      return {};
    }
    limit = limit;
  },
}));

vi.mock('@upstash/redis', () => ({
  Redis: { fromEnv: vi.fn().mockReturnValue({}) },
}));

import { checkRateLimit } from './ratelimit';

describe('checkRateLimit', () => {
  it('returns success: true when under the limit', async () => {
    limit.mockResolvedValue({ success: true });
    const result = await checkRateLimit('1.2.3.4');
    expect(result).toEqual({ success: true });
  });

  it('returns success: false when over the limit', async () => {
    limit.mockResolvedValue({ success: false });
    const result = await checkRateLimit('1.2.3.4');
    expect(result).toEqual({ success: false });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- ratelimit`
Expected: FAIL — `ratelimit.ts` does not exist yet.

- [ ] **Step 3: Implement `lib/rag/ratelimit.ts`**

```ts
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '60 s'),
});

export async function checkRateLimit(identifier: string): Promise<{ success: boolean }> {
  const { success } = await ratelimit.limit(identifier);
  return { success };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- ratelimit`
Expected: PASS (2 tests)

- [ ] **Step 5: Add env vars to `.env.example`**

Append to the existing file:

```
# UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN: Required for chat rate limiting.
# Get these from the Upstash console (console.upstash.com) after creating a free Redis database.
UPSTASH_REDIS_REST_URL="MY_UPSTASH_REDIS_REST_URL"
UPSTASH_REDIS_REST_TOKEN="MY_UPSTASH_REDIS_REST_TOKEN"

# GEMINI_API_KEY: Required for the /api/chat route (embeddings + generation).
# Get this from https://aistudio.google.com/apikey
GEMINI_API_KEY="MY_GEMINI_API_KEY"
```

- [ ] **Step 6: Commit**

```bash
git add lib/rag/ratelimit.ts lib/rag/ratelimit.test.ts .env.example
git commit -m "feat: add per-IP rate limiting for chat endpoint"
```

---

### Task 5: Stub corpus for backend/frontend development

**Files:**
- Create: `lib/rag/embeddings.json`

**Interfaces:**
- Produces: a stub `RagChunk[]` JSON file matching `lib/rag/types.ts`'s `RagChunk`, consumed by Task 6's route handler and replaced for real in Phase 1 Task 15.

- [ ] **Step 1: Create the stub file**

Hand-written, low-dimensional (4-d) fake embeddings — good enough to exercise retrieval logic end-to-end without calling the real embedding API. Real 768-dim embeddings replace this file in Phase 1.

```json
[
  {
    "id": "stub-tracking-1",
    "source": "stub",
    "heading": "Frictionless Tracking",
    "text": "Worklog Studio lets you start logging a deep work session with a single keystroke, no forms or project setup required.",
    "embedding": [0.9, 0.1, 0.0, 0.1]
  },
  {
    "id": "stub-analytics-1",
    "source": "stub",
    "heading": "Focus Analytics",
    "text": "Worklog Studio's analytics engine identifies your peak productivity hours and flow states from your tracked sessions.",
    "embedding": [0.1, 0.9, 0.1, 0.0]
  },
  {
    "id": "stub-roadmap-1",
    "source": "stub",
    "heading": "Roadmap",
    "text": "The macOS app is released. Advanced analytics is in progress. Windows support and team collaboration are planned for later.",
    "embedding": [0.0, 0.1, 0.9, 0.1]
  },
  {
    "id": "stub-author-1",
    "source": "stub",
    "heading": "About the Author",
    "text": "Worklog Studio is built by Roman Vavilov as a portfolio project demonstrating full-stack and AI engineering skills.",
    "embedding": [0.1, 0.0, 0.1, 0.9]
  }
]
```

- [ ] **Step 2: Commit**

```bash
git add lib/rag/embeddings.json
git commit -m "feat: add stub RAG corpus for backend/frontend development"
```

---

### Task 6: `/api/chat` Route Handler

**Files:**
- Create: `app/api/chat/route.ts`
- Test: `app/api/chat/route.test.ts`

**Interfaces:**
- Consumes: `embedQuery`, `streamAnswer` from `lib/rag/gemini.ts`; `retrieveTopChunks` from `lib/rag/retrieval.ts`; `checkRateLimit` from `lib/rag/ratelimit.ts`; `RagChunk`, `ChatMessage` from `lib/rag/types.ts`; `lib/rag/embeddings.json`.
- Produces: `POST` handler at `/api/chat` accepting `{ history: ChatMessage[]; question: string }`, returning a streamed `text/plain` body of the answer, or `429` when rate-limited.

- [ ] **Step 1: Write the failing test**

```ts
// app/api/chat/route.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';

const checkRateLimit = vi.fn();
const embedQuery = vi.fn();
const retrieveTopChunks = vi.fn();
const streamAnswer = vi.fn();

vi.mock('@/lib/rag/ratelimit', () => ({ checkRateLimit }));
vi.mock('@/lib/rag/gemini', () => ({ embedQuery, streamAnswer }));
vi.mock('@/lib/rag/retrieval', () => ({ retrieveTopChunks }));
vi.mock('@/lib/rag/embeddings.json', () => ({ default: [] }));

import { POST } from './route';

function makeRequest(body: unknown, ip = '1.2.3.4') {
  return new Request('http://localhost/api/chat', {
    method: 'POST',
    headers: { 'x-forwarded-for': ip, 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  checkRateLimit.mockReset().mockResolvedValue({ success: true });
  embedQuery.mockReset().mockResolvedValue([1, 0, 0, 0]);
  retrieveTopChunks.mockReset().mockReturnValue([]);
  streamAnswer.mockReset();
});

describe('POST /api/chat', () => {
  it('returns 429 when rate-limited', async () => {
    checkRateLimit.mockResolvedValue({ success: false });
    const res = await POST(makeRequest({ history: [], question: 'hi' }));
    expect(res.status).toBe(429);
  });

  it('returns a decline message without calling streamAnswer when no chunks are retrieved', async () => {
    retrieveTopChunks.mockReturnValue([]);
    const res = await POST(makeRequest({ history: [], question: 'hi' }));
    const text = await res.text();
    expect(text).toContain("don't know");
    expect(streamAnswer).not.toHaveBeenCalled();
  });

  it('streams the answer when relevant chunks are found', async () => {
    retrieveTopChunks.mockReturnValue([
      { id: 'a', source: 's', heading: 'H', text: 'context text', embedding: [1, 0, 0, 0] },
    ]);
    async function* fake() {
      yield 'Hello';
      yield ' world';
    }
    streamAnswer.mockReturnValue(fake());

    const res = await POST(makeRequest({ history: [], question: 'hi' }));
    const text = await res.text();
    expect(text).toBe('Hello world');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- route`
Expected: FAIL — `app/api/chat/route.ts` does not exist yet.

- [ ] **Step 3: Implement `app/api/chat/route.ts`**

```ts
import { embedQuery, streamAnswer } from '@/lib/rag/gemini';
import { retrieveTopChunks } from '@/lib/rag/retrieval';
import { checkRateLimit } from '@/lib/rag/ratelimit';
import type { ChatMessage, RagChunk } from '@/lib/rag/types';
import embeddingsData from '@/lib/rag/embeddings.json';

const SYSTEM_INSTRUCTION = `You are the Worklog Studio assistant. Answer only using the provided context about the product and its author. If the answer isn't in the context, say you don't know and suggest contacting Roman directly. Be concise.`;

const TOP_K = 4;
const SIMILARITY_THRESHOLD = 0.7;

export async function POST(request: Request): Promise<Response> {
  const ip = request.headers.get('x-forwarded-for') ?? 'unknown';
  const { success } = await checkRateLimit(ip);
  if (!success) {
    return new Response('Too many requests', { status: 429 });
  }

  const { history, question } = (await request.json()) as {
    history: ChatMessage[];
    question: string;
  };

  const queryEmbedding = await embedQuery(question);
  const chunks = retrieveTopChunks(
    queryEmbedding,
    embeddingsData as RagChunk[],
    TOP_K,
    SIMILARITY_THRESHOLD
  );

  if (chunks.length === 0) {
    return new Response(
      "I don't know based on what I have available about Worklog Studio. Feel free to contact Roman directly for anything else."
    );
  }

  const context = chunks.map((c) => `### ${c.heading}\n${c.text}`).join('\n\n');
  const systemInstruction = `${SYSTEM_INSTRUCTION}\n\nContext:\n${context}`;

  const stream = new ReadableStream({
    async start(controller) {
      for await (const chunk of streamAnswer({ systemInstruction, history, question })) {
        controller.enqueue(new TextEncoder().encode(chunk));
      }
      controller.close();
    },
  });

  return new Response(stream, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- route`
Expected: PASS (3 tests)

- [ ] **Step 5: Commit**

```bash
git add app/api/chat/route.ts app/api/chat/route.test.ts
git commit -m "feat: add /api/chat RAG route handler with rate limiting and streaming"
```

---

### Task 7: Migrate hosting to Vercel

**Files:**
- Modify: `next.config.ts`
- Delete: `.github/workflows/nextjs.yml`

**Interfaces:**
- Produces: a deployable Next.js app with no static-export assumptions, ready to connect to Vercel.

- [ ] **Step 1: Remove the static-export-incompatible config from `next.config.ts`**

Remove the `output: 'standalone'` line (Vercel's build system handles output mode itself and does not need it):

```ts
import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
    ],
  },
  transpilePackages: ['motion'],
  webpack: (config, {dev}) => {
    if (dev && process.env.DISABLE_HMR === 'true') {
      config.watchOptions = {
        ignored: /.*/,
      };
    }
    return config;
  },
};

export default nextConfig;
```

- [ ] **Step 2: Remove the hardcoded GitHub Pages base path from the icon reference**

In `app/layout.tsx`, change:

```tsx
  icons: {
    icon: '/worklog_studio_site/icon.svg',
  },
```

to:

```tsx
  icons: {
    icon: '/icon.svg',
  },
```

(No `basePath` is needed on Vercel since the app is served from the domain root, not a `/worklog_studio_site/` subpath.)

- [ ] **Step 3: Delete the GitHub Pages deploy workflow**

```bash
git rm .github/workflows/nextjs.yml
```

- [ ] **Step 4: Manual step — connect the repo to Vercel (cannot be automated from this session)**

1. Go to vercel.com, sign in with GitHub, click "Add New Project", select this repository.
2. In the project's Environment Variables settings, add: `GEMINI_API_KEY`, `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` (values from Google AI Studio and the Upstash console respectively — see `.env.example` for what each is for).
3. Deploy. Vercel auto-detects Next.js and builds/deploys on every push to `main`.
4. Once verified working, update any external links pointing at `vavilov2212.github.io/worklog_studio_site/` to the new Vercel URL (or attach a custom domain in Vercel's domain settings).

- [ ] **Step 5: Commit the code changes**

```bash
git add next.config.ts app/layout.tsx
git commit -m "chore: remove GitHub Pages static-export assumptions for Vercel migration"
```

---

## Phase 3: Frontend

### Task 8: ChatContext (shared conversation state)

**Files:**
- Create: `components/chat/ChatContext.tsx`
- Test: `components/chat/ChatContext.test.tsx`

**Interfaces:**
- Consumes: `ChatMessage` from `lib/rag/types.ts`.
- Produces:
  - `ChatProvider` component
  - `useChat(): { messages: ChatMessage[]; isOpen: boolean; isStreaming: boolean; openChat(): void; closeChat(): void; sendMessage(question: string): Promise<void> }`
  - `sessionStorage` key: `'worklog-chat-history'`

- [ ] **Step 1: Write the failing test**

```tsx
// components/chat/ChatContext.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { ChatProvider, useChat } from './ChatContext';

function TestConsumer() {
  const { messages, isOpen, openChat, closeChat } = useChat();
  return (
    <div>
      <span data-testid="open">{String(isOpen)}</span>
      <span data-testid="count">{messages.length}</span>
      <button onClick={openChat}>open</button>
      <button onClick={closeChat}>close</button>
    </div>
  );
}

beforeEach(() => {
  sessionStorage.clear();
});

describe('ChatProvider', () => {
  it('starts closed with no messages', () => {
    render(
      <ChatProvider>
        <TestConsumer />
      </ChatProvider>
    );
    expect(screen.getByTestId('open')).toHaveTextContent('false');
    expect(screen.getByTestId('count')).toHaveTextContent('0');
  });

  it('opens and closes via openChat/closeChat', async () => {
    render(
      <ChatProvider>
        <TestConsumer />
      </ChatProvider>
    );
    await act(async () => screen.getByText('open').click());
    expect(screen.getByTestId('open')).toHaveTextContent('true');
    await act(async () => screen.getByText('close').click());
    expect(screen.getByTestId('open')).toHaveTextContent('false');
  });

  it('throws when useChat is used outside a ChatProvider', () => {
    function Bare() {
      useChat();
      return null;
    }
    expect(() => render(<Bare />)).toThrow('useChat must be used within a ChatProvider');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- ChatContext`
Expected: FAIL — `ChatContext.tsx` does not exist yet.

- [ ] **Step 3: Implement `components/chat/ChatContext.tsx`**

```tsx
'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import type { ChatMessage } from '@/lib/rag/types';

const STORAGE_KEY = 'worklog-chat-history';

interface ChatContextType {
  messages: ChatMessage[];
  isOpen: boolean;
  isStreaming: boolean;
  openChat: () => void;
  closeChat: () => void;
  sendMessage: (question: string) => Promise<void>;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);

  useEffect(() => {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    if (stored) setMessages(JSON.parse(stored));
  }, []);

  useEffect(() => {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
  }, [messages]);

  const openChat = useCallback(() => setIsOpen(true), []);
  const closeChat = useCallback(() => setIsOpen(false), []);

  const sendMessage = useCallback(
    async (question: string) => {
      const history = messages;
      setMessages((prev) => [...prev, { role: 'user', content: question }, { role: 'assistant', content: '' }]);
      setIsStreaming(true);

      try {
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ history, question }),
        });

        const reader = res.body?.getReader();
        const decoder = new TextDecoder();
        if (reader) {
          let done = false;
          while (!done) {
            const result = await reader.read();
            done = result.done;
            if (result.value) {
              const text = decoder.decode(result.value);
              setMessages((prev) => {
                const next = [...prev];
                next[next.length - 1] = {
                  role: 'assistant',
                  content: next[next.length - 1].content + text,
                };
                return next;
              });
            }
          }
        }
      } finally {
        setIsStreaming(false);
      }
    },
    [messages]
  );

  return (
    <ChatContext.Provider value={{ messages, isOpen, isStreaming, openChat, closeChat, sendMessage }}>
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- ChatContext`
Expected: PASS (3 tests)

- [ ] **Step 5: Commit**

```bash
git add components/chat/ChatContext.tsx components/chat/ChatContext.test.tsx
git commit -m "feat: add ChatContext for shared session-only conversation state"
```

---

### Task 9: ChatPanel component

**Files:**
- Create: `components/chat/ChatPanel.tsx`
- Test: `components/chat/ChatPanel.test.tsx`

**Interfaces:**
- Consumes: `useChat` from `./ChatContext`.
- Produces: `<ChatPanel />` — renders message list, input, suggested prompt chips when empty, thinking indicator while streaming with no assistant text yet.

- [ ] **Step 1: Write the failing test**

```tsx
// components/chat/ChatPanel.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { ChatProvider } from './ChatContext';
import ChatPanel from './ChatPanel';

beforeEach(() => {
  sessionStorage.clear();
  global.fetch = vi.fn().mockResolvedValue({
    body: {
      getReader: () => ({
        read: vi
          .fn()
          .mockResolvedValueOnce({ done: false, value: new TextEncoder().encode('Hi there') })
          .mockResolvedValueOnce({ done: true, value: undefined }),
      }),
    },
  }) as unknown as typeof fetch;
});

describe('ChatPanel', () => {
  it('shows suggested prompt chips when there are no messages', () => {
    render(
      <ChatProvider>
        <ChatPanel />
      </ChatProvider>
    );
    expect(screen.getByText(/integrations are planned/i)).toBeInTheDocument();
  });

  it('sends a question and renders the streamed answer', async () => {
    render(
      <ChatProvider>
        <ChatPanel />
      </ChatProvider>
    );
    const input = screen.getByPlaceholderText(/ask anything/i);
    fireEvent.change(input, { target: { value: 'What is Worklog Studio?' } });
    await act(async () => {
      fireEvent.submit(screen.getByRole('form'));
    });
    expect(screen.getByText('What is Worklog Studio?')).toBeInTheDocument();
    expect(screen.getByText('Hi there')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- ChatPanel`
Expected: FAIL — `ChatPanel.tsx` does not exist yet.

- [ ] **Step 3: Implement `components/chat/ChatPanel.tsx`**

```tsx
'use client';

import { useState } from 'react';
import { Send, Square } from 'lucide-react';
import { useChat } from './ChatContext';

const SUGGESTED_PROMPTS = [
  'What integrations are planned?',
  'Tell me about the author',
  'What does Frictionless Tracking mean?',
];

export default function ChatPanel() {
  const { messages, isStreaming, sendMessage } = useChat();
  const [input, setInput] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isStreaming) return;
    const question = input.trim();
    setInput('');
    void sendMessage(question);
  };

  const lastMessage = messages[messages.length - 1];
  const isThinking = isStreaming && lastMessage?.role === 'assistant' && lastMessage.content === '';

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="flex flex-wrap gap-2">
            {SUGGESTED_PROMPTS.map((prompt) => (
              <button
                key={prompt}
                type="button"
                onClick={() => void sendMessage(prompt)}
                className="text-xs font-medium text-accent bg-accent/10 border border-accent/20 rounded-full px-3 py-1.5 hover:bg-accent/20 transition-colors"
              >
                {prompt}
              </button>
            ))}
          </div>
        )}

        {messages.map((message, i) => (
          <div
            key={i}
            className={`text-sm rounded-2xl px-4 py-2.5 max-w-[85%] ${
              message.role === 'user'
                ? 'bg-accent text-white ml-auto'
                : 'bg-subtle text-ink border border-border'
            }`}
          >
            {message.content || (isThinking && i === messages.length - 1 ? '...' : '')}
          </div>
        ))}
      </div>

      <form
        role="form"
        aria-label="Ask the assistant a question"
        onSubmit={handleSubmit}
        className="flex items-center gap-2 p-3 border-t border-border"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask anything..."
          className="flex-1 text-sm bg-subtle border border-border rounded-xl px-3 py-2 focus:outline-none focus:border-accent/40"
        />
        <button
          type="submit"
          disabled={!input.trim() && !isStreaming}
          className="w-9 h-9 rounded-xl bg-accent text-white flex items-center justify-center disabled:opacity-40"
        >
          {isStreaming ? <Square className="w-4 h-4" /> : <Send className="w-4 h-4" />}
        </button>
      </form>
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- ChatPanel`
Expected: PASS (2 tests)

- [ ] **Step 5: Commit**

```bash
git add components/chat/ChatPanel.tsx components/chat/ChatPanel.test.tsx
git commit -m "feat: add ChatPanel UI with streaming messages and suggested prompts"
```

---

### Task 10: AskAISection (inline entry point below Hero)

**Files:**
- Create: `components/chat/AskAISection.tsx`
- Test: `components/chat/AskAISection.test.tsx`
- Modify: `app/page.tsx`

**Interfaces:**
- Consumes: `useChat` from `./ChatContext`, `ChatPanel` from `./ChatPanel`.
- Produces: `<AskAISection />` — collapsed input by default; expands into `ChatPanel` in place once the user submits a question or the chat already has messages.

- [ ] **Step 1: Write the failing test**

```tsx
// components/chat/AskAISection.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ChatProvider } from './ChatContext';
import AskAISection from './AskAISection';

beforeEach(() => {
  sessionStorage.clear();
  global.fetch = vi.fn().mockResolvedValue({
    body: { getReader: () => ({ read: vi.fn().mockResolvedValue({ done: true, value: undefined }) }) },
  }) as unknown as typeof fetch;
});

describe('AskAISection', () => {
  it('renders a collapsed input by default', () => {
    render(
      <ChatProvider>
        <AskAISection />
      </ChatProvider>
    );
    expect(screen.getByPlaceholderText(/ask anything/i)).toBeInTheDocument();
  });

  it('expands into the full panel after submitting a question', () => {
    render(
      <ChatProvider>
        <AskAISection />
      </ChatProvider>
    );
    const input = screen.getByPlaceholderText(/ask anything/i);
    fireEvent.change(input, { target: { value: 'What is this?' } });
    fireEvent.submit(screen.getByRole('form'));
    expect(screen.getByText('What is this?')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- AskAISection`
Expected: FAIL — `AskAISection.tsx` does not exist yet.

- [ ] **Step 3: Implement `components/chat/AskAISection.tsx`**

```tsx
'use client';

import { Sparkles } from 'lucide-react';
import { useChat } from './ChatContext';
import ChatPanel from './ChatPanel';

export default function AskAISection() {
  const { messages, sendMessage } = useChat();
  const expanded = messages.length > 0;

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const input = e.currentTarget.elements.namedItem('question') as HTMLInputElement;
    if (!input.value.trim()) return;
    void sendMessage(input.value.trim());
    input.value = '';
  };

  return (
    <section className="max-w-3xl mx-auto px-6 md:px-8 -mt-4 md:-mt-8 pb-16 md:pb-24">
      <div className="bg-white border border-border rounded-[2rem] shadow-xl overflow-hidden">
        {!expanded ? (
          <form
            role="form"
            aria-label="Ask the assistant a question"
            onSubmit={handleSubmit}
            className="p-6 md:p-8 text-center"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 text-accent text-xs font-bold tracking-wider uppercase mb-4 border border-accent/20">
              <Sparkles className="w-3.5 h-3.5" />
              Ask AI
            </div>
            <h3 className="text-xl md:text-2xl font-extrabold text-ink mb-2">Ask about Worklog Studio</h3>
            <p className="text-slate text-sm mb-6">
              Get instant answers about features, the roadmap, or the author.
            </p>
            <input
              name="question"
              placeholder="Ask anything..."
              className="w-full text-sm bg-subtle border border-border rounded-xl px-4 py-3 text-center focus:outline-none focus:border-accent/40"
            />
          </form>
        ) : (
          <div className="h-[480px]">
            <ChatPanel />
          </div>
        )}
      </div>
    </section>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- AskAISection`
Expected: PASS (2 tests)

- [ ] **Step 5: Wire into `app/page.tsx`**

```tsx
import Header from '@/components/Header';
import Hero from '@/components/Hero';
import AskAISection from '@/components/chat/AskAISection';
import Features from '@/components/Features';
import Roadmap from '@/components/Roadmap';
import Download from '@/components/Download';
import Footer from '@/components/Footer';

export default function Home() {
  return (
    <main className="min-h-screen bg-surface text-on-surface selection:bg-primary/30">
      <Header />
      <Hero />
      <AskAISection />
      <Features />
      <Roadmap />
      <Download />
      <Footer />
    </main>
  );
}
```

- [ ] **Step 6: Commit**

```bash
git add components/chat/AskAISection.tsx components/chat/AskAISection.test.tsx app/page.tsx
git commit -m "feat: add inline Ask AI section below Hero"
```

---

### Task 11: AskAIHeaderPill (header shortcut + attention animation)

**Files:**
- Create: `components/chat/AskAIHeaderPill.tsx`
- Test: `components/chat/AskAIHeaderPill.test.tsx`
- Create: `components/chat/ChatOverlay.tsx`
- Modify: `components/Header.tsx`

**Interfaces:**
- Consumes: `useChat` from `./ChatContext`, `ChatPanel` from `./ChatPanel`.
- Produces: `<AskAIHeaderPill />` (icon + "Ask AI" text, periodic glow, opens overlay), `<ChatOverlay />` (renders `ChatPanel` as a positioned overlay when `isOpen`).

- [ ] **Step 1: Write the failing test**

```tsx
// components/chat/AskAIHeaderPill.test.tsx
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ChatProvider, useChat } from './ChatContext';
import AskAIHeaderPill from './AskAIHeaderPill';

function OpenStateProbe() {
  const { isOpen } = useChat();
  return <span data-testid="open">{String(isOpen)}</span>;
}

beforeEach(() => {
  sessionStorage.clear();
});

describe('AskAIHeaderPill', () => {
  it('renders the "Ask AI" label, not icon-only', () => {
    render(
      <ChatProvider>
        <AskAIHeaderPill />
      </ChatProvider>
    );
    expect(screen.getByText('Ask AI')).toBeInTheDocument();
  });

  it('opens the chat when clicked', () => {
    render(
      <ChatProvider>
        <AskAIHeaderPill />
        <OpenStateProbe />
      </ChatProvider>
    );
    fireEvent.click(screen.getByRole('button', { name: /ask ai/i }));
    expect(screen.getByTestId('open')).toHaveTextContent('true');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- AskAIHeaderPill`
Expected: FAIL — `AskAIHeaderPill.tsx` does not exist yet.

- [ ] **Step 3: Implement `components/chat/AskAIHeaderPill.tsx`**

The recurring glow is a `box-shadow` ring that animates briefly every 9 seconds via `motion`'s `repeat`/`repeatDelay`, not a constant pulse:

```tsx
'use client';

import { motion } from 'motion/react';
import { Sparkles } from 'lucide-react';
import { useChat } from './ChatContext';

export default function AskAIHeaderPill() {
  const { openChat } = useChat();

  return (
    <motion.button
      type="button"
      onClick={openChat}
      aria-label="Ask AI"
      className="flex items-center gap-1.5 text-sm font-bold text-accent hover:text-accent/80 transition-colors px-2.5 py-1.5 rounded-full"
      animate={{
        boxShadow: [
          '0 0 0 0 rgba(37, 99, 235, 0)',
          '0 0 0 6px rgba(37, 99, 235, 0.15)',
          '0 0 0 0 rgba(37, 99, 235, 0)',
        ],
      }}
      transition={{
        duration: 1.2,
        repeat: Infinity,
        repeatDelay: 8,
        ease: 'easeOut',
      }}
    >
      <Sparkles className="w-4 h-4" />
      <span>Ask AI</span>
    </motion.button>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- AskAIHeaderPill`
Expected: PASS (2 tests)

- [ ] **Step 5: Implement `components/chat/ChatOverlay.tsx`**

```tsx
'use client';

import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';
import { useChat } from './ChatContext';
import ChatPanel from './ChatPanel';

export default function ChatOverlay() {
  const { isOpen, closeChat } = useChat();

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: -10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -10 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="fixed top-20 right-4 md:right-8 z-50 w-[calc(100vw-2rem)] md:w-[380px] h-[560px] bg-white rounded-2xl border border-border shadow-2xl overflow-hidden"
        >
          <button
            type="button"
            onClick={closeChat}
            aria-label="Close chat"
            className="absolute top-3 right-3 z-10 p-1.5 rounded-full bg-white/80 text-slate hover:text-ink"
          >
            <X className="w-4 h-4" />
          </button>
          <ChatPanel />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
```

- [ ] **Step 6: Wire the pill and overlay into `components/Header.tsx`**

Add the import and render `AskAIHeaderPill` next to the existing Download/GitHub links, and `ChatOverlay` once at the end of the header (it's `fixed`-positioned, so placement in the tree doesn't affect layout):

```tsx
'use client';

import { motion } from 'motion/react';
import { Logo } from './Logo';
import Link from 'next/link';
import { Github, Download } from 'lucide-react';
import AskAIHeaderPill from './chat/AskAIHeaderPill';
import ChatOverlay from './chat/ChatOverlay';

export default function Header() {
  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-xl duration-300 ease-out border-b border-border"
    >
      <div className="flex justify-between items-center max-w-7xl mx-auto px-6 md:px-8 py-3">
        <Link href="/">
          <Logo />
        </Link>
        <nav className="hidden md:flex items-center gap-10 font-sans tracking-tight text-sm font-medium">
          <Link href="#features" className="text-slate hover:text-ink transition-colors">Features</Link>
          <Link href="#roadmap" className="text-slate hover:text-ink transition-colors">Roadmap</Link>
        </nav>
        <div className="flex items-center gap-4 md:gap-6">
          <AskAIHeaderPill />
          <a
            href="https://github.com/vavilov2212/worklog_studio/releases/latest/download/worklogStudio.dmg"
            className="flex items-center gap-2 text-sm font-bold text-accent hover:text-accent/80 transition-colors p-2 sm:p-0"
            title="Download for Mac"
          >
            <Download className="w-5 h-5 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline-block">Download for Mac</span>
          </a>
          <a
            href="https://github.com/vavilov2212/worklog_studio"
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 text-slate hover:text-ink transition-colors"
            aria-label="GitHub Repository"
          >
            <Github className="w-5 h-5" />
          </a>
        </div>
      </div>
      <ChatOverlay />
    </motion.header>
  );
}
```

- [ ] **Step 7: Commit**

```bash
git add components/chat/AskAIHeaderPill.tsx components/chat/AskAIHeaderPill.test.tsx components/chat/ChatOverlay.tsx components/Header.tsx
git commit -m "feat: add header Ask AI pill shortcut with subtle attention animation"
```

---

### Task 12: Wrap the app in ChatProvider

**Files:**
- Modify: `app/layout.tsx`

**Interfaces:**
- Consumes: `ChatProvider` from `@/components/chat/ChatContext`.

- [ ] **Step 1: Add `ChatProvider` to the root layout**

```tsx
import type {Metadata} from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
});

export const metadata: Metadata = {
  title: 'Worklog Studio | Track your work. Understand your flow.',
  description: 'The minimal desktop time logger designed for deep focus. High-precision analytics without the overhead of heavy management tools.',
  icons: {
    icon: '/icon.svg',
  },
};

import { TimerProvider } from '@/components/TimerContext';
import { ChatProvider } from '@/components/chat/ChatContext';

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="font-sans bg-bg text-ink selection:bg-accent/30 selection:text-ink antialiased" suppressHydrationWarning>
        <TimerProvider>
          <ChatProvider>
            {children}
          </ChatProvider>
        </TimerProvider>
      </body>
    </html>
  );
}
```

(Note: the `icons.icon` value here was already updated to `/icon.svg` in Task 7 Step 2 — shown again here for the full file context.)

- [ ] **Step 2: Manual verification**

Run: `npm run dev`, open the site, confirm:
- The Ask AI section renders below the Hero with a centered input.
- Submitting a question expands it into the chat panel and a streamed reply appears (using the stub corpus from Task 5 — try asking about "tracking" or "roadmap").
- The header "Ask AI" pill is visible, glows briefly every ~9 seconds, and clicking it opens the same conversation as an overlay.
- Reloading the page after sending a message clears the conversation (session-only, by design).

- [ ] **Step 3: Commit**

```bash
git add app/layout.tsx
git commit -m "feat: wrap app in ChatProvider"
```

---

## Phase 1: Data Preparation & Embedding Generation

### Task 13: Markdown chunker

**Files:**
- Create: `lib/rag/chunkMarkdown.ts`
- Test: `lib/rag/chunkMarkdown.test.ts`

**Interfaces:**
- Produces: `chunkMarkdown(source: string, markdown: string): Omit<RagChunk, 'embedding'>[]` — splits on `##` headings, one chunk per section, `id` derived from `source` + heading slug.

- [ ] **Step 1: Write the failing test**

```ts
// lib/rag/chunkMarkdown.test.ts
import { describe, it, expect } from 'vitest';
import { chunkMarkdown } from './chunkMarkdown';

const sample = `# Product Overview

Intro paragraph, ignored (no ## heading yet).

## Value Proposition

Worklog Studio is a minimal time logger.

## Target Audience

Built for professionals who live in deep work.
`;

describe('chunkMarkdown', () => {
  it('splits into one chunk per ## heading', () => {
    const chunks = chunkMarkdown('product-overview.md', sample);
    expect(chunks).toHaveLength(2);
    expect(chunks[0]).toEqual({
      id: 'product-overview-value-proposition',
      source: 'product-overview.md',
      heading: 'Value Proposition',
      text: 'Worklog Studio is a minimal time logger.',
    });
    expect(chunks[1].heading).toBe('Target Audience');
  });

  it('ignores content before the first ## heading', () => {
    const chunks = chunkMarkdown('x.md', sample);
    const allText = chunks.map((c) => c.text).join(' ');
    expect(allText).not.toContain('Intro paragraph');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- chunkMarkdown`
Expected: FAIL — `chunkMarkdown.ts` does not exist yet.

- [ ] **Step 3: Implement `lib/rag/chunkMarkdown.ts`**

```ts
import type { RagChunk } from './types';

function slugify(heading: string): string {
  return heading
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-');
}

export function chunkMarkdown(
  source: string,
  markdown: string
): Omit<RagChunk, 'embedding'>[] {
  const sections = markdown.split(/^##\s+(.+)$/m).slice(1);
  const chunks: Omit<RagChunk, 'embedding'>[] = [];
  const baseId = source.replace(/\.md$/, '');

  for (let i = 0; i < sections.length; i += 2) {
    const heading = sections[i].trim();
    const text = sections[i + 1].trim();
    chunks.push({
      id: `${baseId}-${slugify(heading)}`,
      source,
      heading,
      text,
    });
  }

  return chunks;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- chunkMarkdown`
Expected: PASS (2 tests)

- [ ] **Step 5: Commit**

```bash
git add lib/rag/chunkMarkdown.ts lib/rag/chunkMarkdown.test.ts
git commit -m "feat: add markdown heading-based chunker for RAG ingestion"
```

---

### Task 14: Placeholder source content

**Files:**
- Create: `content/rag/product-overview.md`
- Create: `content/rag/features-tracking.md`
- Create: `content/rag/features-analytics.md`
- Create: `content/rag/features-integrations.md`
- Create: `content/rag/roadmap.md`
- Create: `content/rag/about-author.md`

These are placeholders so the ingestion script (Task 15) can be run end-to-end now. The project owner replaces these files with real content later and re-runs ingestion (Task 15, Step 4) — no code changes needed when that happens.

- [ ] **Step 1: Create `content/rag/product-overview.md`**

```markdown
## Value Proposition

Worklog Studio is a minimal, distraction-free desktop time logger for professionals, developers, and creators who prioritize deep work and flow states. It avoids the high-friction, form-heavy UI of traditional time trackers.

## Target Audience

Worklog Studio is built for engineers, designers, and founders who want to understand where their time actually goes without breaking their concentration to log it.
```

- [ ] **Step 2: Create the remaining placeholder files**

`content/rag/features-tracking.md`:

```markdown
## Frictionless Tracking

Start logging a deep work session with a single keystroke or click. No complex forms or project setup required — the interface stays out of the way until it's needed.
```

`content/rag/features-analytics.md`:

```markdown
## Focus Analytics

Worklog Studio's analytics engine identifies peak productivity hours, flow states, and distraction patterns, helping users optimize their daily schedule.
```

`content/rag/features-integrations.md`:

```markdown
## Seamless Integrations

Worklog Studio syncs automatically with GitHub (commits and PRs) and Linear (issues and workspace tasks) today. Google Calendar and Notion integrations are planned.
```

`content/rag/roadmap.md`:

```markdown
## Current Roadmap

The macOS app is released. Advanced analytics is in progress. Windows support and team collaboration features are planned for future releases.
```

`content/rag/about-author.md`:

```markdown
## About the Author

[PLACEHOLDER — replace with real bio content before ingesting for production. This file intentionally ships as a stand-in so the ingestion pipeline can be exercised end-to-end without blocking on content authoring.]
```

- [ ] **Step 3: Commit**

```bash
git add content/rag/
git commit -m "feat: add placeholder RAG source content"
```

---

### Task 15: Ingestion script

**Files:**
- Create: `scripts/ingest-rag-content.ts`
- Modify: `package.json`

**Interfaces:**
- Consumes: `chunkMarkdown` from `lib/rag/chunkMarkdown.ts`, `embedQuery`-equivalent batch embedding via `@google/genai` directly (the script embeds many chunks per run, so it calls `ai.models.embedContent` with a batch of `contents` rather than reusing the single-string `embedQuery` helper).
- Produces: overwrites `lib/rag/embeddings.json` with real `RagChunk[]` data, replacing the Task 5 stub.

- [ ] **Step 1: Implement `scripts/ingest-rag-content.ts`**

```ts
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { GoogleGenAI } from '@google/genai';
import { chunkMarkdown } from '../lib/rag/chunkMarkdown';
import type { RagChunk } from '../lib/rag/types';

const CONTENT_DIR = join(__dirname, '..', 'content', 'rag');
const OUTPUT_PATH = join(__dirname, '..', 'lib', 'rag', 'embeddings.json');
const EMBEDDING_MODEL = 'text-embedding-004';
const BATCH_SIZE = 10;

async function main() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is required to run ingestion');
  }
  const ai = new GoogleGenAI({ apiKey });

  const files = readdirSync(CONTENT_DIR).filter((f) => f.endsWith('.md'));
  const allChunks = files.flatMap((file) => {
    const markdown = readFileSync(join(CONTENT_DIR, file), 'utf-8');
    return chunkMarkdown(file, markdown);
  });

  console.log(`Chunked ${files.length} files into ${allChunks.length} chunks. Embedding...`);

  const result: RagChunk[] = [];
  for (let i = 0; i < allChunks.length; i += BATCH_SIZE) {
    const batch = allChunks.slice(i, i + BATCH_SIZE);
    const response = await ai.models.embedContent({
      model: EMBEDDING_MODEL,
      contents: batch.map((c) => c.text),
    });

    batch.forEach((chunk, j) => {
      const values = response.embeddings?.[j]?.values;
      if (!values) {
        throw new Error(`No embedding returned for chunk ${chunk.id}`);
      }
      result.push({ ...chunk, embedding: values });
    });

    console.log(`Embedded ${Math.min(i + BATCH_SIZE, allChunks.length)}/${allChunks.length}`);
  }

  writeFileSync(OUTPUT_PATH, JSON.stringify(result, null, 2));
  console.log(`Wrote ${result.length} chunks to ${OUTPUT_PATH}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
```

- [ ] **Step 2: Add an `ingest:rag` script to `package.json`**

```json
"ingest:rag": "tsx scripts/ingest-rag-content.ts"
```

Install `tsx` to run the TypeScript script directly:

```bash
npm install -D tsx
```

- [ ] **Step 3: Manual run — generate the real embeddings**

Requires `GEMINI_API_KEY` set in the local shell (or a `.env.local` loaded via `dotenv` — for a one-off script run, exporting it in the shell is sufficient):

```bash
GEMINI_API_KEY=your-key-here npm run ingest:rag
```

Expected output: a log line per batch and a final "Wrote N chunks to .../lib/rag/embeddings.json". This **overwrites** the Task 5 stub file with real, semantically meaningful embeddings.

- [ ] **Step 4: Manual end-to-end verification**

Run: `npm run dev`, open the Ask AI section, ask a real question covered by the placeholder content (e.g. "What integrations does it support?"). Confirm the answer reflects the real content (not the Task 5 stub's generic text) and that retrieval still declines gracefully for off-topic questions (e.g. "What's the weather today?").

- [ ] **Step 5: Commit**

```bash
git add scripts/ingest-rag-content.ts package.json package-lock.json lib/rag/embeddings.json
git commit -m "feat: add RAG ingestion script and generate real embeddings"
```

**Note for the project owner:** once you've authored your real "about me" and project content, replace the files in `content/rag/` (matching the existing filenames or adding new ones — the ingestion script picks up every `.md` file in that directory automatically) and re-run Step 3 to regenerate `embeddings.json`.

---
