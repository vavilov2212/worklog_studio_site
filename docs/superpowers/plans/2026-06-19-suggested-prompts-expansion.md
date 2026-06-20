# Suggested Prompts Expansion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Expand the chat's suggested-prompt chips from 3 hardcoded questions to an 18-question list covering every RAG content area, rendered through a new shared, collapsible `SuggestedPromptChips` component (3 visible by default, "Show more" reveals the rest) used by both `AskAISection` and `ChatPanel`.

**Architecture:** A new presentational component (`components/chat/SuggestedPromptChips.tsx`) owns the collapse/expand state and per-variant styling, replacing duplicated chip JSX in `AskAISection.tsx` and `ChatPanel.tsx`. The prompt data itself lives in `components/chat/suggestedPrompts.ts`, unchanged in shape (a flat `string[]`), just longer.

**Tech Stack:** Next.js App Router, React 19, TypeScript (strict), Tailwind CSS v4 (no `tailwind.config.js`, utility classes only), `lucide-react` icons, Vitest + `@testing-library/react` + jsdom for tests.

## Global Constraints

- TypeScript strict mode — no `any`, all props explicitly typed.
- No comments unless explaining non-obvious WHY (per project convention) — these components don't need any.
- Match existing code style in `components/chat/*`: plain template-literal `className` strings (no `cn()` helper used in this directory today), `'use client'` directive at the top of every component file here.
- Test files colocated next to the component (`Foo.tsx` + `Foo.test.tsx`), using Vitest (`describe`/`it`/`expect`/`vi`) and `@testing-library/react` (`render`/`screen`/`fireEvent`), matching `AskAISection.test.tsx` and `ChatPanel.test.tsx`.
- Run tests with `npx vitest run <path>` (no `--watch`).
- Frequent, small commits — one per task.

---

### Task 1: Expand the suggested-prompts data

**Files:**
- Modify: `components/chat/suggestedPrompts.ts`

**Interfaces:**
- Produces: `SUGGESTED_PROMPTS: string[]` (same export name and shape as before, just 18 entries instead of 3). Order matters — the first 3 entries are what every consumer shows by default.

- [ ] **Step 1: Replace the array contents**

Replace the entire file contents with:

```ts
export const SUGGESTED_PROMPTS = [
  'What does Frictionless Tracking mean?',
  'What integrations are planned?',
  'Who maintains this project?',
  'Is Focus Analytics available yet?',
  "What's the difference between a Project, Task, and Time Entry?",
  'What platforms does Worklog Studio support?',
  'Why did you build Worklog Studio?',
  "How is Worklog Studio different from tools like Toptal's Top Tracker or My Hours?",
  "What's on the roadmap?",
  'What features are you considering for the future?',
  'Is Worklog Studio free to use?',
  'Is my data stored locally or sent to a server?',
  "What's the app built with?",
  'How do I install it on Windows or Mac?',
  "I'm getting a security warning when I open the app — is that normal?",
  'What happens if the app crashes or I lose data?',
  'Can I contribute to the project?',
  "What's the license?",
];
```

- [ ] **Step 2: Run the existing consumer tests to confirm nothing else breaks yet**

Run: `npx vitest run components/chat/AskAISection.test.tsx components/chat/ChatPanel.test.tsx`
Expected: PASS — both files only assert on `/integrations are planned/i` and `/ask anything/i`, both still true with the new list (the "integrations" prompt is `SUGGESTED_PROMPTS[1]`, within the still-uncollapsed-because-not-yet-implemented full list).

- [ ] **Step 3: Commit**

```bash
git add components/chat/suggestedPrompts.ts
git commit -m "content: expand suggested chat prompts to cover full RAG corpus"
```

---

### Task 2: Build the `SuggestedPromptChips` component

**Files:**
- Create: `components/chat/SuggestedPromptChips.tsx`
- Test: `components/chat/SuggestedPromptChips.test.tsx`

