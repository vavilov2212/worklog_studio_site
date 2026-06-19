import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { ChatProvider } from './ChatContext';
import ChatPanel from './ChatPanel';

beforeEach(() => {
  sessionStorage.clear();
  global.fetch = vi.fn().mockResolvedValue({
    ok: true,
    body: {
      getReader: () => ({
        read: vi
          .fn()
          .mockResolvedValueOnce({ done: false, value: new TextEncoder().encode('Hi there') })
          .mockResolvedValueOnce({ done: true, value: undefined }),
      }),
    },
  }) as unknown as typeof fetch;
});

describe('ChatPanel', () => {
  it('shows suggested prompt chips when there are no messages', () => {
    render(
      <ChatProvider>
        <ChatPanel />
      </ChatProvider>
    );
    expect(screen.getByText(/integrations are planned/i)).toBeInTheDocument();
  });

  it('sends a question and renders the streamed answer', async () => {
    render(
      <ChatProvider>
        <ChatPanel />
      </ChatProvider>
    );
    const input = screen.getByPlaceholderText(/ask anything/i);
    fireEvent.change(input, { target: { value: 'What is Worklog Studio?' } });
    await act(async () => {
      fireEvent.submit(screen.getByRole('form'));
    });
    expect(screen.getByText('What is Worklog Studio?')).toBeInTheDocument();
    expect(screen.getByText('Hi there')).toBeInTheDocument();
  });

  it('shows only the first three suggested prompts by default', () => {
    render(
      <ChatProvider>
        <ChatPanel />
      </ChatProvider>
    );
    expect(screen.getByText('What does Frictionless Tracking mean?')).toBeInTheDocument();
    expect(screen.queryByText('Is Focus Analytics available yet?')).not.toBeInTheDocument();
  });
});
