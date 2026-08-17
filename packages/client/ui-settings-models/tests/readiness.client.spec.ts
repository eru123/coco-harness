/** Pure provider-usability projection over the shared Models join. */
import { describe, expect, it } from 'vitest'
import type { CredentialView } from '@coco-harness/cch-api-remotes/client'
import type { ProviderRow } from '../src/client/store.ts'
import { providerUsable } from '../src/client/store.ts'

const missingCredential: CredentialView = { configured: false, writable: true }
const storedCredential: CredentialView = { configured: true, writable: true }

function row(overrides: Partial<ProviderRow> = {}): ProviderRow {
  return {
    entry: {
      provider: 'deepseek-official',
      displayName: 'DeepSeek',
      settingsNs: 'llm-deepseek',
      settingsPath: [],
      active: true,
    },
    configured: true,
    removable: false,
    apiKeyEnv: 'DEEPSEEK_API_KEY',
    credential: storedCredential,
    ...overrides,
  }
}

describe('providerUsable', () => {
  it('requires a registered route and a stored key for every named reference', () => {
    expect(providerUsable(row())).toBe(true)
    expect(providerUsable(row({ entry: { ...row().entry, active: false } }))).toBe(false)
    expect(providerUsable(row({ credential: missingCredential }))).toBe(false)
    expect(providerUsable(row({ credential: undefined }))).toBe(false)
  })

  it('treats a reference-free registered route as provider-native authentication', () => {
    expect(providerUsable(row({ apiKeyEnv: undefined, credential: undefined }))).toBe(true)
  })
})
