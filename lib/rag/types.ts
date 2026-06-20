export interface RagChunk {
  id: string;
  source: string;
  heading: string;
  text: string;
  embedding: number[];
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}
