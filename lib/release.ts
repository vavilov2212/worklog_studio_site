import type { DetectedOS } from './detectOS';

export interface ReleaseInfo {
  version: string;
  macUrl: string | null;
  windowsUrl: string | null;
  releasesUrl: string;
}

const REPO = 'vavilov2212/wl-studio';

export const RELEASES_URL = `https://github.com/${REPO}/releases/latest`;

export const FALLBACK_RELEASE: ReleaseInfo = {
  version: 'v1.2',
  macUrl: null,
  windowsUrl: null,
  releasesUrl: RELEASES_URL,
};

interface GithubAsset {
  name: string;
  browser_download_url: string;
}

interface GithubRelease {
  tag_name?: string;
  assets?: GithubAsset[];
}

export async function fetchLatestRelease(): Promise<ReleaseInfo> {
  try {
    const response = await fetch(`https://api.github.com/repos/${REPO}/releases/latest`);
    if (!response.ok) return FALLBACK_RELEASE;

    const data: GithubRelease = await response.json();
    const assets = data.assets ?? [];

    return {
      version: data.tag_name ?? FALLBACK_RELEASE.version,
      macUrl: assets.find((a) => /macos/i.test(a.name))?.browser_download_url ?? null,
      windowsUrl: assets.find((a) => /windows/i.test(a.name))?.browser_download_url ?? null,
      releasesUrl: RELEASES_URL,
    };
  } catch {
    return FALLBACK_RELEASE;
  }
}

export interface PlatformLinks {
  primaryOS: 'mac' | 'windows' | null;
  primaryUrl: string;
  secondaryOS: 'mac' | 'windows' | null;
  secondaryUrl: string | null;
}

export function getPlatformLinks(os: DetectedOS, release: ReleaseInfo): PlatformLinks {
  if (os !== 'mac' && os !== 'windows') {
    return { primaryOS: null, primaryUrl: release.releasesUrl, secondaryOS: null, secondaryUrl: null };
  }

  const secondaryOSCandidate: 'mac' | 'windows' = os === 'mac' ? 'windows' : 'mac';
  const primaryAssetUrl = os === 'mac' ? release.macUrl : release.windowsUrl;
  const secondaryAssetUrl = secondaryOSCandidate === 'mac' ? release.macUrl : release.windowsUrl;

  return {
    primaryOS: primaryAssetUrl ? os : null,
    primaryUrl: primaryAssetUrl ?? release.releasesUrl,
    secondaryOS: secondaryAssetUrl ? secondaryOSCandidate : null,
    secondaryUrl: secondaryAssetUrl,
  };
}
