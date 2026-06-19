import { describe, it, expect, vi, afterEach } from 'vitest';
import { fetchLatestRelease, getPlatformLinks, RELEASES_URL, FALLBACK_RELEASE, type ReleaseInfo } from './release';

describe('fetchLatestRelease', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('matches macos and windows assets by name', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        tag_name: 'v1.0.9',
        assets: [
          { name: 'worklog_studio_macos_1.0.9.zip', browser_download_url: 'https://example.com/mac.zip' },
          { name: 'worklog_studio_windows_1.0.9.zip', browser_download_url: 'https://example.com/win.zip' },
        ],
      }),
    }));

    const result = await fetchLatestRelease();

    expect(result).toEqual<ReleaseInfo>({
      version: 'v1.0.9',
      macUrl: 'https://example.com/mac.zip',
      windowsUrl: 'https://example.com/win.zip',
      releasesUrl: RELEASES_URL,
    });
  });

  it('falls back when the response is not ok', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false }));
    expect(await fetchLatestRelease()).toEqual(FALLBACK_RELEASE);
  });

  it('falls back when fetch throws', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network error')));
    expect(await fetchLatestRelease()).toEqual(FALLBACK_RELEASE);
  });

  it('falls back to null urls when an asset is missing', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        tag_name: 'v1.0.9',
        assets: [{ name: 'worklog_studio_macos_1.0.9.zip', browser_download_url: 'https://example.com/mac.zip' }],
      }),
    }));

    const result = await fetchLatestRelease();
    expect(result.macUrl).toBe('https://example.com/mac.zip');
    expect(result.windowsUrl).toBeNull();
  });
});

describe('getPlatformLinks', () => {
  const release: ReleaseInfo = {
    version: 'v1.0.9',
    macUrl: 'https://example.com/mac.zip',
    windowsUrl: 'https://example.com/win.zip',
    releasesUrl: RELEASES_URL,
  };

  it('puts the detected OS first with the other as secondary', () => {
    expect(getPlatformLinks('mac', release)).toEqual({
      primaryOS: 'mac',
      primaryUrl: 'https://example.com/mac.zip',
      secondaryOS: 'windows',
      secondaryUrl: 'https://example.com/win.zip',
    });

    expect(getPlatformLinks('windows', release)).toEqual({
      primaryOS: 'windows',
      primaryUrl: 'https://example.com/win.zip',
      secondaryOS: 'mac',
      secondaryUrl: 'https://example.com/mac.zip',
    });
  });

  it('falls back to the releases page with no secondary for unrecognized OS', () => {
    expect(getPlatformLinks('other', release)).toEqual({
      primaryOS: null,
      primaryUrl: RELEASES_URL,
      secondaryOS: null,
      secondaryUrl: null,
    });
  });

  it('drops the secondary link when that asset is missing', () => {
    const macOnly: ReleaseInfo = { ...release, windowsUrl: null };
    expect(getPlatformLinks('mac', macOnly)).toEqual({
      primaryOS: 'mac',
      primaryUrl: 'https://example.com/mac.zip',
      secondaryOS: null,
      secondaryUrl: null,
    });
  });

  it('falls back the primary to the releases page when its own asset is missing', () => {
    const noMac: ReleaseInfo = { ...release, macUrl: null };
    expect(getPlatformLinks('mac', noMac)).toEqual({
      primaryOS: null,
      primaryUrl: RELEASES_URL,
      secondaryOS: 'windows',
      secondaryUrl: 'https://example.com/win.zip',
    });
  });
});
