# Multi-Platform Release Support — Design

## Background

Worklog Studio now ships on both macOS and Windows (see `github.com/vavilov2212/wl-studio/releases`). The landing page currently:

- Hardcodes "Download for Mac" / `.dmg` links everywhere, with Windows shown as a disabled "Coming Next"/"Windows Next" placeholder.
- Points download links at the renamed repo `vavilov2212/worklog_studio` (GitHub redirects this to `wl-studio`, so links still resolve, but the canonical name should be used going forward).
- Links to a static filename (`worklogStudio.dmg`) that does not match any real release asset — actual assets are versioned zips, e.g. `worklog_studio_macos_1.0.9.zip` and `worklog_studio_windows_1.0.9.zip`. The current links only "work" by accident via GitHub's redirect/404 behavior, not by actually resolving to a binary.
- Roadmap still lists "Windows Support" as planned and "Advanced Analytics" as in progress — neither reflects current reality (Windows is shipped, Analytics work hasn't started).
- The Hero section overflows the viewport on common laptop resolutions (e.g. 1366×768, 1440×900).

This spec covers fixing all of the above.

## Goals

1. Download links resolve to a real, OS-appropriate release asset, fetched dynamically (not hardcoded filenames).
2. Primary CTA across Header/Hero/Download auto-detects the visitor's OS and links straight to the matching asset; the other platform is offered as a clear secondary link (not disabled/grayed).
3. Roadmap reflects shipped status for both platforms and pushes unstarted Analytics work further out.
4. Hero fits within typical laptop viewport heights without changing the mobile/tablet/large-desktop experience.
5. Produce a list (no code changes) of copy across the site that reads weak or unclear, with file:line locations.

## Non-goals

- No native OS download manager / installer signing changes — this is purely about the landing page resolving correct links.
- No redesign of the Roadmap, Download, or Hero visual language beyond what's needed for the above.
- No build of the not-yet-started Analytics feature.

## Architecture

### Release data layer (new)

**`lib/release.ts`**
- `fetchLatestRelease(): Promise<ReleaseInfo>` calls `https://api.github.com/repos/vavilov2212/wl-studio/releases/latest`.
- `ReleaseInfo = { version: string; macUrl: string | null; windowsUrl: string | null; releasesUrl: string }`
- Asset matching: find an asset whose `name` matches `/macos/i` → `macUrl`; `/windows/i` → `windowsUrl`. `releasesUrl` is always `https://github.com/vavilov2212/wl-studio/releases/latest` (static, always valid).
- On fetch failure or missing assets, the corresponding `*Url` stays `null` — consumers fall back to `releasesUrl` and a neutral label ("View Releases") rather than guessing a filename.

**`components/ReleaseContext.tsx`**
- Mirrors `TimerContext`'s provider pattern. Fetches once on mount (client-side, same `requestAnimationFrame`-deferred approach Hero.tsx currently uses to avoid hydration issues), exposes `{ version, macUrl, windowsUrl, releasesUrl, isLoading }` via context.
- Wraps the app in `app/layout.tsx` alongside `TimerProvider`, so Header/Hero/Download all read from one fetch instead of three.
- Default/loading state: `version` falls back to `'v1.2'` (current behavior), URLs fall back to `releasesUrl` until resolved — buttons render immediately with a working link, then "upgrade" to the specific asset URL once the fetch resolves. No layout shift, since label text length is reserved for the longer of the two states up front (see Header/Hero notes below).

**`lib/detectOS.ts`**
- `detectOS(): 'mac' | 'windows' | 'other'` — inspects `navigator.userAgent` (checked client-side only, called from `'use client'` components after mount).

### Component changes

**`components/Header.tsx`**
- Replace the static Mac-only link with one CTA driven by `detectOS()` + `ReleaseContext`:
  - mac → `macUrl ?? releasesUrl`, label "Download for Mac" (or "View Releases" if `macUrl` is null)
  - windows → `windowsUrl ?? releasesUrl`, label "Download for Windows" (or "View Releases")
  - other → `releasesUrl`, label "Download"
- The visible label (`hidden sm:inline-block`) needs to accommodate "Download for Windows" (longer than "Download for Mac") without wrapping or pushing the GitHub icon — verify at the `sm`–`md` range where space is tightest.

**`components/Hero.tsx`**
- Desktop CTA block (`lg:flex`): primary button uses the same auto-detect logic as Header (large button, label "Get Worklog for Mac" / "Get Worklog for Windows" / "Get Worklog"). Secondary slot — currently a grayed-out "Coming Next: Windows" — becomes a real link to the *other* platform's asset: "Also available for Windows" / "Also available for Mac", small text link, not full-button weight, preserving current visual hierarchy (one prominent CTA, one quiet secondary).
- Mobile CTA block (`lg:hidden`): primary button same auto-detect logic. Below it, replace the grayscale "macOS · Windows Soon" row with a real secondary link to the other platform.
- Keep the existing version-badge fetch logic, but source it from `ReleaseContext` instead of its own local fetch (removes duplicate network call).

**`components/Roadmap.tsx`**
- Replace the 4-item array:
  - Old: macOS App (Released) / Advanced Analytics (In Progress) / Windows Support (Planned) / Team Collaboration (Planned)
  - New: Desktop App — macOS & Windows (Released, `Q1 2026`) / Advanced Analytics (Planned, moved to `Q4 2026`) / Team Collaboration (Planned, `2027`)
- 3 items instead of 4 → grid changes from `lg:grid-cols-4` to `lg:grid-cols-3` so the row doesn't leave a visibly empty trailing slot on wide screens. `sm:grid-cols-2` stays for tablet (3 items: 2 + 1, acceptable wrap).

**`components/Download.tsx`**
- Headline: "Upgrade your flow. Ready for macOS Sonoma." → platform-neutral, e.g. "Upgrade your flow. Ready for macOS & Windows."
- Buttons: primary = auto-detected platform (white button, same style as today), secondary = real link to the other platform (replaces the disabled `cursor-not-allowed` "Windows Next" button with an actually-clickable styled-as-secondary button — same visual weight reduction as today, just functional instead of disabled).
- Icon swap: `Apple`/`Monitor` icons chosen based on which platform is primary vs. secondary, rather than hardcoded Apple-primary/Monitor-disabled.

### Hero viewport-fit fix

- Tailwind v4 supports arbitrary-variant media queries (`[@media(max-height:820px)]:`). Add a combined variant scoped to laptop-width-but-short-height screens — e.g. apply tighter `pt-*`/`pb-*` and one step down in heading size only when both `lg:` (≥1024px wide) and `max-height:820px` apply — so phones/tablets (which match max-height but not lg width) and tall desktop monitors (which match lg width but not the height cap) are unaffected.
- Target validation heights: 768px (1366×768, 1280×800), 900px (1440×900), and ensure no regression at 1920×1080 / ultrawide.

### Wording audit (deliverable, not implemented)

After the above changes ship, scan all components for copy that reads unclear, redundant, or could be tightened, and produce a list of `file:line — current text — issue` for the user to decide on. This is advisory only — no text changes without separate sign-off, since copy is subjective and the user wants to review before committing to changes.

## Testing / Verification

- Manual verification (no test runner configured in this repo): run `npm run dev`, check Header/Hero/Download/Roadmap render correctly with `ReleaseContext` resolved and in its initial fallback state (simulate slow/failed fetch).
- Verify resolved mac/windows URLs actually match the real release asset pattern against the live API response captured during design (`worklog_studio_macos_*.zip`, `worklog_studio_windows_*.zip`).
- Resize/inspect at: 375/390 (mobile), 768 (tablet), 1024/1280 (small laptop width), 1366×768 & 1440×900 (laptop height-constrained), 1920×1080 (desktop) — check for overflow, label wrapping ("Download for Windows" in Header/mobile CTA), and no layout shift when the release fetch resolves after initial render.
