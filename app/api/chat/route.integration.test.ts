import { describe, it, expect, vi, beforeEach } from 'vitest';
import embeddingsData from '@/lib/rag/embeddings.json';
import type { RagChunk } from '@/lib/rag/types';

// Integration-style test: only the two real network calls (embedQuery, streamAnswer) are
// mocked. retrieveTopChunks and embeddings.json are real, so the actual wiring of
// "embed -> retrieve over the real corpus -> assemble context" is exercised.
const { checkRateLimit, embedQuery, streamAnswer } = vi.hoisted(() => ({
  checkRateLimit: vi.fn(),
  embedQuery: vi.fn(),
  streamAnswer: vi.fn(),
}));

vi.mock('@/lib/rag/ratelimit', () => ({ checkRateLimit }));
vi.mock('@/lib/rag/gemini', () => ({ embedQuery, streamAnswer }));

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
  embedQuery.mockReset();
  streamAnswer.mockReset();
});

describe('POST /api/chat (real retrieval + real embeddings.json)', () => {
  it('retrieves the matching chunk and streams an answer grounded in its context', async () => {
    // Exact match to a real chunk's embedding in lib/rag/embeddings.json — read directly
    // from the file rather than hardcoded, so this stays correct regardless of the
    // embedding model's dimensionality or which chunks the content currently produces.
    const trackingChunk = (embeddingsData as RagChunk[]).find(
      (c) => c.heading === 'Frictionless Tracking'
    );
    if (!trackingChunk) {
      throw new Error('Expected a "Frictionless Tracking" chunk in lib/rag/embeddings.json');
    }
    embedQuery.mockResolvedValue(trackingChunk.embedding);

    async function* fake() {
      yield 'Yes, ';
      yield 'just press one key to start tracking.';
    }
    streamAnswer.mockReturnValue(fake());

    const res = await POST(makeRequest({ history: [], question: 'How do I start tracking?' }));

    expect(streamAnswer).toHaveBeenCalledTimes(1);
    const callArgs = streamAnswer.mock.calls[0][0] as { systemInstruction: string };
    expect(callArgs.systemInstruction).toContain('Frictionless Tracking');

    const text = await res.text();
    expect(text).toBe('Yes, just press one key to start tracking.');
  });

  it('declines without calling streamAnswer when the embedding matches no chunk', async () => {
    // A zero vector has undefined direction, so cosineSimilarity's zero-norm guard
    // deterministically returns 0 against every real chunk, regardless of content -
    // guaranteed below the similarity threshold without depending on specific values.
    const dimension = (embeddingsData as RagChunk[])[0].embedding.length;
    embedQuery.mockResolvedValue(new Array(dimension).fill(0));

    const res = await POST(makeRequest({ history: [], question: 'irrelevant question' }));

    expect(streamAnswer).not.toHaveBeenCalled();
    const text = await res.text();
    expect(text).toContain("don't know");
  });
});
