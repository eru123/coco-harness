# Agent Note: The hero workspace row is one chip family with feedback-only hover

Status: implemented

## Problem

The hero screen's workspace row ([`HeroShell.module.css`](../../../../packages/client/ui-conversation/src/client/skeleton/HeroShell.module.css) `.workspace`, the agent-preset `.seat`, and the New task entry in [`ConversationRoot.module.css`](../../../../packages/client/ui-conversation/src/client/skeleton/ConversationRoot.module.css)) is a family of transparent pills, but the New task entry shipped with its own geometry: 26px tall, radius 8, 13/18 weight 400, secondary label, and a literal `rgba()` fallback inside `var()`. Its rule was also pasted in the middle of `.heroWorkspaceRow`, so the row's tuned `margin-top: 4px` and `padding-left: 20px` landed in `.newTaskButton:hover` — hovering moved the entry 4px down and shifted its text, and the row lost both the offset that seats it above the input card and the left padding that aligns the chip's folder glyph with the card's inner controls.

Plain CSS Modules give no signal when declarations land in the wrong rule: the sheet parses, the class hashes resolve, and jsdom cannot see layout, so no rendering spec can catch either defect.

## Decision

The row is one chip family with one geometry: every member mirrors `.workspace` — `min-height: 28px`, `padding: 0 8px`, `border-radius: 16px`, `font-size: 13px` / `line-height: 20px`, `font-weight: 500`, `color: var(--dsw-alias-label-primary)`, and hover feedback of `background: var(--dsw-alias-interactive-bg-hover)` alone. The agent-preset seat already followed this recipe; the New task entry now does too, with the family's 16px leading icon (`IconNewChatOutline16`) and no chevron, because it is an action, not a menu trigger.

The workspace chip keeps the row's leading position — the `padding-left: 20px` is tuned for the chip's folder glyph — so the New task entry trails the preset seat instead of preceding the chip. Feature CSS references `--dsw-alias-*` tokens bare: literal fallback values belong only to the pre-theme loading shell, per [`docs/web-styling.md`](../../../../docs/web-styling.md).

[`tests/hero-row-styles.client.spec.ts`](../../../../packages/client/ui-conversation/tests/hero-row-styles.client.spec.ts) pins the contract as CSS text, following the sidebar and tool-row style specs: the row offsets, the mirrored geometry between `.newTaskButton` and `.workspace`, and exact equality on the hover rule so a layout property smuggled into hover fails the gate. Verified red against the corrupted sheet before restoring the fix.

## Alternatives considered

**Bespoke geometry with `var()` fallbacks.** The shipped form. Fallbacks duplicate theme values into feature CSS where the theme always resolves first, and the differing metrics made the entry read as a foreign control beside the two chips.

**Entry first in the row.** Reads as promoting task sessions over the workspace flow, and defeats the row's tuned chip alignment: the 20px padding exists to line the chip's glyph with the card controls, not whatever control happens to be first.

**A shared chip class extracted into ui-primitives.** Three consumers with diverging interiors (folder+chevron, preset icon+name, icon+label) share only the mirrored declaration list; the style-spec equality already forces the mirror, so an extraction would add indirection without deleting the contract.

## Consequences

- A new member of the hero row mirrors `.workspace` and extends the mirrored-property list in the style spec; drifting one chip now fails `test:gui`, not review.
- Hover rules in this row carry feedback properties only; geometry changes belong on the base rule, where the style spec sees them.
- The New task entry is hidden on a Buddy hero (`hero && !buddy`): that session already is a task session, and its chip reads "Tasks".

## Testing

`tests/hero-row-styles.client.spec.ts` (3 tests; each verified failing against the corrupted sheet). [`tests/skeleton.client.spec.tsx`](../../../../packages/client/ui-conversation/tests/skeleton.client.spec.tsx) gains the entry's behavior: it trails the chip family in document order, clicking it calls `startBuddySession` once, and a Buddy hero shows the Tasks chip with no entry and a live composer. `pnpm run test:gui` and the client typecheck aggregate pass.
