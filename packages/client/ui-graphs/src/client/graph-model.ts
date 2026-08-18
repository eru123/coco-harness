/**
 * Pure derivation of a live session-progress graph: finalized conversation
 * nodes plus the in-flight partial/running calls fold into a node/edge model
 * that {@link sessionGraphMermaid} serializes as a mermaid flowchart.
 */
import type {
  ConversationNode, PartialAssistant, RunningToolCall,
} from '@coco-harness/cch-client-runtime/client'

/** Node classification driving the mermaid class (and therefore styling). */
export type SessionGraphNodeKind =
  | 'user'
  | 'steering'
  | 'assistant'
  | 'thinking'
  | 'tool'
  | 'runningTool'
  | 'command'
  | 'compaction'
  | 'error'

/** One step box in the progress graph. */
export interface SessionGraphNode {
  /** Mermaid-safe node id (alnum/underscore only). */
  readonly id: string
  readonly kind: SessionGraphNodeKind
  /** Pre-escaped display label. */
  readonly label: string
  /** Owning turn; null nodes sit outside the per-turn subgraphs. */
  readonly turn: number | null
}

/** One sequential dependency arrow between graph nodes. */
export interface SessionGraphEdge {
  readonly from: string
  readonly to: string
}

/** Folded projection of everything the session has done and is doing. */
export interface SessionGraphModel {
  readonly nodes: readonly SessionGraphNode[]
  readonly edges: readonly SessionGraphEdge[]
  /** True while the session has an in-flight partial or running tool call. */
  readonly live: boolean
}

/** Trajectory-view facts the graph derives from. */
export interface SessionGraphInput {
  readonly eventNodes: readonly ConversationNode[]
  readonly partial: PartialAssistant | null
  readonly runningCalls: readonly RunningToolCall[]
}

/** Structural slice of a text content block (the only one the preview reads). */
interface TextLike { readonly type: 'text'; readonly text: string }

/** Mermaid-id-safe token: anything an id must not carry becomes `_`. */
function idToken(raw: string): string {
  return raw.replace(/[^A-Za-z0-9_]/g, '_')
}

