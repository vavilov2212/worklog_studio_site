import { GoogleGenAI } from '@google/genai';
import type { ChatMessage } from './types';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const EMBEDDING_MODEL = 'gemini-embedding-001';

// Tried in order. All are free-tier-eligible Gemini models with separate quota
// pools, so falling through the list works around a single model being
// overloaded (503) or rate-limited (429) on the free tier.
const GENERATION_MODELS = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-2.5-flash-lite'];

const MAX_RETRIES = 3;
const RETRY_BASE_DELAY_MS = 500;

function getErrorStatus(err: unknown): unknown {
  if (typeof err === 'object' && err !== null && 'status' in err) {
    return (err as { status: unknown }).status;
  }
  return undefined;
}

function isRetryable(err: unknown): boolean {
  const status = getErrorStatus(err);
  return status === 503 || status === 429;
}

async function withRetry<T>(fn: () => Promise<T>): Promise<T> {
  let attempt = 0;
  while (true) {
    try {
      return await fn();
    } catch (err) {
      attempt += 1;
      if (!isRetryable(err) || attempt >= MAX_RETRIES) {
        throw err;
      }
      await new Promise((resolve) => setTimeout(resolve, RETRY_BASE_DELAY_MS * 2 ** (attempt - 1)));
    }
  }
}

export async function embedQuery(text: string): Promise<number[]> {
  const response = await withRetry(() =>
    ai.models.embedContent({
      model: EMBEDDING_MODEL,
      contents: [text],
      config: { taskType: 'RETRIEVAL_QUERY' },
    })
  );
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

  let lastError: unknown;

  for (const model of GENERATION_MODELS) {
    let yieldedAny = false;
    try {
      const stream = await withRetry(() =>
        ai.models.generateContentStream({
          model,
          contents,
          config: { systemInstruction: params.systemInstruction },
        })
      );

      for await (const chunk of stream) {
        if (chunk.text) {
          yieldedAny = true;
          yield chunk.text;
        }
      }
      return;
    } catch (err) {
      lastError = err;
      // Once part of an answer has already been streamed to the client,
      // switching models would produce a mixed/duplicated response, so only
      // fall back to the next model if this one failed before yielding anything.
      if (yieldedAny || !isRetryable(err)) throw err;
    }
  }

  throw lastError;
}
