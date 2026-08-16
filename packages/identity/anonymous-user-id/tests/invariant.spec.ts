import { describe, expect, it } from 'vitest'
import { Context } from '@coco-harness/cordis'
import InvariantRegistry from '@coco-harness/cch-invariants'
import * as UserIdInvariant from '@coco-harness/cch-anonymous-user-id/invariant'

describe('invariant companion', () => {
  it('registers the package ownership with an empty installer', async () => {
    const ctx = new Context()
    await ctx.plugin(InvariantRegistry, { enabled: true })
    await expect(ctx.plugin(UserIdInvariant).await()).resolves.toBeDefined()
  })
})
