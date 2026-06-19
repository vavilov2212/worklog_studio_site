# Multi-Platform Release Support Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the landing page's download links resolve to real, OS-appropriate release assets for both macOS and Windows, and update Roadmap copy to reflect that both platforms have shipped.

**Architecture:** A pure-logic data layer (`lib/release.ts`, `lib/detectOS.ts`) fetches the latest GitHub release once and matches assets to platforms; a React context (`ReleaseContext`) shares that fetch across Header/Hero/Download so each component just reads `{ primaryUrl, primaryOS, secondaryUrl, secondaryOS }` and renders its own labels/icons.

**Tech Stack:** Next.js 15 (App Router), React 19, TypeScript (strict), Tailwind CSS v4, `motion/react`, `lucide-react`, Vitest + Testing Library (jsdom).

## Global Constraints

- Canonical repo is `vavilov2212/wl-studio` — every link currently pointing at `vavilov2212/worklog_studio` must be updated.
- Never hardcode a release asset filename — asset names include the version (e.g. `worklog_studio_macos_1.0.9.zip`), so links must be resolved dynamically via the GitHub releases API.
- If an asset can't be resolved (fetch fails, asset missing), fall back to the releases page (`https://github.com/vavilov2212/wl-studio/releases/latest`) with a neutral label — never link to a guessed/broken URL.
- Roadmap "Advanced Analytics" status must read "Planned", not "In Progress" — no analytics work has started.
- Hero viewport-fit changes must only affect `lg:`-width screens with `max-height: 820px` — no change to mobile, tablet, or tall-desktop layouts.
- No test runner conventions exist yet for components in this repo; Vitest (jsdom) is configured (`vitest.config.ts`, `npm test`) but only used for pure-logic modules so far — write unit tests for the new pure functions in `lib/`, and verify component changes manually via the dev server (no existing component test harness to extend).

---

### Task 1: `detectOS` helper

**Files:**
- Create: `lib/detectOS.ts`
- Test: `lib/detectOS.test.ts`

**Interfaces:**
- Produces: `export type DetectedOS = 'mac' | 'windows' | 'other'` and `export function detectOS(): DetectedOS` — used by Task 3 (ReleaseContext consumers) and any component reading the visitor's platform.

- [ ] **Step 1: Write the failing test**