**Interfaces:**
- Consumes: nothing from other tasks (pure presentational component, takes `prompts: string[]` as a prop — Task 1's `SUGGESTED_PROMPTS` is wired in by Tasks 3 and 4, not referenced here directly).
- Produces: default export `SuggestedPromptChips`, props:
  ```ts
  {
    prompts: string[];
    onSelect: (prompt: string) => void;
    disabled?: boolean;
    activePrompt?: string;
    variant: 'hero' | 'panel';
  }
  ```
  Tasks 3 and 4 import this as `import SuggestedPromptChips from './SuggestedPromptChips';`.

- [ ] **Step 1: Write the failing tests**

Create `components/chat/SuggestedPromptChips.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import SuggestedPromptChips from './SuggestedPromptChips';

const PROMPTS = ['A', 'B', 'C', 'D', 'E'];

describe('SuggestedPromptChips', () => {
  it('shows only the first 3 prompts by default', () => {
    render(<SuggestedPromptChips prompts={PROMPTS} onSelect={vi.fn()} variant="hero" />);
    expect(screen.getByText('A')).toBeInTheDocument();
    expect(screen.getByText('B')).toBeInTheDocument();
    expect(screen.getByText('C')).toBeInTheDocument();
    expect(screen.queryByText('D')).not.toBeInTheDocument();
  });

  it('reveals the rest after clicking "Show more"', () => {
    render(<SuggestedPromptChips prompts={PROMPTS} onSelect={vi.fn()} variant="hero" />);
    fireEvent.click(screen.getByText(/show more/i));
    expect(screen.getByText('D')).toBeInTheDocument();
    expect(screen.getByText('E')).toBeInTheDocument();
  });

  it('re-collapses after clicking "Show less"', () => {
    render(<SuggestedPromptChips prompts={PROMPTS} onSelect={vi.fn()} variant="hero" />);
    fireEvent.click(screen.getByText(/show more/i));
    fireEvent.click(screen.getByText(/show less/i));
    expect(screen.queryByText('D')).not.toBeInTheDocument();
  });

  it('does not render a "Show more" toggle when there are 3 or fewer prompts', () => {
    render(<SuggestedPromptChips prompts={['A', 'B', 'C']} onSelect={vi.fn()} variant="hero" />);
    expect(screen.queryByText(/show more/i)).not.toBeInTheDocument();
  });

  it('calls onSelect with the clicked prompt', () => {
    const onSelect = vi.fn();
    render(<SuggestedPromptChips prompts={PROMPTS} onSelect={onSelect} variant="hero" />);
    fireEvent.click(screen.getByText('A'));
    expect(onSelect).toHaveBeenCalledWith('A');
  });

  it('disables all visible chips when disabled is true', () => {
    render(<SuggestedPromptChips prompts={PROMPTS} onSelect={vi.fn()} disabled variant="panel" />);
    expect(screen.getByText('A').closest('button')).toBeDisabled();
    expect(screen.getByText('C').closest('button')).toBeDisabled();
  });

  it('shows a checkmark on the active prompt for the panel variant', () => {
    render(
      <SuggestedPromptChips prompts={PROMPTS} onSelect={vi.fn()} activePrompt="B" variant="panel" />
    );
    const button = screen.getByText('B').closest('button');
    expect(button?.querySelector('svg')).toBeInTheDocument();
  });

  it('never shows a checkmark for the hero variant even with an activePrompt', () => {
    render(
      <SuggestedPromptChips prompts={PROMPTS} onSelect={vi.fn()} activePrompt="B" variant="hero" />
    );
    const button = screen.getByText('B').closest('button');
    expect(button?.querySelector('svg')).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run components/chat/SuggestedPromptChips.test.tsx`
Expected: FAIL with a module-not-found error for `./SuggestedPromptChips` (the component doesn't exist yet).

- [ ] **Step 3: Implement the component**

Create `components/chat/SuggestedPromptChips.tsx`:

```tsx
'use client';

import { useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';

const DEFAULT_VISIBLE_COUNT = 3;

export default function SuggestedPromptChips({
  prompts,
  onSelect,
  disabled = false,
  activePrompt,
  variant,
}: {
  prompts: string[];
  onSelect: (prompt: string) => void;
  disabled?: boolean;
  activePrompt?: string;
  variant: 'hero' | 'panel';
}) {
  const [expanded, setExpanded] = useState(false);
  const hasMore = prompts.length > DEFAULT_VISIBLE_COUNT;
  const visiblePrompts = expanded ? prompts : prompts.slice(0, DEFAULT_VISIBLE_COUNT);

  return (
    <div>
      <div className={variant === 'hero' ? 'flex flex-wrap justify-center gap-2 mt-4' : 'flex flex-wrap gap-2 pt-1'}>
        {visiblePrompts.map((prompt) => {
          const justAsked = variant === 'panel' && prompt === activePrompt;
          return (
            <button
              key={prompt}
              type="button"
              onClick={() => onSelect(prompt)}
              disabled={disabled}
              className={
                variant === 'hero'
                  ? 'text-xs font-medium text-accent bg-accent/10 border border-accent/20 rounded-full px-3 py-1.5 hover:bg-accent/20 transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-60'
                  : `text-xs font-medium rounded-full px-3 py-1.5 border transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-60 flex items-center gap-1.5 ${
                      justAsked
                        ? 'text-accent bg-accent/15 border-accent/40'
                        : 'text-accent bg-accent/10 border-accent/20 hover:bg-accent/20'
                    }`
              }
            >
              {justAsked && <Check className="w-3 h-3" />}
              {prompt}
            </button>
          );
        })}
      </div>
      {hasMore && (
        <div className={`flex mt-2 ${variant === 'hero' ? 'justify-center' : ''}`}>
          <button
            type="button"
            onClick={() => setExpanded((prev) => !prev)}
            aria-expanded={expanded}
            className="flex items-center gap-1 text-xs font-medium text-slate hover:text-ink transition-colors cursor-pointer"
          >
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${expanded ? 'rotate-180' : ''}`} />
            {expanded ? 'Show less' : `Show more (+${prompts.length - DEFAULT_VISIBLE_COUNT})`}
          </button>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run components/chat/SuggestedPromptChips.test.tsx`
Expected: PASS (8 tests).

- [ ] **Step 5: Commit**

```bash
git add components/chat/SuggestedPromptChips.tsx components/chat/SuggestedPromptChips.test.tsx
git commit -m "feat: add collapsible SuggestedPromptChips component"
```

---

### Task 3: Wire `SuggestedPromptChips` into `AskAISection`

**Files:**
- Modify: `components/chat/AskAISection.tsx:64-74`
- Modify: `components/chat/AskAISection.test.tsx`

**Interfaces:**
- Consumes: `SuggestedPromptChips` from Task 2 (`prompts`, `onSelect`, `variant` props — `disabled` and `activePrompt` are omitted, both optional), and `SUGGESTED_PROMPTS` from Task 1.

- [ ] **Step 1: Write the failing test**

Add this test to `components/chat/AskAISection.test.tsx` (inside the existing `describe('AskAISection', ...)` block):

```tsx
  it('shows only the first three suggested prompts by default', () => {
    render(
      <ChatProvider>
        <AskAISection />
      </ChatProvider>
    );
    expect(screen.getByText('What does Frictionless Tracking mean?')).toBeInTheDocument();
    expect(screen.getByText('What integrations are planned?')).toBeInTheDocument();
    expect(screen.getByText('Who maintains this project?')).toBeInTheDocument();
    expect(screen.queryByText('Is Focus Analytics available yet?')).not.toBeInTheDocument();
  });
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run components/chat/AskAISection.test.tsx`
Expected: FAIL — `AskAISection` still renders all 18 raw chips (no collapsing yet), so `queryByText('Is Focus Analytics available yet?')` finds a match and the `not.toBeInTheDocument()` assertion fails.

- [ ] **Step 3: Replace the inline chip JSX with the shared component**

In `components/chat/AskAISection.tsx`, change the import line:

```tsx
import { SUGGESTED_PROMPTS } from './suggestedPrompts';
```

to:

```tsx
import { SUGGESTED_PROMPTS } from './suggestedPrompts';
import SuggestedPromptChips from './SuggestedPromptChips';
```

Then replace this block (the `<div className="flex flex-wrap justify-center gap-2 mt-4">...</div>` containing the `.map`):

```tsx
            <div className="flex flex-wrap justify-center gap-2 mt-4">
              {SUGGESTED_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => void sendMessage(prompt)}
                  className="text-xs font-medium text-accent bg-accent/10 border border-accent/20 rounded-full px-3 py-1.5 hover:bg-accent/20 transition-colors cursor-pointer"
                >
                  {prompt}
                </button>
              ))}
            </div>
