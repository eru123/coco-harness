# Agent Note: The graphs tab matches each visualization to data of its own shape

Status: implemented

## Problem

The Graphs tab shipped as a rendered mermaid flowchart in a scrollable page (see [the mermaid-era note](2026-08-18-graphs-live-mermaid-session-view.md)). Remaking it as a coco-agent-style React Flow canvas over the session's step chain still read badly — and the reason is structural, not cosmetic: a session's event stream is temporal and mostly sequential, so a node-edge canvas renders it as one long undifferentiated chain. Node graphs earn their keep only on branching data, which the harness has in exactly one place: cross-session delegation (`parentId` summaries). Agent-tracing tools (LangSmith, Langfuse, Phoenix) render session traces as timeline waterfalls for the same reason.

## Decision

The tab carries two visualizations behind a mode switch, each matched to its data's shape, keeping the slot contract — pure derivations, one `'conversation.view'` slot entry, no service:

- **Timeline (default)** — `timeline-model.ts` derives a turn-based waterfall from the shared `'trajectory'` snapshot plus `turnTimings`: tool calls span call-start to result, the in-flight partial anchors at the last finalized step and grows to a one-second tick, overlapping items stack into swimlanes by interval coloring, and instantaneous events are point markers. Tool results carry no turn of their own; the enclosing turn timing places them.
- **Delegation** — `delegation-model.ts` folds the sessions list's `parentId` summaries into a tree rooted at the current session's topmost KNOWN ancestor (the climb stops at a pruned parent), rendered on `@xyflow/react` (the coco-agent run-graph library) with status accents (awaiting > running > done > idle) and arrowheaded spawning edges. Cards carry the edge-anchor `<Handle>`s — a custom React Flow node without them renders no edges at all.
- `GraphsView.tsx` is the mode-switch shell sharing one inspector panel across both modes.

The library's structural CSS (viewport transform origin, absolute node placement, panel/controls/minimap chrome, edge dash animation) is restated as `:global` selectors in `views.module.css` against the app's theme tokens, because the client-bundle CSS pipeline compiles only `.module.css` files and cannot carry the library's plain stylesheet; `--xy-*` variable defaults are mapped onto `--dsw-*` tokens so the chrome follows the theme. The mermaid dependency (and its bundle-purity `inlineDynamicImports` override) is gone.

## Alternatives considered

**The React Flow step-chain canvas (this note's earlier form, built and rejected same-day).** The coco-agent experience transplanted onto sequential data: cards and arrows worked, but the picture — one card after another — said nothing a list doesn't. Kept the library, the card/handle contract, and the CSS restatement; pointed them at the delegation tree where branching is real.

**Keep mermaid, add pan/zoom around it.** Mermaid renders one SVG sized to the graph; gesture controls over it would pan a picture, not a graph.

**A custom canvas (coco-agent's brain view).** Hand-rolled projection suits a 3D constellation; a waterfall is bars on an axis, and React Flow supplies the delegation canvas's pan/zoom as maintained library code.

## Consequences

- The browser artifact drops mermaid entirely (a much smaller `lib/client.js`); `@xyflow/react` serves only the delegation mode.
- The mermaid-era note stays as history of that presentation; this note owns the current rendering decision (partial supersession — the tab, its data source, and its slot registration are unchanged).
- The `:global` React Flow rules must track the library's structural classes across upgrades; the README names this as a known limitation.
- The timeline has no axis scrubbing or per-turn expansion yet; the known-limitations list owns the deferral.
