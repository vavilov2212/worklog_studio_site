import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import Hero from './Hero';
import { ReleaseProvider } from './ReleaseContext';
import { TimerProvider } from './TimerContext';

function renderHero() {
  return render(
    <ReleaseProvider>
      <TimerProvider>
        <Hero />
      </TimerProvider>
    </ReleaseProvider>
  );
}

function stubRelease(assets: Array<{ name: string; browser_download_url: string }>, tag = 'v1.0.9') {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ tag_name: tag, assets }),
    })
  );
}

describe('Hero', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('shows the Mac primary CTA and Windows secondary CTA when both assets exist and Mac is detected', async () => {
    vi.stubGlobal('navigator', { userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', platform: 'MacIntel' });
    stubRelease([
      { name: 'worklog_studio_macos_1.0.9.zip', browser_download_url: 'https://example.com/mac.zip' },
      { name: 'worklog_studio_windows_1.0.9.zip', browser_download_url: 'https://example.com/win.zip' },
    ]);

    renderHero();

    const primaryLinks = await screen.findAllByRole('link', { name: 'Get Worklog for Mac' }, { timeout: 5000 });
    expect(primaryLinks.length).toBeGreaterThan(0);
    primaryLinks.forEach((link) => expect(link).toHaveAttribute('href', 'https://example.com/mac.zip'));

    const secondaryLinks = await screen.findAllByRole('link', { name: 'Also available for Windows' }, { timeout: 5000 });
    expect(secondaryLinks.length).toBeGreaterThan(0);
    secondaryLinks.forEach((link) => expect(link).toHaveAttribute('href', 'https://example.com/win.zip'));
  });

  it('does not render a secondary link when the OS is unrecognized', async () => {
    vi.stubGlobal('navigator', { userAgent: 'Mozilla/5.0 (X11; Linux x86_64)', platform: 'Linux x86_64' });
    stubRelease([
      { name: 'worklog_studio_macos_1.0.9.zip', browser_download_url: 'https://example.com/mac.zip' },
      { name: 'worklog_studio_windows_1.0.9.zip', browser_download_url: 'https://example.com/win.zip' },
    ]);

    renderHero();

    const primaryLinks = await screen.findAllByRole('link', { name: 'Get Worklog' }, { timeout: 5000 });
    expect(primaryLinks.length).toBeGreaterThan(0);
    primaryLinks.forEach((link) => expect(link).toHaveAttribute('href', 'https://github.com/vavilov2212/wl-studio/releases/latest'));

    await waitFor(
      () => {
        expect(screen.queryByText('Also available for Mac')).not.toBeInTheDocument();
        expect(screen.queryByText('Also available for Windows')).not.toBeInTheDocument();
      },
      { timeout: 5000 }
    );
  });

  it('does not render a secondary link when the secondary asset is missing', async () => {
    vi.stubGlobal('navigator', { userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', platform: 'MacIntel' });
    stubRelease([{ name: 'worklog_studio_macos_1.0.9.zip', browser_download_url: 'https://example.com/mac.zip' }]);

    renderHero();

    const primaryLinks = await screen.findAllByRole('link', { name: 'Get Worklog for Mac' }, { timeout: 5000 });
    expect(primaryLinks.length).toBeGreaterThan(0);

    await waitFor(
      () => {
        expect(screen.queryByText('Also available for Windows')).not.toBeInTheDocument();
      },
      { timeout: 5000 }
    );
  });
});
