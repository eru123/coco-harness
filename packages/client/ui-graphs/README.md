# @coco-harness/cch-client-ui-graphs

Graphs adds a third conversation view tab (beside Chat and Trajectory) with two visualizations of the agentic workflow behind a mode switch, each matched to data of its own shape:

- **Timeline (default)** — the per-session trace as a turn-based waterfall (`timeline-model.ts`): each turn is a scaled group on a shared time axis, tool calls are bars spanning call-start to result, the in-flight partial and running calls grow live on a one-second tick, and overlapping calls stack into swimlanes (interval-graph coloring) so parallel work reads as parallel. Instantaneous events (prompts, responses, errors) render as point markers. This is the shape agent-tracing tools use for session data, which is temporal and mostly sequential — a node graph renders it as one long undifferentiated chain.
- **Delegation** — the cross-session tree on the explorable React Flow canvas (`delegation-model.ts`): parentage summaries (`parentId` on the session list) fold into a tree rooted at the current session's topmost known ancestor, so the session's subagents and its sibling context appear with status accents (awaiting a person, running, done) and arrowheaded spawning edges. This is the graph-shaped data a node canvas is for.

Both modes share an inspector panel: clicking a bar or a session card opens the item's detail beside the visualization.

The package is a pure consumer: it provides no service, declares no Context merge, and registers no session events — it reads the `'trajectory'` target snapshot assembled by `@coco-harness/cch-client-ui-trajectory` (composed before it in the web app) and contributes one `'conversation.view'` slot entry. Without ui-trajectory composed, the tab renders the empty state. Contract: api-contracts v3 §8.

React Flow's structural rules (viewport transform origin, absolute node placement, panel/controls/minimap chrome, edge dash animation) are restated as `:global` selectors in `views.module.css` against the app's theme tokens: the client-bundle CSS pipeline compiles only `.module.css` files, so the library's plain stylesheet cannot ride it.

## Model Experience

None, as the graphs view renders session data in the browser; nothing here reaches a model request.

#### KV Cache effect

None; this package neither assembles nor sends a provider request.

## Known Limitations and Deferred Work

- **No time-axis scrubbing** — the timeline scales proportionally to the full session span; pan/zoom of the axis and per-turn expansion are deferred.
- **Delegation opens no sessions** — clicking a delegation card inspects it; navigating to that session stays with the sidebar.
- **Library CSS restated** — the `:global` React Flow rules in `views.module.css` must track the library's structural classes across upgrades.
