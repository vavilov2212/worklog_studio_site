'use client';

import { motion } from 'motion/react';
import { Sparkles } from 'lucide-react';
import { useChat } from './ChatContext';

export default function AskAIHeaderPill() {
  const { openChat } = useChat();

  return (
    <motion.button
      type="button"
      onClick={openChat}
      aria-label="Ask AI"
      className="flex items-center gap-1.5 text-sm font-bold text-accent hover:text-accent/80 transition-colors px-2.5 py-1.5 rounded-full"
      animate={{
        boxShadow: [
          '0 0 0 0 rgba(37, 99, 235, 0)',
          '0 0 0 6px rgba(37, 99, 235, 0.15)',
          '0 0 0 0 rgba(37, 99, 235, 0)',
        ],
      }}
      transition={{
        duration: 1.2,
        repeat: Infinity,
        repeatDelay: 8,
        ease: 'easeOut',
      }}
    >
      <Sparkles className="w-4 h-4" />
      <span>Ask AI</span>
    </motion.button>
  );
}
