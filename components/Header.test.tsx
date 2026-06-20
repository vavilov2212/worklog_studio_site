import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Header from './Header';
import { ReleaseProvider } from './ReleaseContext';
import { ChatProvider } from './chat/ChatContext';

function renderHeader() {
  return render(
    <ReleaseProvider>
      <ChatProvider>
        <Header />
      </ChatProvider>
    </ReleaseProvider>
  );
}

beforeEach(() => {
  sessionStorage.clear();
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({ ok: true, json: async () => ({ tag_name: 'v1.0.9', assets: [] }) })
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('Header mobile menu', () => {
  it('does not render the mobile menu panel by default', () => {
    renderHeader();
    expect(screen.queryByRole('link', { name: 'GitHub' })).not.toBeInTheDocument();
  });

  it('opens the mobile menu panel when the hamburger button is clicked', () => {
    renderHeader();
    fireEvent.click(screen.getByRole('button', { name: /menu/i }));
    expect(screen.getByRole('link', { name: 'GitHub' })).toBeInTheDocument();
  });

  it('closes the mobile menu panel after clicking a link inside it', async () => {
    renderHeader();
    fireEvent.click(screen.getByRole('button', { name: /menu/i }));
    fireEvent.click(screen.getByRole('link', { name: 'GitHub' }));
    await waitFor(() => {
      expect(screen.queryByRole('link', { name: 'GitHub' })).not.toBeInTheDocument();
    });
  });
});
