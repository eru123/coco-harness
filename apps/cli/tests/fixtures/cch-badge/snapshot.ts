import { fileURLToPath } from 'node:url'
import { Context } from '@coco-harness/cordis'
import { agentEvents, Inbox, type Agent } from '@coco-harness/cch-agent'
import { CallId } from '@coco-harness/cch-llm'
import { boot, loadOverlayPatches } from '@coco-harness/cch-app-boot'
import { SessionId } from '@coco-harness/cch-session'
import type {} from '@coco-harness/cch-skill'
import type {} from '@coco-harness/cch-tools'

const overlayPath = process.argv[2]
if (overlayPath === undefined) throw new Error('cch-badge snapshot requires an overlay path')
const rootConfigPath = fileURLToPath(new URL('../../../../../packages/bundle/base/tests/fixtures/root.cordis.yml', import.meta.url))
const basePatchPath = fileURLToPath(new URL('../../../../../packages/bundle/base/cordis.patch.yml', import.meta.url))
const ctx = await boot('cch-badge-snapshot', rootConfigPath, [
  ...loadOverlayPatches('cch-badge-snapshot', basePatchPath),
  ...loadOverlayPatches('cch-badge-snapshot', overlayPath),
])

try {
  const agentId = SessionId('cch-badge-snapshot')
  const session = ctx.sessions.create(agentId, { meta: { cwd: process.cwd() } })
  const agent: Agent = {
    ctx: new Context(),
    id: agentId,
    options: {},
    session,
    inbox: new Inbox(session, { inserted: () => {}, discarded: () => {}, claimed: () => {} }),
    status: 'idle',
    send: () => {},
    followup: () => {},
    steer: () => {},
    inject: () => { throw new Error('cch-badge snapshot must receive the catalog at the step boundary') },
    cancel: () => {},
    runMaintenance: job => job(new AbortController().signal),
    whenIdle: () => Promise.resolve(),
  }
  const decision = await agentEvents(ctx, agent).waterfall(
    'agent/pre-step',
    { messages: [], turn: 1, step: 1, signal: new AbortController().signal },
    () => Promise.resolve({ kind: 'enter' as const, messages: [] }),
  )
  const catalog = decision.kind === 'enter'
    ? decision.messages.find(message => message.role === 'user'
      && message.source.kind === 'skill-catalog')?.content
    : undefined
  const summary = (await ctx.skills.list()).find(skill => skill.name === 'cch-badge')
  const result = await ctx.tools.execute({
    callId: CallId('cch-badge-snapshot'),
    name: 'skill',
    arguments: { name: 'cch-badge' },
    signal: new AbortController().signal,
  })
  process.stdout.write(`${JSON.stringify({ catalog: catalog ?? null, summary: summary ?? null, result })}\n`)
} finally {
  await ctx.fiber.dispose()
}
