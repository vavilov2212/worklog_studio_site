import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ChatProvider } from './ChatContext';
import AskAISection from './AskAISection';

beforeEach(() => {
  sessionStorage.clear();
  global.fetch = vi.fn().mockResolvedValue({
    ok: true,
    body: { getReader: () => ({ read: vi.fn().mockResolvedValue({ done: true, value: undefined }) }) },
  }) as unknown as typeof fetch;
});

describe('AskAISection', () => {
  it('renders a collapsed input by default', () => {
    render(
      <ChatProvider>
        <AskAISection />
      </ChatProvider>
    );
    expect(screen.getByPlaceholderText(/ask anything/i)).toBeInTheDocument();
  });

  it('expands into the full panel after submitting a question', () => {
    render(
      <ChatProvider>
        <AskAISection />
      </ChatProvider>
    );
    const input = screen.getByPlaceholderText(/ask anything/i);
    fireEvent.change(input, { target: { value: 'What is this?' } });
    fireEvent.submit(screen.getByRole('form'));
    expect(screen.getByText('What is this?')).toBeInTheDocument();
  });
});
