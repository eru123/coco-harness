// @vitest-environment jsdom
/**
 * View acceptance on the real framework stack: the plugin fiber registers
 * the Graphs tab into a real SlotRegistry view ring (label locale-aware,
 * disposal removes it), and the shell renders the two modes — the timeline
 * waterfall with duration bars and lane stacking, and the delegation canvas
 * with session cards over real parentage.
 */
import { Context } from '@coco-harness/cordis'
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { act, cleanup, fireEvent, render, waitFor } from '@testing-library/react'
import { createElement } from 'react'
import { bindSnapshotSelector } from '@coco-harness/cch-client-web-react'
import { resolveSlotLabel } from '@coco-harness/cch-client-ui-slots'
import type { LocaleKeysOf } from '@coco-harness/cch-client-ui-slots'
import {
  createSnapshotStore, EMPTY_CHAT_SNAPSHOT, SlotRegistry,
} from '@coco-harness/cch-client-runtime/client'
import type {
  ConversationSnapshot, SessionId, SessionListState, SessionSummary, WorkspaceListState,
} from '@coco-harness/cch-client-runtime/client'
import type { ConvViewProps } from '@coco-harness/cch-client-ui-conversation/client'
import type { TrajectorySnapshot } from '@coco-harness/cch-client-ui-trajectory/client'
import { apply as localeApply, inject as localeInject } from '@coco-harness/cch-client-locale/client'
import { stubSettingsScope } from '@coco-harness/cch-client-test-runtime'
import { en, type GraphsKey } from '../src/client/locales.ts'
import { apply, inject } from '@coco-harness/cch-client-ui-graphs/client'
import { GraphsView } from '../src/client/GraphsView.tsx'
import { TimelineView } from '../src/client/TimelineView.tsx'

// jsdom implements neither browser API React Flow needs at import/measure
// time; the stubs are inert (never fire), which fitView tolerates.
beforeAll(() => {
  vi.stubGlobal('ResizeObserver', class {
    observe(): void {}
    unobserve(): void {}
    disconnect(): void {}
  })
  vi.stubGlobal('DOMMatrixReadOnly', class {
    m22 = 1
  })
})

const SID = 's1' as SessionId
const t = (key: LocaleKeysOf<'graphs'>): string => en[key as GraphsKey] ?? key

const NODES: ConversationSnapshot['nodes'] = [
  { kind: 'user', seq: 1, time: 1_000, content: [{ type: 'text', text: 'hello' } as never], source: null },
  { kind: 'assistant', seq: 2, time: 2_000, turn: 1, step: 1, blocks: [] },
  {
    kind: 'tool-result', seq: 3, time: 5_000, callId: 'c/1', callTime: 2_100,
    call: { name: 'bash', argsRaw: '' }, content: [], isError: false,
    callView: null, resultView: null, subCalls: [],
  },
]

function historySnapshot(
  overrides: {
    trajectory?: Partial<TrajectorySnapshot>
    running?: boolean
    turnTimings?: ConversationSnapshot['turnTimings']
    omitTrajectory?: boolean
  } = {},
): ConversationSnapshot {
  const target: TrajectorySnapshot = {
    eventNodes: NODES,
    eventLocations: new Map(),
    requests: [],
    callSchemas: new Map(),
    partial: null,
    runningCalls: [],
    ...overrides.trajectory,
  }
  return {
    sessionId: SID,
    views: {
      get: name => overrides.omitTrajectory === true
        ? undefined
        : name === 'trajectory' ? target : undefined,
    },
    chat: EMPTY_CHAT_SNAPSHOT,
    nodes: NODES,
    turnTimings: overrides.turnTimings ?? new Map([[1, { startTime: 2_000, endTime: 5_000 }]]),
    turnEnds: new Map(),
    partial: target.partial,
    runningCalls: target.runningCalls,
    pending: [],
    queue: [],
    running: overrides.running ?? false,
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

function sessionsState(summaries: SessionSummary[]): SessionListState {
  return {
    ids: summaries.map(item => item.id),
    byId: Object.fromEntries(summaries.map(item => [item.id, item])),
    current: SID,
    phase: 'ready',
    subagentsByParent: {},
    jobsBySession: {},
    currentAddress: undefined,
  } as SessionListState
}

/** Standalone view props: the session-scope standard kit the outlet would bake. */
function standaloneProps(snapshot: ConversationSnapshot, sessions: SessionListState): ConvViewProps & { t: (key: LocaleKeysOf<'graphs'>) => string } {
  return {
    sessionId: SID,
    useSession: bindSnapshotSelector(createSnapshotStore(snapshot)),
    useProjection: (() => undefined) as never,
    t,
    useSessions: bindSnapshotSelector(createSnapshotStore(sessions)),
    useWorkspaces: bindSnapshotSelector(createSnapshotStore<WorkspaceListState>(
      { items: [], archivedSessionIds: [], state: 'idle', phase: 'ready', error: null, baselinesReady: true, recentWorkspaceId: undefined })),
  } as unknown as ConvViewProps & { t: (key: LocaleKeysOf<'graphs'>) => string }
}

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
  vi.useRealTimers()
})

