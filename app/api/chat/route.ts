import { embedQuery, streamAnswer } from '@/lib/rag/gemini';
import { retrieveTopChunks } from '@/lib/rag/retrieval';
import { checkRateLimit } from '@/lib/rag/ratelimit';
import type { ChatMessage, RagChunk } from '@/lib/rag/types';
import embeddingsData from '@/lib/rag/embeddings.json';

const SYSTEM_INSTRUCTION = `You are the Worklog Studio assistant. Answer only using the provided context about the product and its author. If the answer isn't in the context, say you don't know and suggest contacting Roman directly. Be concise.`;

const TOP_K = 4;
const SIMILARITY_THRESHOLD = 0.7;

export async function POST(request: Request): Promise<Response> {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  const { success } = await checkRateLimit(ip);
  if (!success) {
    return new Response('Too many requests', { status: 429 });
  }

  let history: ChatMessage[];
  let question: string;
  try {
    const body = (await request.json()) as { history: ChatMessage[]; question: string };
    history = body.history;
    question = body.question;
  } catch {
    return new Response('Invalid request body', { status: 400 });
  }

  let chunks: RagChunk[];
  try {
    const queryEmbedding = await embedQuery(question);
    chunks = retrieveTopChunks(
      queryEmbedding,
      embeddingsData as RagChunk[],
      TOP_K,
      SIMILARITY_THRESHOLD
    );
  } catch (err) {
    console.error('Failed to embed/retrieve for chat request:', err);
    return new Response('Failed to process request', { status: 502 });
  }

  if (chunks.length === 0) {
    return new Response(
      "I don't know based on what I have available about Worklog Studio. Feel free to contact Roman directly for anything else."
    );
  }

  const context = chunks.map((c) => `### ${c.heading}\n${c.text}`).join('\n\n');
  const systemInstruction = `${SYSTEM_INSTRUCTION}\n\nContext:\n${context}`;

  const stream = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of streamAnswer({ systemInstruction, history, question })) {
          controller.enqueue(new TextEncoder().encode(chunk));
        }
        controller.close();
      } catch (err) {
        controller.error(err);
      }
    },
  });

  return new Response(stream, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
}
