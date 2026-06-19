// components/chat/ChatContext.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { ChatProvider, useChat } from './ChatContext';

function TestConsumer() {
  const { messages, isOpen, openChat, closeChat } = useChat();
  return (
    <div>
      <span data-testid="open">{String(isOpen)}</span>
      <span data-testid="count">{messages.length}</span>
      <button onClick={openChat}>open</button>
      <button onClick={closeChat}>close</button>
    </div>
  );
}

beforeEach(() => {
  sessionStorage.clear();
});

describe('ChatProvider', () => {
  it('starts closed with no messages', () => {
    render(
      <ChatProvider>
        <TestConsumer />
      </ChatProvider>
    );
    expect(screen.getByTestId('open')).toHaveTextContent('false');
    expect(screen.getByTestId('count')).toHaveTextContent('0');
  });

  it('opens and closes via openChat/closeChat', async () => {
    render(
      <ChatProvider>
        <TestConsumer />
      </ChatProvider>
    );
    await act(async () => screen.getByText('open').click());
    expect(screen.getByTestId('open')).toHaveTextContent('true');
    await act(async () => screen.getByText('close').click());
    expect(screen.getByTestId('open')).toHaveTextContent('false');
  });

  it('throws when useChat is used outside a ChatProvider', () => {
    function Bare() {
      useChat();
      return null;
    }
    expect(() => render(<Bare />)).toThrow('useChat must be used within a ChatProvider');
  });
});
