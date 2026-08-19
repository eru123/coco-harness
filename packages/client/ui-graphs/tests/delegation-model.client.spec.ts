/**
 * Delegation tree derivation: parentage summaries fold into a tree rooted at
 * the current session's topmost known ancestor, status accents rank
 * awaiting/running/done, and the current session is flagged wherever it sits.
 */
import { describe, expect, it } from 'vitest'
import type { SessionId, SessionListState, SessionSummary } from '@coco-harness/cch-client-runtime/client'
import { deriveDelegation } from '../src/client/delegation-model.ts'

function summary(id: string, overrides: Partial<SessionSummary> = {}): SessionSummary {
  return {
    id: id as SessionId,
    displayTitle: id,
    running: false,
    ...overrides,
  } as SessionSummary
}

function list(summaries: SessionSummary[]): SessionListState {
  return {
    ids: summaries.map(item => item.id),
    byId: Object.fromEntries(summaries.map(item => [item.id, item])),
    current: undefined,
    phase: 'ready',
    subagentsByParent: {},
    jobsBySession: {},
    currentAddress: undefined,
  } as SessionListState
}

describe('deriveDelegation', () => {
  it('roots at the topmost ancestor and nests children depth-first', () => {
    const model = deriveDelegation(list([
      summary('main'),
      summary('child-a', { parentId: 'main' as SessionId }),
      summary('grandchild', { parentId: 'child-a' as SessionId }),
      summary('child-b', { parentId: 'main' as SessionId }),
    ]), 'grandchild' as SessionId)
    expect(model.root!.id).toBe('main')
    expect(model.nodes.map(node => node.id)).toEqual(['main', 'child-a', 'grandchild', 'child-b'])
    expect(model.edges).toEqual([
      { from: 'main' as SessionId, to: 'child-a' as SessionId },
      { from: 'child-a' as SessionId, to: 'grandchild' as SessionId },
      { from: 'main' as SessionId, to: 'child-b' as SessionId },
    ])
    expect(model.nodes.find(node => node.id === 'grandchild')).toMatchObject({ depth: 2, current: true })
    expect(model.nodes.find(node => node.id === 'main')).toMatchObject({ depth: 0, current: false })
  })

  it('stops the ancestry climb at a parent the list does not carry', () => {
    const model = deriveDelegation(list([
      summary('orphan', { parentId: 'pruned' as SessionId }),
    ]), 'orphan' as SessionId)
    expect(model.root!.id).toBe('orphan')
  })

  it('ranks status: awaiting a person above running above done above idle', () => {
    const model = deriveDelegation(list([
      summary('root'),
      summary('waiting', { parentId: 'root' as SessionId, pendingInteraction: 'approval' as never, running: true }),
      summary('busy', { parentId: 'root' as SessionId, running: true }),
      summary('finished', { parentId: 'root' as SessionId, completed: true }),
      summary('still', { parentId: 'root' as SessionId }),
    ]), 'root' as SessionId)
    const byStatus = new Map(model.nodes.map(node => [node.id as string, node.status]))
    expect(byStatus.get('waiting')).toBe('awaiting')
    expect(byStatus.get('busy')).toBe('running')
    expect(byStatus.get('finished')).toBe('done')
    expect(byStatus.get('still')).toBe('idle')
  })

  it('returns an empty model without a session or an unknown summary', () => {
    expect(deriveDelegation(list([]), undefined).root).toBeNull()
    expect(deriveDelegation(list([summary('other')]), 'missing' as SessionId).root).toBeNull()
  })
})
