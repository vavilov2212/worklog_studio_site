import { describe, it, expect, afterEach, vi } from 'vitest';
import { detectOS } from './detectOS';

describe('detectOS', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('detects mac from userAgent', () => {
    vi.stubGlobal('navigator', { userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', platform: 'MacIntel' });
    expect(detectOS()).toBe('mac');
  });

  it('detects windows from userAgent', () => {
    vi.stubGlobal('navigator', { userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', platform: 'Win32' });
    expect(detectOS()).toBe('windows');
  });

  it('returns other for unrecognized platforms', () => {
    vi.stubGlobal('navigator', { userAgent: 'Mozilla/5.0 (X11; Linux x86_64)', platform: 'Linux x86_64' });
    expect(detectOS()).toBe('other');
  });
});
