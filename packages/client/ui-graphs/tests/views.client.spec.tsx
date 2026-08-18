// @vitest-environment jsdom
/**
 * View acceptance on the real framework stack: the plugin fiber registers
 * the Graphs tab into a real SlotRegistry view ring (label locale-aware,
 * disposal removes it), and the view renders the live mermaid projection —
 * empty state for a blank session, animated node diff on streaming updates,
 * and the raw-code fallback when mermaid rendering fails.
 */
import { Context } from '@coco-harness/cordis'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, waitFor } from '@testing-library/react'
import { createElement } from 'react'
import { bindSnapshotSelector } from '@coco-harness/cch-client-web-react'
import { resolveSlotLabel } from '@coco-harness/cch-client-ui-slots'
import type { LocaleKeysOf } from '@coco-harness/cch-client-ui-slots'
import {
  createSnapshotStore, EMPTY_CHAT_SNAPSHOT, SlotRegistry,
} from '@coco-harness/cch-client-runtime/client'
import type {
  ConversationSnapshot, SessionId, SessionListState, WorkspaceListState,
} from '@coco-harness/cch-client-runtime/client'
import type { ConvViewProps } from '@coco-harness/cch-client-ui-conversation/client'
import type { TrajectorySnapshot } from '@coco-harness/cch-client-ui-trajectory/client'
import { apply as localeApply, inject as localeInject } from '@coco-harness/cch-client-locale/client'
import { stubSettingsScope } from '@coco-harness/cch-client-test-runtime'
import { en, type GraphsKey } from '../src/client/locales.ts'
import { apply, inject } from '@coco-harness/cch-client-ui-graphs/client'
import { GraphsView } from '../src/client/GraphsView.tsx'
import { MermaidDiagram } from '../src/client/MermaidDiagram.tsx'

const mocks = vi.hoisted(() => ({
  render: vi.fn(async (_id: string, code: string) => ({
    svg: `<svg>${[...code.matchAll(/^  ([A-Za-z0-9_]+)\["/gm)]
      .map(match => `<g class="node" id="flowchart-${match[1]}-0"><rect/></g>`)
      .join('')}</svg>`,
  })),
}))

vi.mock('mermaid', () => ({ default: { initialize: vi.fn(), render: mocks.render } }))

const SID = 's1' as SessionId
const t = (key: LocaleKeysOf<'graphs'>): string => en[key as GraphsKey] ?? key

const NODES: ConversationSnapshot['nodes'] = [
  { kind: 'user', seq: 1, time: 1_000, content: [{ type: 'text', text: 'hello' } as never], source: null },
  { kind: 'assistant', seq: 2, time: 2_000, turn: 1, step: 1, blocks: [] },
]

function historySnapshot(trajectory: Partial<TrajectorySnapshot> = {}): ConversationSnapshot {
  const target: TrajectorySnapshot = {
    eventNodes: NODES,
    eventLocations: new Map(),
    requests: [],
    callSchemas: new Map(),
    partial: null,
    runningCalls: [],
    ...trajectory,
  }
  return {
    sessionId: SID,
    views: { get: name => name === 'trajectory' ? target : undefined },
    chat: EMPTY_CHAT_SNAPSHOT,
    nodes: NODES,
    turnTimings: new Map(),
    turnEnds: new Map(),
    partial: target.partial,
    runningCalls: target.runningCalls,
    pending: [],
    queue: [],
    running: false,
    subagent: null,
    composerPhase: 'active',
    removed: false,
    openState: 'open',
    openError: null,
    hasMore: false,
    loadingOlder: false,
    promptError: null,
    blank: false,
    lastAgentError: null,
  }
}

function emptyGlobalHooks() {
  return {
    useSessions: bindSnapshotSelector(createSnapshotStore<SessionListState>(
      { ids: [], byId: {}, current: undefined, phase: 'ready', subagentsByParent: {}, jobsBySession: {}, currentAddress: undefined })),
    useWorkspaces: bindSnapshotSelector(createSnapshotStore<WorkspaceListState>(
      { items: [], archivedSessionIds: [], state: 'idle', phase: 'ready', error: null, baselinesReady: true, recentWorkspaceId: undefined })),
  }
}

/** Standalone view props: the session-scope standard kit the outlet would bake. */
function standaloneProps(snapshot: ConversationSnapshot): ConvViewProps & { t: (key: LocaleKeysOf<'graphs'>) => string } {
  return {
    sessionId: SID,
    useSession: bindSnapshotSelector(createSnapshotStore(snapshot)),
    useProjection: (() => undefined) as never,
    t,
    ...emptyGlobalHooks(),
  } as unknown as ConvViewProps & { t: (key: LocaleKeysOf<'graphs'>) => string }
}

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

