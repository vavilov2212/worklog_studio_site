'use client';

import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import type { ChatMessage } from '@/lib/rag/types';

const STORAGE_KEY = 'worklog-chat-history';

interface ChatContextType {
  messages: ChatMessage[];
  isOpen: boolean;
  isStreaming: boolean;
  openChat: () => void;
  closeChat: () => void;
  sendMessage: (question: string) => Promise<void>;
  stopStreaming: () => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

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

      const controller = new AbortController();
      abortControllerRef.current = controller;

      const setLastAssistantContent = (build: (current: string) => string) => {
        setMessages((prev) => {
          const next = [...prev];
          const current = next[next.length - 1]?.content ?? '';
          next[next.length - 1] = { role: 'assistant', content: build(current) };
          return next;
        });
      };

      try {
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ history, question }),
          signal: controller.signal,
        });

        if (!res.ok) {
          throw new Error(`Request failed with status ${res.status}`);
        }

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
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') {
          setLastAssistantContent((current) => (current ? `${current}\n\n_Stopped._` : '_Response stopped._'));
        } else {
          setLastAssistantContent(() => 'Sorry, something went wrong while getting a response. Please try again.');
        }
      } finally {
        setIsStreaming(false);
        abortControllerRef.current = null;
      }
    },
    [messages]
  );

  const stopStreaming = useCallback(() => {
    abortControllerRef.current?.abort();
  }, []);

  return (
    <ChatContext.Provider value={{ messages, isOpen, isStreaming, openChat, closeChat, sendMessage, stopStreaming }}>
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
