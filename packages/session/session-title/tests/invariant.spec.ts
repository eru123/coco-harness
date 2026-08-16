// Title-source invariant: `messageSeqs` is empty iff `source.kind` is `user`.
// — the durable relationship every appended session/title event must keep.
import { describe, expect, it } from 'vitest'
import { Context } from '@coco-harness/cordis'
import * as SessionTitleInvariantCompanion from '@coco-harness/cch-session-title/invariant'
import InvariantRegistry, { InvariantError } from '@coco-harness/cch-invariants'
import SessionStore, { SessionId } from '@coco-harness/cch-session'

async function setup(): Promise<Context> {
  const ctx = new Context()
  await ctx.plugin(SessionStore)
  await ctx.plugin(InvariantRegistry, { enabled: true })
  await ctx.plugin(SessionTitleInvariantCompanion)
  return ctx
}

describe('session-title source invariant', () => {
  it('accepts cited automatic titles and citation-free user renames', async () => {
    const ctx = await setup()
    const session = ctx.sessions.create(SessionId('title-invariant-valid'))
    expect(() => {
      session.append('session/title', { title: 'auto', messageSeqs: [1], source: { kind: 'fallback' } })
      session.append('session/title', { title: 'named', messageSeqs: [], source: { kind: 'user' } })
    }).not.toThrow()
  })

  it('rejects a citation-free automatic title and a user rename that cites messages', async () => {
    const ctx = await setup()
    const session = ctx.sessions.create(SessionId('title-invariant-invalid'))
    expect(() => {
      session.append('session/title', { title: 'auto', messageSeqs: [], source: { kind: 'fallback' } })
    }).toThrow(expect.objectContaining<Partial<InvariantError>>({
      code: 'INVARIANT',
      packageName: '@coco-harness/cch-session-title',
    }))
    expect(() => {
      session.append('session/title', { title: 'named', messageSeqs: [1], source: { kind: 'user' } })
    }).toThrow(expect.objectContaining<Partial<InvariantError>>({
      code: 'INVARIANT',
      packageName: '@coco-harness/cch-session-title',
    }))
    expect(session.seq).toBe(0)
  })
})
