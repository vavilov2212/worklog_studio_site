import { describe, it, expect, vi, beforeEach } from 'vitest';

const { embedContent, generateContentStream } = vi.hoisted(() => ({
  embedContent: vi.fn(),
  generateContentStream: vi.fn(),
}));

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
      model: 'gemini-embedding-001',
      contents: ['hello'],
      config: { taskType: 'RETRIEVAL_QUERY' },
    });
  });

  it('throws if the SDK returns no embeddings', async () => {
    embedContent.mockResolvedValue({ embeddings: [] });
    await expect(embedQuery('hello')).rejects.toThrow('No embedding returned');
  });

  it('retries on a transient 503 and succeeds on the next attempt', async () => {
    const unavailable = Object.assign(new Error('UNAVAILABLE'), { status: 503 });
    embedContent
      .mockRejectedValueOnce(unavailable)
      .mockResolvedValueOnce({ embeddings: [{ values: [0.4, 0.5] }] });

    const result = await embedQuery('hello');

    expect(result).toEqual([0.4, 0.5]);
    expect(embedContent).toHaveBeenCalledTimes(2);
  });

  it('does not retry on a non-503 error', async () => {
    const badRequest = Object.assign(new Error('BAD_REQUEST'), { status: 400 });
    embedContent.mockRejectedValue(badRequest);

    await expect(embedQuery('hello')).rejects.toThrow('BAD_REQUEST');
    expect(embedContent).toHaveBeenCalledTimes(1);
  });

  it('gives up after exhausting retries on repeated 503s', async () => {
    const unavailable = Object.assign(new Error('UNAVAILABLE'), { status: 503 });
    embedContent.mockRejectedValue(unavailable);

    await expect(embedQuery('hello')).rejects.toThrow('UNAVAILABLE');
    expect(embedContent).toHaveBeenCalledTimes(3);
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

  it('retries starting the stream on a transient 503', async () => {
    const unavailable = Object.assign(new Error('UNAVAILABLE'), { status: 503 });
    async function* fakeStream() {
      yield { text: 'Recovered' };
    }
    generateContentStream.mockRejectedValueOnce(unavailable).mockResolvedValueOnce(fakeStream());

    const chunks: string[] = [];
    for await (const chunk of streamAnswer({ systemInstruction: 'be helpful', history: [], question: 'hi' })) {
      chunks.push(chunk);
    }

    expect(chunks).toEqual(['Recovered']);
    expect(generateContentStream).toHaveBeenCalledTimes(2);
  });
});
