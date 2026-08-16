import { describe, expect, it } from 'vitest'
import { Context } from '@coco-harness/cordis'
import * as AttachmentInvariant from '@coco-harness/cch-client-ui-attachment/invariant'
import InvariantRegistry from '@coco-harness/cch-invariants'

describe('invariant companion', () => {
  it('registers under the package name with an empty installer', async () => {
    const ctx = new Context()
    await ctx.plugin(InvariantRegistry, { enabled: true })
    await expect(ctx.plugin(AttachmentInvariant).await()).resolves.toBeDefined()
  })
})