describe('GraphsView', () => {
  it('renders the mermaid projection of the session window', async () => {
    const { container } = render(createElement(GraphsView, standaloneProps(historySnapshot())))
    await waitFor(() => {
      expect(container.querySelectorAll('g.node')).toHaveLength(2)
    })
    expect((container.querySelector('g.node') as SVGGElement).classList.contains('graphs-new'))
      .toBe(true)
  })

  it('animates only newly added nodes across streaming updates', async () => {
    const store = createSnapshotStore(historySnapshot())
    const { container } = render(createElement(GraphsView, {
      ...standaloneProps(store.getSnapshot()),
      useSession: bindSnapshotSelector(store),
    }))
    await waitFor(() => { expect(container.querySelectorAll('g.node')).toHaveLength(2) })
    await actStore(store, historySnapshot({
      runningCalls: [{ callId: 'x', name: 'bash', argsRaw: '', turn: 1, step: 1, time: 3_000, callView: null, subCalls: [] }],
    }))
    await waitFor(() => { expect(container.querySelectorAll('g.node')).toHaveLength(3) })
    const nodes = [...container.querySelectorAll<SVGGElement>('g.node')]
    expect(nodes.filter(node => node.classList.contains('graphs-new')).map(node => node.id))
      .toEqual(['flowchart-rx-0'])
  })

  it('shows the localized empty state for a blank session', () => {
    const blank = historySnapshot({ eventNodes: [], partial: null, runningCalls: [] })
    const { container } = render(createElement(GraphsView, standaloneProps(blank)))
    expect(container.textContent).toBe(en['view.empty'])
  })

  it('falls back to the empty trajectory target when the view is absent', () => {
    const withoutTarget = { ...historySnapshot(), views: { get: () => undefined } } as never
    const { container } = render(createElement(GraphsView, standaloneProps(withoutTarget)))
    expect(container.textContent).toBe(en['view.empty'])
  })

  it('drops a pending render when unmounted before it resolves', async () => {
    const settleFns: Array<(result: { svg: string } | Error) => void> = []
    mocks.render.mockImplementation(() => new Promise((resolve, reject) => {
      settleFns.push((result) => {
        if (result instanceof Error) {
          reject(result)
          return
        }
        resolve(result)
      })
    }))
    const first = render(createElement(MermaidDiagram, {
      code: 'flowchart TD\n  a["A"]',
      errorLabel: t('view.renderError'),
    }))
    await waitFor(() => { expect(mocks.render).toHaveBeenCalledTimes(1) })
    first.unmount()
    const firstSettle = settleFns[0]
    if (firstSettle !== undefined) firstSettle({ svg: '<svg><g class="node" id="flowchart-a-0"/>' })
    const second = render(createElement(MermaidDiagram, {
      code: 'flowchart TD\n  b["B"]',
      errorLabel: t('view.renderError'),
    }))
    await waitFor(() => { expect(mocks.render).toHaveBeenCalledTimes(2) })
    second.unmount()
    const secondSettle = settleFns[1]
    if (secondSettle !== undefined) secondSettle(new Error('late failure'))
    await new Promise((resolve) => { setTimeout(resolve, 0) })
  })

  it('runs the host loader entry as a no-op apply', async () => {
    const host = await import('@coco-harness/cch-client-ui-graphs')
    host.apply()
    expect(host.apply).toBeTypeOf('function')
  })

  it('falls back to the raw document with the error label when rendering fails', async () => {
    mocks.render.mockRejectedValueOnce(new Error('boom'))
    const { container } = render(createElement(MermaidDiagram, {
      code: 'flowchart TD\n  a["A"]',
      errorLabel: t('view.renderError'),
    }))
    await waitFor(() => { expect(container.querySelector('[role="alert"]')).not.toBeNull() })
    expect(container.textContent).toContain(en['view.renderError'])
    expect(container.textContent).toContain('flowchart TD')
  })
})

/** Advance one store write inside the React act boundary. */
async function actStore(
  store: ReturnType<typeof createSnapshotStore<ConversationSnapshot>>,
  next: ConversationSnapshot,
): Promise<void> {
  const { act } = await import('@testing-library/react')
  await act(async () => {
    store.set(next)
  })
}

describe('plugin registration', () => {
  it('registers and disposes the graphs tab on the real view ring', async () => {
    const ctx = new Context()
    const slots = new SlotRegistry(ctx)
    ctx.provide('connection', { api: { settings: {} }, isLoopback: false } as never)
    ctx.provide('remote', { $on: () => () => {} } as never)
    ctx.provide('settingsScope', { bind: () => stubSettingsScope().scope } as never)
    ctx.plugin({ inject: [...localeInject], apply: localeApply })
    slots.register({
      name: 'root',
      children: { 'conversation.view': { kind: 'list', scope: 'session' } },
    }, (_p: { renderSlot?: unknown }) => null)
    const fiber = ctx.plugin({ inject: [...inject], apply })
    await fiber.await()
    const entries = slots.entries('conversation.view')
    expect(entries.map(entry => entry.options.id)).toEqual(['graphs'])
    expect(resolveSlotLabel(entries[0]!.options.label)).toBe('Graphs')
    await fiber.dispose()
    expect(slots.entries('conversation.view')).toHaveLength(0)
  })
})