/** Mermaid-label-safe single line, truncated for readable boxes. */
function labelLine(raw: string): string {
  const flat = raw.replace(/[\r\n]+/g, ' ').trim()
  const escaped = flat.replace(/["#[\]{}()<>|\\]/g, ' ').replace(/\s+/g, ' ').trim()
  return escaped.length > 36 ? `${escaped.slice(0, 35)}…` : escaped
}

function textPreview(content: readonly unknown[]): string {
  for (const block of content) {
    const text = block as Partial<TextLike> | null
    if (text?.type === 'text' && typeof text.text === 'string' && text.text.trim() !== '') {
      return text.text
    }
  }
  return ''
}

/**
 * Fold one finalized conversation node into its graph node, or null for the
 * progress-neutral ledger entries (context injections, scheduled retries,
 * max-token notices, unknown surface events) that add no step to the graph.
 * @param event - one finalized conversation node.
 * @returns the graph node, or null when the event is progress-neutral.
 */
function graphNode(event: ConversationNode): SessionGraphNode | null {
  switch (event.kind) {
    case 'user': {
      const preview = labelLine(textPreview(event.content))
      return {
        id: `n${event.seq}`,
        kind: 'user',
        label: labelLine(preview === '' ? 'User' : `User: ${preview}`),
        turn: null,
      }
    }
    case 'steering': {
      const preview = labelLine(textPreview(event.content))
      return {
        id: `n${event.seq}`,
        kind: 'steering',
        label: labelLine(preview === '' ? 'Steering' : `Steering: ${preview}`),
        turn: null,
      }
    }
    case 'assistant':
      return {
        id: `t${event.turn}s${event.step}`,
        kind: 'assistant',
        label: `Turn ${event.turn} Step ${event.step}`,
        turn: event.turn,
      }
    case 'tool-result':
      return {
        id: `c${event.seq}`,
        kind: event.isError ? 'error' : 'tool',
        label: labelLine(event.call === null ? 'Tool' : event.call.name),
        turn: null,
      }
    case 'command':
      return {
        id: `n${event.seq}`,
        kind: 'command',
        label: labelLine(event.name === null ? 'Command' : `/${event.name}`),
        turn: null,
      }
    case 'compaction':
      return { id: `n${event.seq}`, kind: 'compaction', label: 'Compaction', turn: null }
    case 'turn-error':
      return {
        id: `n${event.seq}`,
        kind: 'error',
        label: labelLine(event.message === '' ? 'Error' : event.message),
        turn: event.turn,
      }
    case 'context':
    case 'model-retry':
    case 'turn-max-tokens':
    case 'unknown':
      return null
  }
}

/**
 * Fold finalized conversation nodes plus the in-flight partial and running
 * tool calls into the sequential progress graph.
 * @param input - trajectory-view facts for the current session window.
 * @returns the node/edge model; `live` reflects in-flight work.
 */
export function deriveSessionGraph(input: SessionGraphInput): SessionGraphModel {
  const nodes: SessionGraphNode[] = []
  const edges: SessionGraphEdge[] = []
  let previous: string | null = null
  const push = (node: SessionGraphNode): void => {
    nodes.push(node)
    if (previous !== null) edges.push({ from: previous, to: node.id })
    previous = node.id
  }
  for (const event of input.eventNodes) {
    const node = graphNode(event)
    if (node !== null) push(node)
  }
  const live = input.partial !== null || input.runningCalls.length > 0
  if (input.partial !== null) {
    push({
      id: `t${input.partial.turn}s${input.partial.step}p`,
      kind: 'thinking',
      label: 'Thinking',
      turn: input.partial.turn,
    })
  }
  for (const call of input.runningCalls) {
    push({
      id: `r${idToken(call.callId)}`,
      kind: 'runningTool',
      label: labelLine(call.name),
      turn: call.turn,
    })
  }
  return { nodes, edges, live }
}

const CLASS_DEFS: readonly (readonly [SessionGraphNodeKind, string])[] = [
  ['user', 'fill:#2563eb,color:#fff'],
  ['steering', 'fill:#4f46e5,color:#fff'],
  ['assistant', 'fill:#0e7490,color:#fff'],
  ['thinking', 'fill:#7c3aed,color:#fff,stroke-dasharray:4 3'],
  ['tool', 'fill:#0f766e,color:#fff'],
  ['runningTool', 'fill:#b45309,color:#fff'],
  ['command', 'fill:#6d28d9,color:#fff'],
  ['compaction', 'fill:#475569,color:#fff'],
  ['error', 'fill:#b91c1c,color:#fff'],
]

/**
 * Serialize the graph model as a mermaid flowchart definition: one subgraph
 * per turn, one class per node kind, and the `live` class on every node while
 * the session has in-flight work (the view animates that class).
 * @param model - the folded session graph.
 * @returns a complete `flowchart TD` mermaid document.
 */
export function sessionGraphMermaid(model: SessionGraphModel): string {
  const out: string[] = ['flowchart TD']
  for (const [kind, def] of CLASS_DEFS) out.push(`  classDef ${kind} ${def}`)
  out.push('  classDef live stroke:#f59e0b,stroke-width:3px')
  // Mermaid subgraph membership is positional between `subgraph` and `end`:
  // close on every turn change and reopen only for a turn whose subgraph id
  // has not been emitted yet (a turn that reappears after closing — possible
  // for in-flight calls appended after finalized turns — stays top-level
  // rather than minting a duplicate subgraph id).
  const emittedTurns = new Set<number>()
  let openTurn: number | null = null
  for (const node of model.nodes) {
    const groupable = node.turn !== null && !emittedTurns.has(node.turn)
    if (groupable && node.turn !== openTurn) {
      if (openTurn !== null) out.push('  end')
      out.push(`  subgraph T${node.turn} ["Turn ${node.turn}"]`)
      emittedTurns.add(node.turn)
      openTurn = node.turn
    } else if (node.turn !== openTurn) {
      if (openTurn !== null) out.push('  end')
      openTurn = null
    }
    out.push(`  ${node.id}["${node.label}"]`)
  }
  if (openTurn !== null) out.push('  end')
  out.push(...model.nodes.map(node =>
    `  class ${node.id} ${model.live ? `${node.kind},live` : node.kind}`))
  for (const edge of model.edges) out.push(`  ${edge.from} --> ${edge.to}`)
  return out.join('\n')
}
