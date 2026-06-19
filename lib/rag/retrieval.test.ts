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
