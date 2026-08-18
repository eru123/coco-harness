# @coco-harness/cch-client-ui-graphs

Graphs adds a third conversation view tab (beside Chat and Trajectory) that renders the session's progress live as a mermaid flowchart. The pure derivation in `graph-model.ts` folds the shared trajectory view snapshot — finalized user/steering messages, assistant steps, tool results, commands, compactions, and turn errors — plus the in-flight partial and running tool calls into a sequential node/edge model, grouped one subgraph per turn. Progress-neutral ledger entries (context injections, scheduled retries, max-token notices, unknown surface events) add no node. While the session has in-flight work, every node carries the `live` class and a `Thinking`/running-tool node closes the chain, so the rendered graph names what remains before the session finishes.

The view renders through the mermaid engine (lazily imported, inlined into the single `lib/client.js` browser artifact). Each snapshot change re-derives the document and re-renders the SVG; nodes new since the previous render pop in, and live nodes pulse, through module CSS keyed off mermaid's own class names. A blank session shows a localized empty state, and a mermaid rendering failure falls back to the raw document with an error label.

The package is a pure consumer: it provides no service, declares no Context merge, and registers no session events — it reads the `'trajectory'` target snapshot assembled by `@coco-harness/cch-client-ui-trajectory` (composed before it in the web app) and contributes one `'conversation.view'` slot entry. Without ui-trajectory composed, the tab renders the empty state. Contract: api-contracts v3 §8.

## Model Experience

None, as the graphs view renders session data in the browser; nothing here reaches a model request.

#### KV Cache effect

None; this package neither assembles nor sends a provider request.

## Known Limitations and Deferred Work

- **Full mermaid payload** — the browser artifact inlines the whole mermaid engine (~7 MB) because the plugin loader resolves exactly one `lib/client.js`; a flowchart-only build would need a mermaid core entry point that upstream does not export.
- **Full re-render per change** — mermaid has no incremental update, so each streaming change replaces the SVG; only the node-diff animation distinguishes new nodes. Very long sessions re-render the whole graph per change.
- **Snapshot-graph pan/zoom** — the diagram scrolls but has no pan/zoom controls; large graphs rely on browser scrolling only.