```

with:

```tsx
            <SuggestedPromptChips
              prompts={SUGGESTED_PROMPTS}
              onSelect={(prompt) => void sendMessage(prompt)}
              variant="hero"
            />
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run components/chat/AskAISection.test.tsx`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add components/chat/AskAISection.tsx components/chat/AskAISection.test.tsx
git commit -m "feat: collapse AskAISection suggested prompts behind Show more"
```

---

### Task 4: Wire `SuggestedPromptChips` into `ChatPanel`

**Files:**
- Modify: `components/chat/ChatPanel.tsx:1-6,85-105`
- Modify: `components/chat/ChatPanel.test.tsx`

**Interfaces:**
- Consumes: `SuggestedPromptChips` from Task 2 (`prompts`, `onSelect`, `disabled`, `activePrompt`, `variant` — all 5 props used here), and `SUGGESTED_PROMPTS` from Task 1.

- [ ] **Step 1: Write the failing test**

Add this test to `components/chat/ChatPanel.test.tsx` (inside the existing `describe('ChatPanel', ...)` block):

```tsx
  it('shows only the first three suggested prompts by default', () => {
    render(
      <ChatProvider>
        <ChatPanel />
      </ChatProvider>
    );
    expect(screen.getByText('What does Frictionless Tracking mean?')).toBeInTheDocument();
    expect(screen.queryByText('Is Focus Analytics available yet?')).not.toBeInTheDocument();
  });
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run components/chat/ChatPanel.test.tsx`
Expected: FAIL — `ChatPanel` still renders all 18 raw chips, so the `queryByText` assertion finds a match and fails.

