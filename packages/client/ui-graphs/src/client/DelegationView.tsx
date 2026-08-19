/**
 * Delegation view: the sessions tree as an explorable canvas. This is the
 * graph-shaped data a node canvas is for — parent sessions and the subagents
 * they spawned — laid out in depth rows with the same layered geometry the
 * step graph used.
 */

import { useMemo } from 'react'
import { Handle, MarkerType, Position, ReactFlow, Controls } from '@xyflow/react'
import type { Edge, Node, NodeProps } from '@xyflow/react'
import type { SessionId, SessionListState } from '@coco-harness/cch-client-runtime/client'
import { deriveDelegation } from './delegation-model.ts'
import type { DelegationNode } from './delegation-model.ts'
import css from './views.module.css'

/** Status accent: amber while running, blue while awaiting a person. */
const STATUS_HUE: Record<DelegationNode['status'], string> = {
  running: 'var(--dsw-alias-state-warn-label)',
  awaiting: 'var(--dsw-alias-state-business-primary)',
  done: 'var(--dsw-alias-state-success, var(--dsw-alias-label-secondary))',
  idle: 'var(--dsw-alias-label-secondary)',
}

/** One session card's data payload. */
interface SessionCardData extends Record<string, unknown> {
  readonly session: DelegationNode
}

/** The session card rendered inside each React Flow node. */
function SessionCard({ data, selected }: NodeProps<Node<SessionCardData>>) {
  const node = data.session
  return (
    <div
      className={[
        css.card,
        css.cardSession,
        node.current ? css.cardCurrent : '',
        selected ? css.cardSelected : '',
      ].filter(Boolean).join(' ')}
      style={{ borderLeftColor: STATUS_HUE[node.status] }}
    >
      <Handle type="target" position={Position.Top} isConnectable={false} className={css.handle} />
      <div className={css.cardTop}>
        <span className={css.cardKind} style={{ color: STATUS_HUE[node.status] }}>
          ⇄ {node.status}
        </span>
        {node.current && <span className={css.cardBadge}>this session</span>}
      </div>
      <div className={css.cardTitle}>{node.title}</div>
      <Handle type="source" position={Position.Bottom} isConnectable={false} className={css.handle} />
    </div>
  )
}

const nodeTypes = { session: SessionCard }

/** Row geometry for the tree: depth rows (the model carries depth), siblings centered. */
const ROW_GAP = 44
const COLUMN_GAP = 36
const CARD_WIDTH = 220
const CARD_HEIGHT = 74

function placeTree(model: ReturnType<typeof deriveDelegation>): {
  nodes: Node<SessionCardData>[]
  edges: Edge[]
} {
  const rows = new Map<number, DelegationNode[]>()
  for (const node of model.nodes) {
    rows.set(node.depth, [...(rows.get(node.depth) ?? []), node])
  }
  const nodes: Node<SessionCardData>[] = []
  let y = 0
  for (const [, row] of [...rows.entries()].sort((a, b) => a[0] - b[0])) {
    const total = row.length * CARD_WIDTH + COLUMN_GAP * (row.length - 1)
    let x = -total / 2
    for (const node of row) {
      nodes.push({
        id: node.id as string,
        type: 'session',
        position: { x, y },
        sourcePosition: Position.Bottom,
        targetPosition: Position.Top,
        data: { session: node } satisfies SessionCardData,
        style: { width: CARD_WIDTH },
      })
      x += CARD_WIDTH + COLUMN_GAP
    }
    y += CARD_HEIGHT + ROW_GAP
  }
  const edges = model.edges.map(edge => ({
    id: `${edge.from}->${edge.to}`,
    source: edge.from as string,
    target: edge.to as string,
    markerEnd: { type: MarkerType.ArrowClosed, width: 13, height: 13 },
  }))
  return { nodes, edges }
}

/** Props of the delegation view. */
export interface DelegationViewProps {
  readonly sessions: SessionListState
  readonly sessionId: SessionId | undefined
  /** Open the shared inspector with one session node. */
  readonly onInspect: (node: DelegationNode) => void
  /** Localized empty state for a session that never delegated. */
  readonly emptyLabel: string
}

/**
 * The delegation canvas: pan/zoom the sessions tree, arrowheads state the
 * spawning direction, status accents carry liveness.
 * @param props - sessions list state, the owning session, inspector open.
 * @returns the canvas, or null when the tree is a single session.
 */
export function DelegationView({ sessions, sessionId, onInspect, emptyLabel }: DelegationViewProps) {
  const model = useMemo(() => deriveDelegation(sessions, sessionId), [sessions, sessionId])
  const { nodes, edges } = useMemo(() => placeTree(model), [model])
  if (model.nodes.length <= 1) return <div className={css.empty}>{emptyLabel}</div>
  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      nodeTypes={nodeTypes}
      fitView
      fitViewOptions={{ maxZoom: 1, padding: 0.2 }}
      minZoom={0.15}
      proOptions={{ hideAttribution: true }}
      onNodeClick={(_, node) => { onInspect(node.data.session) }}
      nodesDraggable={false}
      nodesConnectable={false}
    >
      <Controls showInteractive={false} />
    </ReactFlow>
  )
}
