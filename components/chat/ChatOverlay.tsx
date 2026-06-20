'use client';

import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';
import { useChat } from './ChatContext';
import ChatPanel from './ChatPanel';

export default function ChatOverlay() {
  const { isOpen, closeChat } = useChat();

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: -10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -10 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="fixed inset-x-0 top-20 bottom-0 md:inset-x-auto md:bottom-auto md:right-8 z-50 w-full md:w-[380px] h-auto md:h-[560px] bg-white rounded-t-2xl md:rounded-2xl border-t md:border border-border shadow-2xl overflow-hidden"
        >
          <button
            type="button"
            onClick={closeChat}
            aria-label="Close chat"
            className="absolute top-3 right-3 z-10 p-1.5 rounded-full bg-white/80 text-slate hover:text-ink cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
          <ChatPanel />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
