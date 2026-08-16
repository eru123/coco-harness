import { describe, expect, it } from 'vitest'
import { Context } from '@coco-harness/cordis'
import * as ModelsInvariant from '@coco-harness/cch-client-ui-settings-models/invariant'
import InvariantRegistry from '@coco-harness/cch-invariants'
import { ModelsSection } from '../src/client/ModelsSection.tsx'

describe('invariant companion', () => {
  it('registers under the package name with an empty installer', async () => {
    const ctx = new Context()
    await ctx.plugin(InvariantRegistry, { enabled: true })
    await expect(ctx.plugin(ModelsInvariant).await()).resolves.toBeDefined()
  })

  it('node-half apply is a no-op host placeholder', async () => {
    const { apply } = await import('@coco-harness/cch-client-ui-settings-models')
    apply()
    expect(true).toBe(true) // reaching here without throw is the contract
  })

  it('renders null until the shell injects the section dependencies', () => {
    expect(ModelsSection({})).toBeNull()
  })
})
