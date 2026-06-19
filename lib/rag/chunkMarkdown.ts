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
