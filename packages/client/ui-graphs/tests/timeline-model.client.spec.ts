/**
 * Timeline derivation: tool calls span call-start to result, parallel calls
 * stack into swimlanes while sequential ones share a lane, live items grow
 * to the passed clock, turn groups bind to the turn timings, and durations
 * format for tooltips and headers.
 */
import { describe, expect, it } from 'vitest'
import type { ConversationNode } from '@coco-harness/cch-client-runtime/client'
import { deriveTimeline, formatDuration, type TimelineInput } from '../src/client/timeline-model.ts'

const NOW = 30_000

function timeline(input: Partial<TimelineInput>) {
  return deriveTimeline({
    eventNodes: [],
    partial: null,
    runningCalls: [],
    turnTimings: new Map(),
    now: NOW,
    ...input,
  })
}

const toolResult = (seq: number, callTime: number, end: number, name = 'bash', isError = false): ConversationNode => ({
  kind: 'tool-result', seq, time: end, callId: `c/${seq}`, callTime,
  call: { name, argsRaw: '' }, content: [], isError,
  error: isError ? { name: 'Error', code: 'E' } : undefined,
  callView: null, resultView: null, subCalls: [],
} as never)

describe('deriveTimeline', () => {
  it('spans tool bars from call start to result, in the call\'s turn group', () => {
    const model = timeline({
      eventNodes: [
        { kind: 'user', seq: 1, time: 1_000, content: [{ type: 'text', text: 'go' } as never], source: null },
        { kind: 'assistant', seq: 2, time: 2_000, turn: 1, step: 1, blocks: [] },
        toolResult(3, 2_100, 5_000),
      ],
      turnTimings: new Map([[1, { startTime: 2_000, endTime: 6_000 }]]),
    })
    // The synthetic session group closes at its last item, not at the clock.
    expect(model.turns.map(turn => [turn.turn, turn.start, turn.end])).toEqual([
      [0, 1_000, 1_000],
      [1, 2_000, 6_000],
    ])
    const tool = model.turns[1]!.items.find(item => item.kind === 'tool')
    expect(tool).toMatchObject({ id: 'c3', start: 2_100, end: 5_000, lane: 0, live: false })
    expect(model.span).toEqual({ start: 1_000, end: NOW })
    expect(model.live).toBe(false)
  })

  it('stacks overlapping calls in separate lanes and keeps sequential ones shared', () => {
    const model = timeline({
      eventNodes: [
        toolResult(1, 1_000, 4_000, 'bash'),
        toolResult(2, 2_000, 6_000, 'read'),
        toolResult(3, 4_500, 5_000, 'edit'),
      ],
    })
    const items = model.turns[0]!.items
    expect(items.map(item => [item.id, item.lane])).toEqual([
      ['c1', 0],
      ['c2', 1],
      ['c3', 0],
    ])
  })

  it('grows live items to the passed clock from a real anchor', () => {
    const model = timeline({
      eventNodes: [
        { kind: 'assistant', seq: 1, time: 2_000, turn: 1, step: 1, blocks: [] },
        toolResult(2, 2_500, 4_000),
      ],
      partial: { turn: 1, step: 2, blocks: [] },
      runningCalls: [{ callId: 'x y', name: 'bash', argsRaw: '', turn: 1, step: 2, time: 5_000, callView: null, subCalls: [] }],
    })
    expect(model.live).toBe(true)
    const running = model.turns.find(turn => turn.turn === 1)!.items.find(item => item.id === 'rx_y')
    expect(running).toMatchObject({ start: 5_000, end: NOW, live: true })
    // The thinking bar anchors at the last finalized step, not at the clock.
    const thinking = model.turns.find(turn => turn.turn === 1)!.items.find(item => item.kind === 'thinking' && item.id.endsWith('p'))
    expect(thinking).toMatchObject({ start: 4_000, end: NOW, live: true })
  })

  it('carries every remaining event kind onto the axis or past it', () => {
    const model = timeline({
      eventNodes: [
        { kind: 'steering', seq: 10, time: 1_000, source: null, content: [{ type: 'text', text: 'adjust course' } as never] } as never,
        { kind: 'steering', seq: 11, time: 1_500, source: null, content: [] } as never,
        { kind: 'command', seq: 12, time: 2_000, name: 'model' } as never,
        { kind: 'command', seq: 13, time: 2_500, name: null } as never,
        { kind: 'compaction', seq: 14, time: 3_000 } as never,
        { kind: 'turn-error', seq: 15, time: 3_500, turn: 1, message: 'boom' } as never,
        { kind: 'turn-error', seq: 16, time: 4_000, turn: 1, message: '' } as never,
        { kind: 'context', seq: 17, time: 4_500 } as never,
        { kind: 'model-retry', seq: 18, time: 5_000 } as never,
        { kind: 'turn-max-tokens', seq: 19, time: 5_500 } as never,
        { kind: 'unknown', seq: 20, time: 6_000 } as never,
      ],
    })
    const items = model.turns[0]!.items
    expect(items.filter(item => item.kind === 'steering').map(item => item.label)).toEqual(['adjust course', 'Steering'])
    expect(items.filter(item => item.kind === 'steering').map(item => item.detail)).toEqual(['adjust course', 'Steering message'])
    expect(items.find(item => item.kind === 'command' && item.label === '/model')).toMatchObject({ detail: 'Session command /model' })
    expect(items.find(item => item.kind === 'command' && item.label === 'Command')).toMatchObject({ detail: 'Session command' })
    expect(items.find(item => item.kind === 'compaction')).toMatchObject({ label: 'Compaction' })
    const errors = model.turns.find(turn => turn.turn === 1)!.items
    expect(errors.map(item => item.label)).toEqual(['boom', 'Error'])
    expect(errors.map(item => item.detail)).toEqual(['boom', 'The turn ended with an error.'])
    // Progress-neutral kinds add no item: only the seven carriers above landed.
    expect(items).toHaveLength(5)
    expect(errors).toHaveLength(2)
  })

  it('truncates long previews in labels and details, and skips non-text blocks', () => {
    const model = timeline({
      eventNodes: [
        { kind: 'user', seq: 1, time: 1_000, source: null, content: [{ type: 'text', text: 'x'.repeat(50) } as never] },
        { kind: 'user', seq: 2, time: 2_000, source: null, content: [{ type: 'image', url: 'u' } as never, { type: 'text', text: 'after image' } as never] },
        { kind: 'user', seq: 3, time: 3_000, source: null, content: [] },
        { kind: 'steering', seq: 4, time: 4_000, source: null, content: [{ type: 'text', text: 'y'.repeat(300) } as never] } as never,
      ],
    })
    const items = model.turns[0]!.items
    expect(items.find(item => item.id === 'n1')?.label).toBe(`${'x'.repeat(39)}…`)
    expect(items.find(item => item.id === 'n2')?.label).toBe('after image')
    expect(items.find(item => item.id === 'n3')?.label).toBe('You asked')
    expect(items.find(item => item.id === 'n3')?.detail).toBe('User message')
    expect(items.find(item => item.id === 'n4')?.detail).toBe(`${'y'.repeat(279)}…`)
  })

  it('places a call in the deepest enclosing timing and orphans the rest', () => {
    const model = timeline({
      eventNodes: [
        toolResult(1, 5_000, 5_500),
        toolResult(2, 500, 800),
      ],
      // Insertion order 3, 2, 1: a later-seen lower turn must not replace the deeper match.
      turnTimings: new Map([
        [3, { startTime: 4_500 }],
        [2, { startTime: 4_000 }],
        [1, { startTime: 1_000, endTime: 2_000 }],
      ]),
    })
    // 5_000 sits after timing 1 closed and inside both open timings: deepest wins.
    expect(model.turns.find(turn => turn.turn === 3)!.items.map(item => item.id)).toEqual(['c1'])
    // 500 precedes every timing: the session group keeps it.
    expect(model.turns.find(turn => turn.turn === 0)!.items.map(item => item.id)).toEqual(['c2'])
  })

  it('reads bare tool results from the event time and flags failures', () => {
    const model = timeline({
      eventNodes: [
        {
          kind: 'tool-result', seq: 1, time: 2_000, callId: 'c/1', callTime: undefined, call: null,
          content: [], isError: false, callView: null, resultView: null, subCalls: [],
        } as never,
        toolResult(2, 3_000, 4_000, 'bash', true),
      ],
    })
    const items = model.turns[0]!.items
    expect(items.find(item => item.id === 'c1')).toMatchObject({
      kind: 'tool', label: 'Tool', detail: 'Tool call: Tool', start: 2_000, end: 2_000,
    })
    expect(items.find(item => item.id === 'c2')).toMatchObject({
      kind: 'toolError', label: 'bash', detail: 'Tool call failed: bash',
    })
  })

  it('keeps the session group first and orders turns by start, not arrival', () => {
    const model = timeline({
      eventNodes: [
        { kind: 'assistant', seq: 1, time: 6_000, turn: 2, step: 1, blocks: [] },
        { kind: 'assistant', seq: 2, time: 2_000, turn: 1, step: 1, blocks: [] },
        { kind: 'user', seq: 3, time: 1_000, source: null, content: [{ type: 'text', text: 'late ledger entry' } as never] },
      ],
    })
    expect(model.turns.map(turn => turn.turn)).toEqual([0, 1, 2])
  })

  it('derives an empty model for a blank session', () => {
    expect(timeline({})).toEqual({ turns: [], span: { start: 0, end: NOW }, live: false })
  })
})

describe('formatDuration', () => {
  it('formats across the ms/s/m boundaries', () => {
    expect(formatDuration(412)).toBe('412ms')
    expect(formatDuration(6_234)).toBe('6.2s')
    expect(formatDuration(9_800)).toBe('9.8s')
    expect(formatDuration(14_000)).toBe('14s')
    expect(formatDuration(63_000)).toBe('1m 03s')
  })
})
