'use client';

import { useEffect, useRef, useState } from 'react';
import { Send, Square } from 'lucide-react';
import { useChat } from './ChatContext';
import { SUGGESTED_PROMPTS } from './suggestedPrompts';
import SuggestedPromptChips from './SuggestedPromptChips';

const MAX_TEXTAREA_HEIGHT = 120;

function TypingDots() {
  return (
    <span className="flex items-center gap-1 py-0.5" aria-label="Assistant is typing">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="w-1.5 h-1.5 rounded-full bg-slate/50 animate-bounce"
          style={{ animationDelay: `${i * 0.15}s` }}
        />
      ))}
    </span>
  );
}

export default function ChatPanel() {
  const { messages, isStreaming, sendMessage, stopStreaming } = useChat();
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(textarea.scrollHeight, MAX_TEXTAREA_HEIGHT)}px`;
  }, [input]);

  const submitQuestion = () => {
    if (isStreaming) {
      stopStreaming();
      return;
    }
    if (!input.trim()) return;
    const question = input.trim();
    setInput('');
    void sendMessage(question);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitQuestion();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submitQuestion();
    }
  };

  const lastMessage = messages[messages.length - 1];
  const isThinking = isStreaming && lastMessage?.role === 'assistant' && lastMessage.content === '';
  const lastUserQuestion = [...messages].reverse().find((m) => m.role === 'user')?.content;

  return (
    <div className="flex flex-col h-full bg-white">
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 flex flex-col">
        {messages.map((message, i) => (
          <div
            key={i}
            className={`text-sm rounded-2xl px-4 py-2.5 max-w-[85%] whitespace-pre-wrap ${
              message.role === 'user'
                ? 'bg-accent text-white ml-auto'
                : 'bg-subtle text-ink border border-border'
            }`}
          >
            {isThinking && i === messages.length - 1 ? <TypingDots /> : message.content}
          </div>
        ))}

        <div className={messages.length === 0 ? 'mt-auto' : undefined}>
          <SuggestedPromptChips
            prompts={SUGGESTED_PROMPTS}
            onSelect={(prompt) => void sendMessage(prompt)}
            disabled={isStreaming}
            activePrompt={lastUserQuestion}
            variant="panel"
          />
        </div>
      </div>

      <form
        role="form"
        aria-label="Ask the assistant a question"
        onSubmit={handleSubmit}
        className="flex items-end gap-2 p-3 border-t border-border"
      >
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask anything..."
          rows={1}
          autoComplete="off"
          data-1p-ignore
          data-lpignore="true"
          data-bwignore
          className="no-scrollbar flex-1 resize-none text-sm bg-subtle border border-border rounded-xl px-3 py-2 focus:outline-none focus:border-accent/40 max-h-[120px] overflow-y-auto"
        />
        <button
          type="submit"
          disabled={!input.trim() && !isStreaming}
          className="w-9 h-9 shrink-0 rounded-xl bg-accent text-white flex items-center justify-center disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
        >
          {isStreaming ? <Square className="w-4 h-4" /> : <Send className="w-4 h-4" />}
        </button>
      </form>
    </div>
  );
}
