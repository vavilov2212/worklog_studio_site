import { GoogleGenAI } from '@google/genai';
import type { ChatMessage } from './types';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const EMBEDDING_MODEL = 'text-embedding-004';
const GENERATION_MODEL = 'gemini-2.5-flash';

export async function embedQuery(text: string): Promise<number[]> {
  const response = await ai.models.embedContent({
    model: EMBEDDING_MODEL,
    contents: [text],
  });
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

  const stream = await ai.models.generateContentStream({
    model: GENERATION_MODEL,
    contents,
    config: { systemInstruction: params.systemInstruction },
  });

  for await (const chunk of stream) {
    if (chunk.text) yield chunk.text;
  }
}
