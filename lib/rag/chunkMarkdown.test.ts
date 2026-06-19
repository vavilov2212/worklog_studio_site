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
