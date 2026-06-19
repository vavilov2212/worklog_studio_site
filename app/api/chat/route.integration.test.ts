import { describe, it, expect, vi, beforeEach } from 'vitest';

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
  it('retrieves the matching stub chunk and streams an answer grounded in its context', async () => {
    // Exact match to the "Frictionless Tracking" stub embedding in lib/rag/embeddings.json
    embedQuery.mockResolvedValue([0.9, 0.1, 0.0, 0.1]);

    async function* fake() {
      yield 'Yes, ';
      yield 'just press one key to start tracking.';
    }
    streamAnswer.mockReturnValue(fake());

    const res = await POST(makeRequest({ history: [], question: 'How do I start tracking?' }));

    expect(streamAnswer).toHaveBeenCalledTimes(1);
    const callArgs = streamAnswer.mock.calls[0][0] as { systemInstruction: string };
    expect(callArgs.systemInstruction).toContain('Frictionless Tracking');
    expect(callArgs.systemInstruction).toContain('single keystroke');

    const text = await res.text();
    expect(text).toBe('Yes, just press one key to start tracking.');
  });

  it('declines without calling streamAnswer when the embedding matches no stub chunk', async () => {
    // Orthogonal-ish vector far from all stub embeddings -> below similarity threshold
    embedQuery.mockResolvedValue([-1, -1, -1, -1]);

    const res = await POST(makeRequest({ history: [], question: 'irrelevant question' }));

    expect(streamAnswer).not.toHaveBeenCalled();
    const text = await res.text();
    expect(text).toContain("don't know");
  });
});