describe('GraphsView', () => {
  it('renders the timeline by default: turn groups, duration bars, shared lanes', () => {
    const { container } = render(createElement(GraphsView,
      standaloneProps(historySnapshot(), sessionsState([{ id: SID, displayTitle: 's1', running: false } as SessionSummary]))))
    expect(container.textContent).toContain('Session')
    expect(container.textContent).toContain('Turn 1')
    const bars = container.querySelectorAll('button[class*=bar]')
    expect(bars.length).toBe(3)
    expect(container.textContent).toContain('bash')
    // Overlap-free items share one lane: every bar rides the same lane offset.
    const lanes = new Set([...bars].map(bar => (bar as HTMLElement).style.top))
    expect(lanes.size).toBe(1)
  })

  it('opens the inspector with detail on a bar click', () => {
    const { container, getByText } = render(createElement(GraphsView,
      standaloneProps(historySnapshot(), sessionsState([{ id: SID, displayTitle: 's1', running: false } as SessionSummary]))))
    fireEvent.click(getByText('bash'))
    expect(container.querySelector('[role=complementary]')).not.toBeNull()
    expect(container.textContent).toContain('Tool call: bash')
  })

  it('switches to the delegation canvas over real parentage', async () => {
    const sessions = sessionsState([
      { id: SID, displayTitle: 'main session', running: false } as SessionSummary,
      { id: 'sub-1' as SessionId, displayTitle: 'explore', running: true, parentId: SID } as SessionSummary,
    ])
    const { container } = render(createElement(GraphsView, standaloneProps(historySnapshot(), sessions)))
    const delegationTab = [...container.querySelectorAll('[role=tab]')].find(
      tab => tab.textContent === en['mode.delegation'])
    expect(delegationTab).toBeDefined()
    fireEvent.click(delegationTab!)
    await waitFor(() => {
      expect(container.querySelectorAll('.react-flow__node')).toHaveLength(2)
    })
    expect(container.textContent).toContain('main session')
    expect(container.textContent).toContain('explore')
    // Handles carry the edge anchors (edge paths need real measured bounds).
    expect(container.querySelectorAll('.react-flow__handle').length).toBeGreaterThanOrEqual(4)
  })

  it('shows the localized empty states: blank session and no delegation', () => {
    const blank = historySnapshot({ trajectory: { eventNodes: [], partial: null, runningCalls: [] } })
    const noDelegation = sessionsState([{ id: SID, displayTitle: 's1', running: false } as SessionSummary])
    const { container } = render(createElement(GraphsView, standaloneProps(blank, noDelegation)))
    expect(container.textContent).toContain(en['view.empty'])
    const delegationTab = [...container.querySelectorAll('[role=tab]')].find(
      tab => tab.textContent === en['mode.delegation'])
    fireEvent.click(delegationTab!)
    expect(container.textContent).toContain(en['view.delegationEmpty'])
  })

  it('falls back to the empty trajectory when the view seat holds none', () => {
    const noTrajectory = historySnapshot({ omitTrajectory: true })
    const { container } = render(createElement(GraphsView,
      standaloneProps(noTrajectory, sessionsState([{ id: SID, displayTitle: 's1', running: false } as SessionSummary]))))
    expect(container.textContent).toContain(en['view.empty'])
  })

  it('ticks live bars on the clock and inspects in-flight work', () => {
    vi.useFakeTimers()
    const live = historySnapshot({
      trajectory: {
        partial: { turn: 1, step: 2 } as never,
        runningCalls: [{ callId: 'c/2', name: 'search', turn: 1, time: 6_000 } as never],
      },
      running: true,
      turnTimings: new Map([[1, { startTime: 2_000 }]]),
    })
    const { container, getByText } = render(createElement(GraphsView,
      standaloneProps(live, sessionsState([{ id: SID, displayTitle: 's1', running: true } as SessionSummary]))))
    // The open turn's header marks live work; the clock re-derives bars per tick.
    expect(container.textContent).toContain('· live')
    act(() => { vi.advanceTimersByTime(1_000) })
    fireEvent.click(getByText('search'))
    const inspector = container.querySelector('[role=complementary]')
    expect(inspector).not.toBeNull()
    expect(container.textContent).toContain('search · in flight')
  })

  it('inspects delegation cards: the current session and its children', async () => {
    const sessions = sessionsState([
      { id: SID, displayTitle: 'main session', running: false, completed: true, agentPreset: 'code' } as SessionSummary,
      { id: 'sub-1' as SessionId, displayTitle: 'explore', running: true, parentId: SID } as SessionSummary,
      { id: 'sub-2' as SessionId, displayTitle: 'review draft', pendingInteraction: 'question', parentId: SID } as SessionSummary,
    ])
    const { container } = render(createElement(GraphsView, standaloneProps(historySnapshot(), sessions)))
    const delegationTab = [...container.querySelectorAll('[role=tab]')].find(
      tab => tab.textContent === en['mode.delegation'])
    fireEvent.click(delegationTab!)
    await waitFor(() => {
      expect(container.querySelectorAll('.react-flow__node')).toHaveLength(3)
    })
    const cardOf = (title: string): Element => {
      const card = [...container.querySelectorAll('.react-flow__node')]
        .find(node => node.textContent?.includes(title))
      expect(card, `node ${title}`).toBeDefined()
      return card!
    }
    fireEvent.click(cardOf('main session'))
    expect(container.textContent).toContain('session · done')
    expect(container.textContent).toContain('main session — this session')
    // The preset rides the inspector head while the current session is inspected.
    expect(container.querySelector('[role=complementary]')?.textContent).toContain('code')
    fireEvent.click(cardOf('explore'))
    expect(container.textContent).toContain('session · running')
    expect(container.textContent).not.toContain('explore — this session')
  })

  it('renders nothing for a blank timeline', () => {
    const { container } = render(createElement(TimelineView, {
      trajectory: { eventNodes: [], partial: null, runningCalls: [] },
      turnTimings: new Map(),
      live: false,
      onInspect: () => {},
    }))
    expect(container.firstChild).toBeNull()
  })

  it('runs the host loader entry as a no-op apply', async () => {
    const host = await import('@coco-harness/cch-client-ui-graphs')
    host.apply()
    expect(host.apply).toBeTypeOf('function')
  })
})

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
