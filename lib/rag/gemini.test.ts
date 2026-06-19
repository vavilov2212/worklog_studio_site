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
