import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { GoogleGenAI } from '@google/genai';
import { chunkMarkdown } from '../lib/rag/chunkMarkdown';
import type { RagChunk } from '../lib/rag/types';

const CONTENT_DIR = join(__dirname, '..', 'content', 'rag');
const OUTPUT_PATH = join(__dirname, '..', 'lib', 'rag', 'embeddings.json');
const EMBEDDING_MODEL = 'gemini-embedding-001';
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
      config: { taskType: 'RETRIEVAL_DOCUMENT' },
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
