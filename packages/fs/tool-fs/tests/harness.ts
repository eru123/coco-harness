import { Context } from '@coco-harness/cordis'
import type { Agent } from '@coco-harness/cch-agent'
import AgentLoop from '@coco-harness/cch-agent-loop'
import { mountAgentLoopTestDependencies } from '@coco-harness/cch-agent-loop-testkit'
import LocalFileSystem from '@coco-harness/cch-fs-local'
import * as FsPolicy from '@coco-harness/cch-fs-observation-policy'
import * as ToolFs from '@coco-harness/cch-tool-fs'
import * as LlmDeepSeek from '@coco-harness/cch-llm-deepseek'

/**
 * Build the real fs-tool stack for with-key e2e tests. Agents have no session
 * cwd, so `fsCwd` is their workspace; `persona` configures the deployment prompt.
 * This helper lives outside the e2e glob so imports do not register tests.
 */
export async function fsHarness(fsCwd: string, persona = ''): Promise<Context> {
  const ctx = new Context()
  await mountAgentLoopTestDependencies(ctx, { systemPrompt: { persona } })
  await ctx.plugin(AgentLoop, { agents: [] })
  await ctx.plugin(LlmDeepSeek)
  await ctx.plugin(LocalFileSystem, { cwd: fsCwd })
  await ctx.plugin(FsPolicy)
  await ctx.plugin(ToolFs)
  return ctx
}

export function waitForIdle(ctx: Context, agent: Agent): Promise<void> {
  return new Promise((resolve) => {
    const dispose = ctx.on('agent/status', ({ agent: subject, status }) => {
      if (subject === agent && status === 'idle') {
        dispose()
        resolve()
      }
    })
  })
}
