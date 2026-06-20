# Suggested Prompts Expansion — Design

Date: 2026-06-19
Status: Approved, not yet implemented.

## Goal

Replace the current 3-item suggested-prompt list (shown as chips in the chat UI) with a longer list covering every topic area in the RAG corpus authored in `content/rag/`, while keeping the default visual footprint small via a collapse/expand control.

## Background

`components/chat/suggestedPrompts.ts` currently exports a flat array of 3 strings, rendered as chips in two places:

- `components/chat/AskAISection.tsx` — centered chips below the pre-chat input form.
- `components/chat/ChatPanel.tsx` — chips after the message list, shown both inline (when `AskAISection` expands into a conversation) and inside `components/chat/ChatOverlay.tsx` (a 380px-wide header-pill overlay).

Both call sites currently duplicate near-identical chip-rendering JSX with different visual styling (`AskAISection`: accent-tinted pill, centered, no active-state; `ChatPanel`: bordered pill, left-aligned, with a checkmark + highlighted state when the chip's prompt matches the last question the user asked).

One of the 3 current prompts ("Tell me about the author") is being replaced as part of this change.

## Non-Goals

- No change to retrieval/embedding/chat backend logic.
- No persistence of expand/collapse state across page loads or sessions — it's a per-mount UI convenience, not meaningful state.
- No pagination of the expanded list — revealing shows all remaining prompts at once.

## Data

`components/chat/suggestedPrompts.ts` exports the following 18 prompts, in this order (first 3 are the default-visible set):

```
1. What does Frictionless Tracking mean?
2. What integrations are planned?
3. Who maintains this project?
4. Is Focus Analytics available yet?
5. What's the difference between a Project, Task, and Time Entry?
6. What platforms does Worklog Studio support?
7. Why did you build Worklog Studio?
8. How is Worklog Studio different from tools like Toptal's Top Tracker or My Hours?
9. What's on the roadmap?
10. What features are you considering for the future?
11. Is Worklog Studio free to use?
12. Is my data stored locally or sent to a server?
13. What's the app built with?
14. How do I install it on Windows or Mac?
15. I'm getting a security warning when I open the app — is that normal?
16. What happens if the app crashes or I lose data?
17. Can I contribute to the project?
18. What's the license?
```

## Component Design

### New: `components/chat/SuggestedPromptChips.tsx`

A shared component replacing the duplicated chip-rendering logic in both call sites.

**Props:**
```ts
{
  prompts: string[];
  onSelect: (prompt: string) => void;
  disabled?: boolean;       // maps to ChatPanel's isStreaming guard
  activePrompt?: string;    // ChatPanel's lastUserQuestion, for the checkmark state; AskAISection won't pass this
  variant: 'hero' | 'panel'; // selects which existing visual style to render
}
```

**Behavior:**
- Holds local `expanded` state (`useState(false)`), reset on every mount — no external persistence.
- Renders `prompts.slice(0, 3)` when collapsed; all prompts when expanded.
- If `prompts.length > 3`, renders a "Show more (+N)" text/chevron toggle below the chips (where N = `prompts.length - 3`); toggling to expanded changes the label to "Show less" and flips the chevron. Uses a `motion/react` height transition consistent with existing animation usage, or a simple CSS transition — implementation detail, not load-bearing for this design.
- Each chip's click handler calls `onSelect(prompt)`; `disabled` disables all chips (matches `ChatPanel`'s current `isStreaming` guard); `AskAISection` passes `disabled={false}` (or omits it, defaulting to false) since it has no streaming state to guard against before a conversation starts.
- `variant='hero'` renders the existing `AskAISection` chip styling (centered flex-wrap, accent-tinted, no active/checkmark state). `variant='panel'` renders the existing `ChatPanel` chip styling (left-aligned flex-wrap, bordered, checkmark + highlighted state when `prompt === activePrompt`).

### Call site changes

- `AskAISection.tsx`: replace the inline chip-mapping JSX with `<SuggestedPromptChips prompts={SUGGESTED_PROMPTS} onSelect={sendMessage} variant="hero" />`.
- `ChatPanel.tsx`: replace the inline chip-mapping JSX with `<SuggestedPromptChips prompts={SUGGESTED_PROMPTS} onSelect={sendMessage} disabled={isStreaming} activePrompt={lastUserQuestion} variant="panel" />`.

## Testing

- `AskAISection.test.tsx` and `ChatPanel.test.tsx` need updating: assertions that check for the 3 hardcoded prompt strings need updating to the new list/wording, and new tests are needed for the collapse/expand interaction (default-3-visible, "Show more" reveals the rest, "Show less" re-collapses).
- A new `SuggestedPromptChips.test.tsx` should cover the component in isolation: default collapsed state, expand/collapse toggle, `disabled` propagation, `activePrompt` checkmark rendering for the `panel` variant, and that the `hero` variant never renders a checkmark regardless of `activePrompt`.
- Follow TDD: write the failing tests first for the new component and the updated call-site behavior, then implement.

## Open Questions

None — all decisions (wording, scope of application, expand mechanic) were settled during brainstorming.
