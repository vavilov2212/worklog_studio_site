'use client';

import { useState } from 'react';
import { Send, Square } from 'lucide-react';
import { useChat } from './ChatContext';

const SUGGESTED_PROMPTS = [
  'What integrations are planned?',
  'Tell me about the author',
  'What does Frictionless Tracking mean?',
];

export default function ChatPanel() {
  const { messages, isStreaming, sendMessage } = useChat();
  const [input, setInput] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isStreaming) return;
    const question = input.trim();
    setInput('');
    void sendMessage(question);
  };

  const lastMessage = messages[messages.length - 1];
  const isThinking = isStreaming && lastMessage?.role === 'assistant' && lastMessage.content === '';

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="flex flex-wrap gap-2">
            {SUGGESTED_PROMPTS.map((prompt) => (
              <button
                key={prompt}
                type="button"
                onClick={() => void sendMessage(prompt)}
                className="text-xs font-medium text-accent bg-accent/10 border border-accent/20 rounded-full px-3 py-1.5 hover:bg-accent/20 transition-colors"
              >
                {prompt}
              </button>
            ))}
          </div>
        )}

        {messages.map((message, i) => (
          <div
            key={i}
            className={`text-sm rounded-2xl px-4 py-2.5 max-w-[85%] ${
              message.role === 'user'
                ? 'bg-accent text-white ml-auto'
                : 'bg-subtle text-ink border border-border'
            }`}
          >
            {message.content || (isThinking && i === messages.length - 1 ? '...' : '')}
          </div>
        ))}
      </div>

      <form
        role="form"
        aria-label="Ask the assistant a question"
        onSubmit={handleSubmit}
        className="flex items-center gap-2 p-3 border-t border-border"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask anything..."
          className="flex-1 text-sm bg-subtle border border-border rounded-xl px-3 py-2 focus:outline-none focus:border-accent/40"
        />
        <button
          type="submit"
          disabled={!input.trim() && !isStreaming}
          className="w-9 h-9 rounded-xl bg-accent text-white flex items-center justify-center disabled:opacity-40"
        >
          {isStreaming ? <Square className="w-4 h-4" /> : <Send className="w-4 h-4" />}
        </button>
      </form>
    </div>
  );
}
