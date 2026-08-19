/**
 * Pure derivation of the delegation tree: the sessions list's parentage
 * (`parentId` summaries) folded into a tree rooted at the current session's
 * topmost ancestor, so both the session's own subagents and its sibling
 * context appear. This is the graph-shaped data a node canvas is for — the
 * per-session step chain is not.
 */
import type { SessionId, SessionListState, SessionSummary } from '@coco-harness/cch-client-runtime/client'

/** Node status accent derived from the summary's live bits. */
export type DelegationStatus = 'running' | 'awaiting' | 'done' | 'idle'

/** One session node in the delegation tree. */
export interface DelegationNode {
  readonly id: SessionId
  readonly title: string
  readonly preset?: string
  readonly status: DelegationStatus
  /** Tree depth; 0 is the root. */
  readonly depth: number
  /** True when this node is the session the tab belongs to. */
  readonly current: boolean
  readonly children: readonly DelegationNode[]
}

/** The derived tree plus flat ordering for layout. */
export interface DelegationModel {
  readonly root: DelegationNode | null
  /** Every node in depth-first order. */
  readonly nodes: readonly DelegationNode[]
  /** Parent→child edges by node id. */
  readonly edges: readonly { readonly from: SessionId; readonly to: SessionId }[]
}

function statusOf(summary: SessionSummary): DelegationStatus {
  if (summary.pendingInteraction !== undefined) return 'awaiting'
  if (summary.running) return 'running'
  if (summary.completed) return 'done'
  return 'idle'
}

/**
 * Fold the sessions list into the delegation tree of the current session.
 * @param sessions - the sessions list state (`byId` carries parentage).
 * @param sessionId - the session this tab renders.
 * @returns the tree rooted at the topmost ancestor (or the session itself
 *   when it has none); `root` null when the summary is not in the list.
 */
export function deriveDelegation(
  sessions: SessionListState,
  sessionId: SessionId | undefined,
): DelegationModel {
  if (sessionId === undefined) return { root: null, nodes: [], edges: [] }
  const self = sessions.byId[sessionId]
  if (self === undefined) return { root: null, nodes: [], edges: [] }

  // Walk to the topmost KNOWN ancestor: a parent the list does not carry
  // (pruned/adoption edge) ends the climb at the highest known session.
  let root = self
  const seen = new Set<SessionId>([sessionId])
  for (let cursor = self; cursor.parentId !== undefined && !seen.has(cursor.parentId); ) {
    const parent = sessions.byId[cursor.parentId]
    if (parent === undefined) break
    seen.add(parent.id)
    root = parent
    cursor = parent
  }

  const childrenOf = new Map<SessionId, SessionSummary[]>()
  for (const summary of Object.values(sessions.byId)) {
    if (summary.parentId === undefined) continue
    childrenOf.set(summary.parentId, [...(childrenOf.get(summary.parentId) ?? []), summary])
  }

  const nodes: DelegationNode[] = []
  const edges: { from: SessionId; to: SessionId }[] = []
  const build = (summary: SessionSummary, depth: number): DelegationNode => {
    // The node holds this array by reference; filling it after the preorder
    // push keeps the flat listing parent-first without a readonly mutation.
    const children: DelegationNode[] = []
    const node: DelegationNode = {
      id: summary.id,
      title: summary.displayTitle,
      ...summary.agentPreset !== undefined ? { preset: summary.agentPreset } : {},
      status: statusOf(summary),
      depth,
      current: summary.id === sessionId,
      children,
    }
    nodes.push(node)
    const childSummaries = [...(childrenOf.get(summary.id) ?? [])]
      .sort((a, b) => a.id.localeCompare(b.id))
    for (const child of childSummaries) {
      edges.push({ from: summary.id, to: child.id })
      children.push(build(child, depth + 1))
    }
    return node
  }
  return { root: build(root, 0), nodes, edges }
}
