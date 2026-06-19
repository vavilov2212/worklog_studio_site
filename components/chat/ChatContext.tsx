'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import type { ChatMessage } from '@/lib/rag/types';

const STORAGE_KEY = 'worklog-chat-history';

interface ChatContextType {
  messages: ChatMessage[];
  isOpen: boolean;
  isStreaming: boolean;
  openChat: () => void;
  closeChat: () => void;
  sendMessage: (question: string) => Promise<void>;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);

  useEffect(() => {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    if (stored) setMessages(JSON.parse(stored));
  }, []);

  useEffect(() => {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
  }, [messages]);

  const openChat = useCallback(() => setIsOpen(true), []);
  const closeChat = useCallback(() => setIsOpen(false), []);

  const sendMessage = useCallback(
    async (question: string) => {
      const history = messages;
      setMessages((prev) => [...prev, { role: 'user', content: question }, { role: 'assistant', content: '' }]);
      setIsStreaming(true);

      try {
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ history, question }),
        });

        const reader = res.body?.getReader();
        const decoder = new TextDecoder();
        if (reader) {
          let done = false;
          while (!done) {
            const result = await reader.read();
            done = result.done;
            if (result.value) {
              const text = decoder.decode(result.value);
              setMessages((prev) => {
                const next = [...prev];
                next[next.length - 1] = {
                  role: 'assistant',
                  content: next[next.length - 1].content + text,
                };
                return next;
              });
            }
          }
        }
      } finally {
        setIsStreaming(false);
      }
    },
    [messages]
  );

  return (
    <ChatContext.Provider value={{ messages, isOpen, isStreaming, openChat, closeChat, sendMessage }}>
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
}
