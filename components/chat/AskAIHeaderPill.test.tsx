import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ChatProvider, useChat } from './ChatContext';
import AskAIHeaderPill from './AskAIHeaderPill';

function OpenStateProbe() {
  const { isOpen } = useChat();
  return <span data-testid="open">{String(isOpen)}</span>;
}

beforeEach(() => {
  sessionStorage.clear();
});

describe('AskAIHeaderPill', () => {
  it('renders the "Ask AI" label, not icon-only', () => {
    render(
      <ChatProvider>
        <AskAIHeaderPill />
      </ChatProvider>
    );
    expect(screen.getByText('Ask AI')).toBeInTheDocument();
  });

  it('opens the chat when clicked', () => {
    render(
      <ChatProvider>
        <AskAIHeaderPill />
        <OpenStateProbe />
      </ChatProvider>
    );
    fireEvent.click(screen.getByRole('button', { name: /ask ai/i }));
    expect(screen.getByTestId('open')).toHaveTextContent('true');
  });
});