```ts
// lib/detectOS.test.ts
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run lib/detectOS.test.ts`
Expected: FAIL with "Cannot find module './detectOS'" (file doesn't exist yet)

- [ ] **Step 3: Write the implementation**

```ts
// lib/detectOS.ts
export type DetectedOS = 'mac' | 'windows' | 'other';

export function detectOS(): DetectedOS {
  if (typeof navigator === 'undefined') return 'other';
  const ua = `${navigator.userAgent ?? ''} ${navigator.platform ?? ''}`.toLowerCase();
  if (ua.includes('mac')) return 'mac';
  if (ua.includes('win')) return 'windows';
  return 'other';
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run lib/detectOS.test.ts`
Expected: PASS (3 tests)

- [ ] **Step 5: Commit**

```bash
git add lib/detectOS.ts lib/detectOS.test.ts
git commit -m "feat: add client-side OS detection helper"
```

---

### Task 2: Release data layer

**Files:**
- Create: `lib/release.ts`
- Test: `lib/release.test.ts`

**Interfaces:**
- Consumes: `DetectedOS` from `lib/detectOS.ts` (Task 1).
- Produces:
  - `export interface ReleaseInfo { version: string; macUrl: string | null; windowsUrl: string | null; releasesUrl: string }`
  - `export const RELEASES_URL: string`
  - `export const FALLBACK_RELEASE: ReleaseInfo`
  - `export async function fetchLatestRelease(): Promise<ReleaseInfo>`
  - `export interface PlatformLinks { primaryOS: 'mac' | 'windows' | null; primaryUrl: string; secondaryOS: 'mac' | 'windows' | null; secondaryUrl: string | null }`
  - `export function getPlatformLinks(os: DetectedOS, release: ReleaseInfo): PlatformLinks`
  - Used by Task 3 (`ReleaseContext`) and Tasks 5–7 (Header, Hero, Download).

- [ ] **Step 1: Write the failing tests**

```ts
// lib/release.test.ts
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
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run lib/release.test.ts`
Expected: FAIL with "Cannot find module './release'"

- [ ] **Step 3: Write the implementation**

```ts
// lib/release.ts
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
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run lib/release.test.ts`
Expected: PASS (9 tests)

- [ ] **Step 5: Commit**

```bash
git add lib/release.ts lib/release.test.ts
git commit -m "feat: add release-fetching and platform-link resolution logic"
```

---

### Task 3: `ReleaseContext` and provider wiring

**Files:**
- Create: `components/ReleaseContext.tsx`
- Modify: `app/layout.tsx:18-29`

**Interfaces:**
- Consumes: `fetchLatestRelease`, `FALLBACK_RELEASE`, `ReleaseInfo` from `lib/release.ts` (Task 2).
- Produces: `export function ReleaseProvider({ children }: { children: React.ReactNode })` and `export function useRelease(): ReleaseInfo & { isLoading: boolean }` — consumed by Tasks 5, 6, 7 (Header, Hero, Download).

- [ ] **Step 1: Write the implementation**

Mirrors the existing `TimerProvider` pattern in `components/TimerContext.tsx` (mount-deferred fetch via `requestAnimationFrame`, single provider wrapping the app).

```tsx
// components/ReleaseContext.tsx
'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { fetchLatestRelease, FALLBACK_RELEASE, type ReleaseInfo } from '@/lib/release';

interface ReleaseContextType extends ReleaseInfo {
  isLoading: boolean;
}

const ReleaseContext = createContext<ReleaseContextType | undefined>(undefined);

export function ReleaseProvider({ children }: { children: React.ReactNode }) {
  const [release, setRelease] = useState<ReleaseInfo>(FALLBACK_RELEASE);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    requestAnimationFrame(() => {
      fetchLatestRelease().then((info) => {
        if (!cancelled) {
          setRelease(info);
          setIsLoading(false);
        }
      });
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <ReleaseContext.Provider value={{ ...release, isLoading }}>
      {children}
    </ReleaseContext.Provider>
  );
}

export function useRelease() {
  const context = useContext(ReleaseContext);
  if (context === undefined) {
    throw new Error('useRelease must be used within a ReleaseProvider');
  }
  return context;
}
```

- [ ] **Step 2: Wire the provider into the root layout**

In `app/layout.tsx`, add the import and wrap `TimerProvider`'s children:

```tsx
// app/layout.tsx:18-29
import { TimerProvider } from '@/components/TimerContext';
import { ChatProvider } from '@/components/chat/ChatContext';
import { ReleaseProvider } from '@/components/ReleaseContext';

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="font-sans bg-bg text-ink selection:bg-accent/30 selection:text-ink antialiased" suppressHydrationWarning>
        <ReleaseProvider>
          <TimerProvider>
            <ChatProvider>
              {children}
            </ChatProvider>
          </TimerProvider>
        </ReleaseProvider>
      </body>
    </html>
  );
}
```

- [ ] **Step 3: Manual verification**

Run: `npm run dev`, open the homepage, and confirm no console errors (the `useRelease` hook resolves without throwing — it will be exercised by Tasks 5–7's components in the meantime nothing consumes it yet, so just confirm the page still renders).

- [ ] **Step 4: Commit**

```bash
git add components/ReleaseContext.tsx app/layout.tsx
git commit -m "feat: add ReleaseProvider for shared release-data fetching"
```

---

### Task 4: Footer repo-link rename

**Files:**
- Modify: `components/Footer.tsx:28,35,43`

**Interfaces:** None — standalone string replacement, no shared state.

- [ ] **Step 1: Update the three stale repo links**

```tsx
// components/Footer.tsx:28
            <li><a href="https://github.com/vavilov2212/wl-studio/releases" target="_blank" rel="noopener noreferrer" className="hover:text-accent transition-colors">Changelog</a></li>
```

```tsx
// components/Footer.tsx:35
            <li><a href="https://github.com/vavilov2212/wl-studio" target="_blank" rel="noopener noreferrer" className="hover:text-accent transition-colors">GitHub</a></li>
```

```tsx
// components/Footer.tsx:43
          <a href="https://github.com/vavilov2212/wl-studio/blob/main/LICENSE" target="_blank" rel="noopener noreferrer" className="hover:text-accent transition-colors">License</a>
```

- [ ] **Step 2: Manual verification**

Run: `npm run dev`, scroll to the footer, hover/click each of the three links (or inspect `href` in devtools) and confirm they point at `wl-studio`.

- [ ] **Step 3: Commit**

```bash
git add components/Footer.tsx
git commit -m "fix: update footer links to renamed wl-studio repo"
```

---

### Task 5: Header OS-aware download CTA

**Files:**
- Modify: `components/Header.tsx`

**Interfaces:**
- Consumes: `useRelease()` (Task 3), `detectOS()` (Task 1), `getPlatformLinks()` (Task 2).

- [ ] **Step 1: Replace the static Mac-only link with an OS-aware one**

```tsx
// components/Header.tsx
'use client';

import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Logo } from './Logo';
import Link from 'next/link';
import { Github, Download } from 'lucide-react';
import AskAIHeaderPill from './chat/AskAIHeaderPill';
import ChatOverlay from './chat/ChatOverlay';
import { useRelease } from './ReleaseContext';
import { detectOS, type DetectedOS } from '@/lib/detectOS';
import { getPlatformLinks } from '@/lib/release';

export default function Header() {
  const release = useRelease();
  const [os, setOs] = useState<DetectedOS>('other');

  useEffect(() => {
    setOs(detectOS());
  }, []);

  const { primaryOS, primaryUrl } = getPlatformLinks(os, release);
  const label = primaryOS === 'mac' ? 'Download for Mac' : primaryOS === 'windows' ? 'Download for Windows' : 'Download';

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-xl duration-300 ease-out border-b border-border"
    >
      <div className="flex justify-between items-center max-w-7xl mx-auto px-6 md:px-8 py-3">
        <Link href="/">
          <Logo />
        </Link>
        <nav className="hidden md:flex items-center gap-10 font-sans tracking-tight text-sm font-medium">
          <Link href="#features" className="text-slate hover:text-ink transition-colors">Features</Link>
          <Link href="#roadmap" className="text-slate hover:text-ink transition-colors">Roadmap</Link>
        </nav>
        <div className="flex items-center gap-4 md:gap-6">
          <AskAIHeaderPill />
          <a
            href={primaryUrl}
            className="flex items-center gap-2 text-sm font-bold text-accent hover:text-accent/80 transition-colors p-2 sm:p-0"
            title={label}
          >
            <Download className="w-5 h-5 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline-block whitespace-nowrap">{label}</span>
          </a>
          <a
            href="https://github.com/vavilov2212/wl-studio"
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 text-slate hover:text-ink transition-colors"
            aria-label="GitHub Repository"
          >
            <Github className="w-5 h-5" />
          </a>
        </div>
      </div>
      <ChatOverlay />
    </motion.header>
  );
}
```

- [ ] **Step 2: Manual verification**

Run: `npm run dev`. In Chrome devtools, open the device toolbar and override `navigator.userAgent` (or just check on your actual OS), reload, and confirm the header label reads "Download for Mac" or "Download for Windows" and the link target matches (inspect element / right-click "copy link address"). Narrow the viewport to ~640px (the `sm` breakpoint) and confirm the label doesn't wrap or push the GitHub icon out of view.

- [ ] **Step 3: Commit**

```bash
git add components/Header.tsx
git commit -m "feat: make header download CTA OS-aware"
```

---

### Task 6: Hero OS-aware CTAs + viewport-fit fix

**Files:**
- Modify: `components/Hero.tsx`

**Interfaces:**
- Consumes: `useRelease()` (Task 3), `detectOS()` (Task 1), `getPlatformLinks()` (Task 2). Removes Hero's own local GitHub fetch (now redundant with `ReleaseProvider`).

- [ ] **Step 1: Replace the local version fetch with `useRelease`, add OS-aware CTAs, and apply the height-aware breakpoint**

```tsx
// components/Hero.tsx
'use client';

import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Download, Search, Square, Play, Plus, Monitor, ChevronDown, Copy, Circle } from 'lucide-react';
import { Logo } from './Logo';

import { useTimer } from './TimerContext';
import { useRelease } from './ReleaseContext';
import { detectOS, type DetectedOS } from '@/lib/detectOS';
import { getPlatformLinks } from '@/lib/release';

export default function Hero() {
  const { isRunning, time, toggleTimer, formatTime } = useTimer();
  const release = useRelease();
  const [os, setOs] = useState<DetectedOS>('other');

  useEffect(() => {
    setOs(detectOS());
  }, []);

  const { primaryOS, primaryUrl, secondaryOS, secondaryUrl } = getPlatformLinks(os, release);
  const primaryLabel = primaryOS === 'mac' ? 'Get Worklog for Mac' : primaryOS === 'windows' ? 'Get Worklog for Windows' : 'Get Worklog';
  const secondaryLabel = secondaryOS === 'mac' ? 'Also available for Mac' : secondaryOS === 'windows' ? 'Also available for Windows' : null;

  const handleToggleTimer = () => {
    toggleTimer();
  };

  return (
    <section className="max-w-7xl mx-auto px-6 md:px-8 pt-24 md:pt-48 lg:[@media(max-height:820px)]:pt-28 pb-16 md:pb-24 lg:[@media(max-height:820px)]:pb-12 relative overflow-hidden bg-bg">
      <div className="absolute top-0 right-0 -z-10 w-[600px] h-[600px] bg-accent/5 rounded-full blur-[120px]"></div>
      <div className="absolute bottom-0 left-0 -z-10 w-[400px] h-[400px] bg-accent/5 rounded-full blur-[100px]"></div>
      
      <div className="flex flex-col lg:grid lg:grid-cols-12 gap-12 lg:gap-20 lg:[@media(max-height:820px)]:gap-10 items-center">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="lg:col-span-6 w-full text-center lg:text-left order-1"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 text-accent text-[10px] md:text-xs font-bold tracking-wider uppercase mb-6 md:mb-8 lg:[@media(max-height:820px)]:mb-4 border border-accent/20">
            <Circle className="w-2 h-2 fill-current animate-pulse" />
            Live {release.version} Ready
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl lg:[@media(max-height:820px)]:text-7xl font-black font-sans tracking-tight text-ink leading-[1.1] lg:leading-[0.95] mb-6 md:mb-8 lg:[@media(max-height:820px)]:mb-4">
            The heart of <br className="hidden sm:block"/>
            <span className="text-accent underline decoration-accent/20 underline-offset-8">your flow.</span>
          </h1>
          <p className="text-base md:text-xl text-slate font-sans leading-relaxed mb-8 md:mb-10 lg:[@media(max-height:820px)]:mb-6 max-w-lg mx-auto lg:mx-0">
            A minimal, distraction-free desktop logger that helps you understand where your time actually goes. Designed for professionals who live in deep work.
          </p>

          <div className="hidden lg:flex flex-wrap gap-4 items-center">
            <a 
              href={primaryUrl}
              className="px-10 py-5 bg-accent text-white font-bold rounded-2xl hover:bg-accent/90 transition-all flex items-center gap-3 shadow-xl shadow-accent/20 active:scale-95"
            >
              <Download className="w-6 h-6" />
              {primaryLabel}
            </a>
            {secondaryUrl && secondaryLabel && (
              <a href={secondaryUrl} className="text-sm font-bold text-slate hover:text-accent transition-colors">
                {secondaryLabel}
              </a>
            )}
          </div>
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="lg:col-span-6 w-full lg:perspective-1000 order-2 lg:order-2"
        >
          <div className="relative bg-white rounded-[24px] md:rounded-[32px] overflow-hidden shadow-[0_40px_100px_-20px_rgba(0,0,0,0.15)] border border-border select-none lg:rotate-y-[-5deg]">
            {/* Widget Title Bar */}
            <div className="bg-white border-b border-border py-3 md:py-4 px-4 md:px-6 flex items-center justify-between pointer-events-none">
               <div className="flex items-center gap-2">
                  <h3 className="font-bold text-ink text-xs md:text-sm">Worklog Studio</h3>
               </div>
               <div className="flex items-center gap-4 text-slate">
                  <Plus className="w-3 md:w-4 h-3 md:h-4" />
                  <Monitor className="w-3 md:w-4 h-3 md:h-4" />
               </div>
            </div>

            <div className="p-4 md:p-6 space-y-4 md:space-y-6 bg-[#f8fafc]">
               {/* Search Bar - Non Interactive */}
               <div className="relative pointer-events-none">
                  <div className="w-full h-10 md:h-14 pl-4 md:pl-6 pr-10 md:pr-12 rounded-xl md:rounded-2xl bg-white border-2 border-accent/10 flex items-center">
                    <span className="text-slate/40 text-xs md:text-sm font-medium">Search or start a task...</span>
                  </div>
                  <div className="absolute right-4 md:right-6 top-1/2 -translate-y-1/2 p-1 md:p-1.5 bg-accent/5 rounded-lg">
                    <Search className="w-4 h-4 md:w-5 md:h-5 text-accent" />
                  </div>
               </div>

               {/* Active Session Card */}
               <div className="bg-white rounded-2xl md:rounded-3xl p-6 md:p-8 border border-border shadow-sm">
                  <div className="mb-4 text-center sm:text-left">
                     <span className="text-[9px] md:text-[10px] uppercase tracking-[0.2em] text-accent font-black">Active Session</span>
                     <h4 className="text-2xl md:text-3xl font-extrabold text-ink mt-2">Take a GAP test</h4>
                     <p className="text-slate text-sm md:text-base font-medium">Study AI</p>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-6 sm:gap-0 mt-6 md:mt-8">
                     <div suppressHydrationWarning className="text-4xl md:text-5xl font-mono font-bold tracking-tighter text-ink">{formatTime(time)}</div>
                     <button 
                       onClick={handleToggleTimer}
                       className={`w-14 h-14 md:w-16 md:h-16 rounded-xl md:rounded-2xl flex items-center justify-center shadow-lg transition-all active:scale-95 hover:scale-105 cursor-pointer ${isRunning ? 'bg-stop shadow-stop/20' : 'bg-accent shadow-accent/20'}`}
                     >
                        {isRunning ? (
                          <Square className="w-5 h-5 md:w-6 md:h-6 text-white fill-current" />
                        ) : (
                          <Play className="w-5 h-5 md:w-6 md:h-6 text-white fill-current ml-1" />
                        )}
                     </button>
                  </div>
               </div>

               {/* Recent Activity - Non Interactive */}
               <div className="bg-white/50 backdrop-blur-sm rounded-2xl md:rounded-3xl p-4 md:p-6 border border-border/50 pointer-events-none hidden sm:block">
                  <div className="flex items-center justify-between mb-4">
                     <span className="text-[9px] md:text-[10px] uppercase tracking-[0.2em] text-slate font-black">Recent Activity</span>
                     <span className="text-[9px] md:text-[10px] uppercase tracking-widest text-accent font-black">View All</span>
                  </div>
                  
                  <div className="flex items-center gap-4">
                     <Logo className="w-10 h-10 md:w-12 md:h-12" iconOnly />
                     <div>
                        <h5 className="font-bold text-ink text-xs md:text-sm">Take a GAP test</h5>
                        <p className="text-[10px] md:text-xs text-slate font-medium">Study AI</p>
                     </div>
                  </div>
               </div>
            </div>

            {/* Widget Footer - Non Interactive */}
            <div className="bg-[#eff6ff] border-t border-accent/10 md:px-8 py-3 md:py-5 flex items-center justify-center pointer-events-none">
               <p className="text-[10px] md:text-xs font-bold text-accent font-mono">
                  Today 06h 15m <span className="mx-1 md:mx-2 opacity-30">|</span> Total 24h 30m
               </p>
            </div>
          </div>
        </motion.div>

        {/* Mobile CTA Block - Order 3 */}
        <div className="lg:hidden w-full space-y-6 order-3">
          <a 
            href={primaryUrl}
            className="w-full py-5 bg-accent text-white font-bold rounded-2xl hover:bg-accent/90 transition-all flex items-center justify-center gap-3 shadow-xl shadow-accent/20 active:scale-95"
          >
            <Download className="w-6 h-6" />
            {primaryLabel}
          </a>
          {secondaryUrl && secondaryLabel && (
            <div className="flex justify-center">
              <a href={secondaryUrl} className="text-sm font-bold text-slate hover:text-accent transition-colors">
                {secondaryLabel}
              </a>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
```

Note: `ChevronDown` and `Copy` imports were already unused in the original file — left as-is, not in scope for this change (pre-existing, unrelated to this task).

- [ ] **Step 2: Manual verification — functionality**

Run: `npm run dev`. Confirm: the "Live vX.X Ready" badge still populates from the API (now via context); the primary CTA label/link matches your OS in both the desktop (`lg:flex`) and mobile (`lg:hidden`) blocks; the secondary link appears and points at the other platform's asset.

- [ ] **Step 3: Manual verification — viewport fit**

In Chrome devtools, set a custom device size of 1366×768 and 1440×900 (laptop heights) and confirm the Hero section now fits without scrolling past the fold (or scrolls noticeably less than before). Then check 1920×1080 and an iPhone/iPad preset to confirm no regression — padding/heading size should look unchanged there.

- [ ] **Step 4: Commit**

```bash
git add components/Hero.tsx
git commit -m "feat: make hero CTAs OS-aware and fix laptop-height overflow"
```

---

### Task 7: Download section OS-aware CTAs

**Files:**
- Modify: `components/Download.tsx`

**Interfaces:**
- Consumes: `useRelease()` (Task 3), `detectOS()` (Task 1), `getPlatformLinks()` (Task 2).

- [ ] **Step 1: Replace the hardcoded headline and buttons**

```tsx
// components/Download.tsx
'use client';

import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Apple, Download, Monitor } from 'lucide-react';
import { useRelease } from './ReleaseContext';
import { detectOS, type DetectedOS } from '@/lib/detectOS';
import { getPlatformLinks } from '@/lib/release';

export default function DownloadSection() {
  const release = useRelease();
  const [os, setOs] = useState<DetectedOS>('other');

  useEffect(() => {
    setOs(detectOS());
  }, []);

  const { primaryOS, primaryUrl, secondaryOS, secondaryUrl } = getPlatformLinks(os, release);
  const primaryLabel = primaryOS === 'mac' ? 'Download for Mac' : primaryOS === 'windows' ? 'Download for Windows' : 'Download';
  const secondaryLabel = secondaryOS === 'mac' ? 'Also get it for Mac' : secondaryOS === 'windows' ? 'Also get it for Windows' : null;

  return (
    <section id="download" className="max-w-6xl mx-auto px-6 md:px-8 py-16 md:py-24">
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
        className="bg-accent rounded-[32px] md:rounded-[48px] px-6 py-10 sm:p-12 md:p-16 lg:p-24 text-center relative overflow-hidden shadow-2xl shadow-accent/30"
      >
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.2),transparent)]"></div>
        <div className="relative z-10 flex flex-col items-center">
          <div className="w-14 h-14 md:w-20 md:h-20 bg-white/20 backdrop-blur-xl rounded-xl md:rounded-2xl flex items-center justify-center mb-6 md:mb-10 border border-white/30">
             <Download className="w-6 h-6 md:w-10 md:h-10 text-white" />
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-black text-white mb-4 md:mb-8 tracking-tighter leading-[1.1] md:leading-none max-w-3xl">
            Upgrade your flow. <br/>
            <span className="opacity-60">Ready for macOS & Windows.</span>
          </h2>
          <p className="text-base md:text-xl text-white/80 font-medium mb-8 md:mb-12 max-w-xl">
            Get the native desktop experience designed for maximum productivity and zero distractions.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 w-full sm:w-auto">
            <a 
              href={primaryUrl}
              className="w-full sm:w-auto px-6 py-4 md:px-10 md:py-5 bg-white text-accent font-black rounded-xl md:rounded-2xl hover:bg-white/90 transition-all flex items-center justify-center gap-2 md:gap-3 shadow-xl active:scale-95"
            >
              {primaryOS === 'windows' ? (
                <Monitor className="w-5 h-5 md:w-6 md:h-6" />
              ) : (
                <Apple className="w-5 h-5 md:w-6 md:h-6 fill-current" />
              )}
              {primaryLabel}
            </a>
            {secondaryUrl && secondaryLabel && (
              <a 
                href={secondaryUrl}
                className="w-full sm:w-auto px-6 py-4 md:px-10 md:py-5 bg-white/10 text-white border border-white/20 font-black rounded-xl md:rounded-2xl hover:bg-white/20 transition-all flex items-center justify-center gap-2 md:gap-3 active:scale-95"
              >
                {secondaryOS === 'windows' ? (
                  <Monitor className="w-5 h-5 md:w-6 md:h-6" />
                ) : (
                  <Apple className="w-5 h-5 md:w-6 md:h-6 fill-current" />
                )}
                {secondaryLabel}
              </a>
            )}
          </div>
          <p className="mt-6 md:mt-8 text-[9px] md:text-[10px] uppercase tracking-widest text-white/40 font-black">
            Native Desktop App • Performance Optimized
          </p>
        </div>
      </motion.div>
    </section>
  );
}
```

- [ ] **Step 2: Manual verification**

Run: `npm run dev`, scroll to the Download section, confirm headline reads "Ready for macOS & Windows.", and both buttons render with correct icon/label/link (secondary button should now be clickable, not the old `cursor-not-allowed` "Windows Next"). Check at 375px width that the two stacked buttons don't overflow horizontally.

- [ ] **Step 3: Commit**

```bash
git add components/Download.tsx
git commit -m "feat: make download section CTAs OS-aware"
```

---

### Task 8: Roadmap reshuffle

**Files:**
- Modify: `components/Roadmap.tsx`

**Interfaces:** None — standalone data + grid class change.

- [ ] **Step 1: Replace the items array and grid column count**

```tsx
// components/Roadmap.tsx:4-9
const items = [
  { phase: "Q1 2026", title: "Desktop App — macOS & Windows", status: "Released", active: true },
  { phase: "Q4 2026", title: "Advanced Analytics", status: "Planned", active: false },
  { phase: "2027", title: "Team Collaboration", status: "Planned", active: false }
];
```

```tsx
// components/Roadmap.tsx:19
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
```

- [ ] **Step 2: Manual verification**

Run: `npm run dev`, scroll to the Roadmap section. Confirm 3 cards render: "Desktop App — macOS & Windows" (Released, green), "Advanced Analytics" (Planned, slate), "Team Collaboration" (Planned, slate). Check the grid at `sm` (2-column — should wrap 2+1) and `lg` (3-column — should fill the row evenly, no trailing gap) widths. Check the longer title "Desktop App — macOS & Windows" doesn't overflow or look cramped in the card at the `sm:grid-cols-2` width (narrowest card width before `lg`).

- [ ] **Step 3: Commit**

```bash
git add components/Roadmap.tsx
git commit -m "feat: reflect shipped macOS/Windows status in roadmap"
```

---

### Task 9: Full cross-breakpoint verification pass

**Files:** None modified — verification only, plus two stale doc lines.

- [ ] **Step 1: Run the automated tests**

Run: `npm test`
Expected: PASS (all `lib/detectOS.test.ts` and `lib/release.test.ts` tests green)

- [ ] **Step 2: Run lint**

Run: `npm run lint`
Expected: no new errors introduced by Tasks 1–8

- [ ] **Step 3: Manual responsive pass**

Run: `npm run dev`. Using Chrome devtools device toolbar, check Header, Hero, Roadmap, and Download at each of: 375×667 (mobile), 390×844 (mobile), 768×1024 (tablet), 1024×768 (small laptop, landscape tablet), 1280×800, 1366×768, 1440×900, 1920×1080. At each size look specifically for: text wrapping/overflow on "Download for Windows" / "Get Worklog for Windows" / "Also available for Windows" (longest new labels), the Roadmap 3-card grid balance, the Hero fitting within the viewport at 1366×768 and 1440×900, and no layout shift when the `ReleaseProvider` fetch resolves (throttle network to "Slow 3G" in devtools to make the fallback-then-resolved transition visible, confirm buttons don't jump in size).

- [ ] **Step 4: Update the two stale CLAUDE.md references**

```markdown
<!-- CLAUDE.md — replace the line about the version-badge fetch endpoint -->
- **App version badge**: fetched client-side at runtime from `https://api.github.com/repos/vavilov2212/wl-studio/releases/latest` via the shared `ReleaseProvider` (`components/ReleaseContext.tsx`), falls back to `'v1.2'` on failure.
```

(Leave the `/worklog_studio_site/icon.svg` basePath note as-is — that refers to the GitHub Pages site path, not the source repo name, and is unrelated to this change.)

- [ ] **Step 5: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: update CLAUDE.md release-fetch reference to ReleaseProvider"
```

---

### Task 10: Wording audit (deliverable, no commit)

**Files:** None modified.

- [ ] **Step 1: Scan all components for unclear/awkward copy**

Read through `components/Header.tsx`, `Hero.tsx`, `Features.tsx`, `Roadmap.tsx`, `Download.tsx`, `Footer.tsx`, `UseCases.tsx` (even though unused in `page.tsx`, flag if relevant) and `lib/config.ts` (feature copy). For each piece of copy that reads unclear, redundant, or could be tightened, note `file:line — current text — what's weak about it`.

- [ ] **Step 2: Report findings to the user in chat**

Do not write this to a file or commit it — present the list directly in the conversation for the user to triage, since copy changes are subjective and need separate sign-off per the design spec.

---

## Self-Review Notes

- **Spec coverage:** Task 2 covers goal 1 (real asset resolution); Tasks 5–7 cover goal 2 (OS-aware primary/secondary CTAs); Task 8 covers goal 3 (roadmap); Task 6 Steps 1/3 cover goal 4 (hero viewport fit); Task 10 covers goal 5 (wording audit). Footer rename (Task 4) and CLAUDE.md cleanup (Task 9 Step 4) were called out in the spec's "all worklog_studio references" line and "Architecture" background but didn't have dedicated component sections — added as their own tasks so they aren't dropped.
- **Placeholder scan:** no TBD/TODO; every code step has full file contents or a complete, addressable diff.
- **Type consistency:** `DetectedOS` (Task 1) → consumed identically in Tasks 5–7; `ReleaseInfo`/`PlatformLinks` (Task 2) → consumed identically by `ReleaseContext` (Task 3) and Tasks 5–7; `getPlatformLinks` signature `(os: DetectedOS, release: ReleaseInfo): PlatformLinks` matches every call site.
