# Agent Note: Live mermaid session-progress view tab

Status: implemented

## Problem

The session body had two view tabs (Chat, Trajectory), both textual. Users who prefer visual interaction had no live picture of what the session has done and what remains in flight. The ask was a Graphs tab beside Trajectory that converts live session steps into a mermaid graph and animates it as the session progresses.

## Decision

Graphs is a new pure-consumer client plugin, `@coco-harness/cch-client-ui-graphs`, registering one `'conversation.view'` slot entry (id `graphs`, order 11, directly after Trajectory's 10). It derives its data from the `'trajectory'` target snapshot that ui-trajectory assembles — it registers no ConversationViewBuilder and no event Definitions of its own, so the two tabs share one authoritative fold of the session window and the graph cannot disagree with the ledger.

The derivation (`graph-model.ts`) is pure: finalized nodes become a sequential node/edge chain grouped one mermaid subgraph per turn; the in-flight partial becomes a `Thinking` node and each running tool call a running-tool node appended at the tail; `live` is true while either exists. Progress-neutral entries (context, model-retry, turn-max-tokens, unknown) add no node. `sessionGraphMermaid` serializes with per-kind classDefs; while live, every node also carries the `live` class.

Rendering (`MermaidDiagram.tsx`) lazily imports mermaid (strict security level), re-renders the SVG when the serialized document changes, diffs mermaid's deterministic node element ids against the previous render, and adds a `graphs-new` class to new nodes (pop-in animation) while a CSS pulse runs on live nodes. Labels are sanitized and truncated; ids are restricted to `[A-Za-z0-9_]`.

Because the plugin loader fetches exactly one `lib/client.js`, the shared tsdown client preset gained a `client` overrides option (mirroring `lib`), which ui-graphs uses to set `inlineDynamicImports: true`; without it, mermaid's lazy diagram modules emitted 178 sibling chunk files the browser loader cannot resolve.

`TrajectorySnapshot` is now exported type-only from ui-trajectory's `/client` entry (sanctioned shared-type export) so ui-graphs types `views.get('trajectory')` without reaching into another package's internals.

## Alternatives considered

**Own ConversationViewDefinition with its own event fold** — rejected. It would duplicate the trajectory fold and let the two tabs drift; riding the existing target costs one type-only dependency and zero runtime coupling.

**Animate inside one persistent SVG** — rejected. Mermaid has no incremental update API; the deterministic-id diff after each full re-render gives the new-node pop-in without owning a diffing engine.

**Mermaid core / flowchart-only build** — rejected. Mermaid's export map has no core entry, so the browser artifact carries the full engine (~7 MB inlined); recorded as a package limitation.

## Consequences

The Graphs tab appears in every web-app session beside Trajectory and updates on every snapshot change. Without ui-trajectory composed, the tab renders its localized empty state rather than failing. The mermaid rendering and its full-engine payload are superseded by the React Flow canvas ([superseding note](2026-08-19-graphs-explorable-react-flow-canvas.md)); the tab, its data source, and its slot registration are unchanged. Testing rides jsdom view specs with a mocked mermaid engine (the real engine is exercised by the built-artifact bundle spec through the loader handoff), which the per-file coverage gate fully covers.