- [ ] **Step 3: Replace the inline chip JSX with the shared component**

In `components/chat/ChatPanel.tsx`, change the icon import line (drop the now-unused `Check`, since the checkmark logic moves into `SuggestedPromptChips`):

```tsx
import { Send, Square, Check } from 'lucide-react';
```

to:

```tsx
import { Send, Square } from 'lucide-react';
```

Add the new import below the existing `suggestedPrompts` import:

```tsx
import { SUGGESTED_PROMPTS } from './suggestedPrompts';
import SuggestedPromptChips from './SuggestedPromptChips';
```

Then replace this block:

```tsx
        <div className="flex flex-wrap gap-2 pt-1">
          {SUGGESTED_PROMPTS.map((prompt) => {
            const justAsked = prompt === lastUserQuestion;
            return (
              <button
                key={prompt}
                type="button"
                onClick={() => void sendMessage(prompt)}
                disabled={isStreaming}
                className={`text-xs font-medium rounded-full px-3 py-1.5 border transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-60 flex items-center gap-1.5 ${
                  justAsked
                    ? 'text-accent bg-accent/15 border-accent/40'
                    : 'text-accent bg-accent/10 border-accent/20 hover:bg-accent/20'
                }`}
              >
                {justAsked && <Check className="w-3 h-3" />}
                {prompt}
              </button>
            );
          })}
        </div>
```

with:

```tsx
        <SuggestedPromptChips
          prompts={SUGGESTED_PROMPTS}
          onSelect={(prompt) => void sendMessage(prompt)}
          disabled={isStreaming}
          activePrompt={lastUserQuestion}
          variant="panel"
        />
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run components/chat/ChatPanel.test.tsx`
Expected: PASS (3 tests).

- [ ] **Step 5: Run the full test suite to confirm no regressions**

Run: `npx vitest run`
Expected: PASS (all test files, no failures).

- [ ] **Step 6: Commit**

```bash
git add components/chat/ChatPanel.tsx components/chat/ChatPanel.test.tsx
git commit -m "feat: collapse ChatPanel suggested prompts behind Show more"
```

---

### Task 5: Manual verification in the browser

**Files:** none (manual QA step, no code changes).

- [ ] **Step 1: Start the dev server**

Run: `npm run dev`

- [ ] **Step 2: Verify the pre-chat `AskAISection` (inline section below Hero)**

Open `http://localhost:3000`, scroll to the "Ask about Worklog Studio" panel. Confirm:
- Exactly 3 chips visible by default: "What does Frictionless Tracking mean?", "What integrations are planned?", "Who maintains this project?".
- A "Show more (+15)" link with a chevron appears below them.
- Clicking it reveals all 18 chips and the link changes to "Show less".
- Clicking "Show less" collapses back to 3.
- Clicking any chip sends that question and expands into the full chat panel.

- [ ] **Step 3: Verify the header-pill `ChatOverlay`**

Click the "Ask AI" header pill. Confirm the same 3-default/expand-to-18 behavior renders correctly inside the narrower 380px-wide overlay panel without overflow or layout breakage, and that asking a question still shows the checkmark on the just-asked chip if it's one of the visible ones.

- [ ] **Step 4: Stop the dev server**

Stop the process (Ctrl+C or kill the background task).

---

## Spec Coverage Check

- 18-question list covering all RAG areas → Task 1.
- "Who maintains this project?" replacing the author question → Task 1 (item 3 in the array).
- Shared collapsible component, 3 visible by default, "Show more" text/chevron toggle → Task 2.
- Applied to both `AskAISection` and `ChatPanel`/`ChatOverlay` → Tasks 3 and 4 (`ChatOverlay` needs no direct change since it only renders `<ChatPanel />`).
- No persistence of expand state, no pagination → satisfied by Task 2's plain `useState(false)` with no storage read/write.
- TDD throughout → every task with code changes starts with a failing test.
