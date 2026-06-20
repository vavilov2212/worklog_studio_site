'use client';

import { Sparkles } from 'lucide-react';
import { useChat } from './ChatContext';
import ChatPanel from './ChatPanel';
import { SUGGESTED_PROMPTS } from './suggestedPrompts';
import SuggestedPromptChips from './SuggestedPromptChips';

export default function AskAISection() {
  const { messages, sendMessage } = useChat();
  const expanded = messages.length > 0;

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const input = e.currentTarget.elements.namedItem('question') as HTMLTextAreaElement;
    if (!input.value.trim()) return;
    void sendMessage(input.value.trim());
    input.value = '';
    input.style.height = 'auto';
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      e.currentTarget.form?.requestSubmit();
    }
  };

  const handleInput = (e: React.FormEvent<HTMLTextAreaElement>) => {
    const textarea = e.currentTarget;
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
  };

  return (
    <section className="max-w-3xl mx-auto px-6 md:px-8 pt-8 md:pt-12 pb-16 md:pb-24">
      <div className="bg-white border border-border rounded-[2rem] shadow-xl overflow-hidden">
        {!expanded ? (
          <form
            role="form"
            aria-label="Ask the assistant a question"
            onSubmit={handleSubmit}
            className="p-6 md:p-8 text-center"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 text-accent text-xs font-bold tracking-wider uppercase mb-4 border border-accent/20">
              <Sparkles className="w-3.5 h-3.5" />
              Ask AI
            </div>
            <h3 className="text-xl md:text-2xl font-extrabold text-ink mb-2">Ask about Worklog Studio</h3>
            <p className="text-slate text-sm mb-6">
              Get instant answers about features, the roadmap, or the author.
            </p>
            <textarea
              name="question"
              placeholder="Ask anything..."
              rows={1}
              autoComplete="off"
              data-1p-ignore
              data-lpignore="true"
              data-bwignore
              onKeyDown={handleKeyDown}
              onInput={handleInput}
              className="no-scrollbar w-full resize-none text-sm bg-subtle border border-border rounded-xl px-4 py-3 text-center focus:outline-none focus:border-accent/40 max-h-[120px] overflow-y-auto"
            />
            <SuggestedPromptChips
              prompts={SUGGESTED_PROMPTS}
              onSelect={(prompt) => void sendMessage(prompt)}
              variant="hero"
            />
          </form>
        ) : (
          <div className="h-[480px]">
            <ChatPanel />
          </div>
        )}
      </div>
    </section>
  );
}
