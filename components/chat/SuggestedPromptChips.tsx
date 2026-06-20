'use client';

import { useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';

const DEFAULT_VISIBLE_COUNT = 3;

export default function SuggestedPromptChips({
  prompts,
  onSelect,
  disabled = false,
  activePrompt,
  variant,
}: {
  prompts: string[];
  onSelect: (prompt: string) => void;
  disabled?: boolean;
  activePrompt?: string;
  variant: 'hero' | 'panel';
}) {
  const [expanded, setExpanded] = useState(false);
  const [recentlyAsked, setRecentlyAsked] = useState<string[]>([]);

  const handleSelect = (prompt: string) => {
    setRecentlyAsked((prev) => [prompt, ...prev.filter((p) => p !== prompt)].slice(0, DEFAULT_VISIBLE_COUNT));
    setExpanded(false);
    onSelect(prompt);
  };

  const hasMore = prompts.length > DEFAULT_VISIBLE_COUNT;
  const pinned = recentlyAsked.filter((p) => prompts.includes(p));
  const fillers = prompts.filter((p) => !pinned.includes(p));
  const collapsedPrompts = [...pinned, ...fillers].slice(0, DEFAULT_VISIBLE_COUNT);
  const visiblePrompts = expanded ? prompts : collapsedPrompts;

  return (
    <div>
      <div className={variant === 'hero' ? 'flex flex-wrap justify-center gap-2 mt-4' : 'flex flex-wrap gap-2 pt-1'}>
        {visiblePrompts.map((prompt) => {
          const justAsked = variant === 'panel' && prompt === activePrompt;
          return (
            <button
              key={prompt}
              type="button"
              onClick={() => handleSelect(prompt)}
              disabled={disabled}
              className={
                variant === 'hero'
                  ? 'text-xs font-medium text-accent bg-accent/10 border border-accent/20 rounded-full px-3 py-1.5 hover:bg-accent/20 transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-60'
                  : `text-xs font-medium rounded-full px-3 py-1.5 border transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-60 flex items-center gap-1.5 ${
                      justAsked
                        ? 'text-accent bg-accent/15 border-accent/40'
                        : 'text-accent bg-accent/10 border-accent/20 hover:bg-accent/20'
                    }`
              }
            >
              {justAsked && <Check className="w-3 h-3" />}
              {prompt}
            </button>
          );
        })}
      </div>
      {hasMore && (
        <div className={`flex mt-2 ${variant === 'hero' ? 'justify-center' : ''}`}>
          <button
            type="button"
            onClick={() => setExpanded((prev) => !prev)}
            aria-expanded={expanded}
            className="flex items-center gap-1 text-xs font-medium text-slate hover:text-ink transition-colors cursor-pointer"
          >
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${expanded ? 'rotate-180' : ''}`} />
            {expanded ? 'Show less' : `Show more (+${prompts.length - DEFAULT_VISIBLE_COUNT})`}
          </button>
        </div>
      )}
    </div>
  );
}
