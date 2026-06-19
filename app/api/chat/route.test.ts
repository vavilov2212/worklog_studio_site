import { describe, it, expect, vi, beforeEach } from 'vitest';

const { checkRateLimit, embedQuery, retrieveTopChunks, streamAnswer } = vi.hoisted(() => ({
  checkRateLimit: vi.fn(),
  embedQuery: vi.fn(),
  retrieveTopChunks: vi.fn(),
  streamAnswer: vi.fn(),
}));

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
