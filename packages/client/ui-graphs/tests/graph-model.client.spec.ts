/**
 * Graph model derivation and mermaid serialization: every conversation-node
 * kind folds into the sequential progress graph, in-flight partial/running
 * calls become live nodes, labels are sanitized, and per-turn subgraphs open
 * and close correctly — including a turn that reappears after closing.
 */
import { describe, expect, it } from 'vitest'
import type { ConversationNode } from '@coco-harness/cch-client-runtime/client'
import {
  deriveSessionGraph, sessionGraphMermaid, type SessionGraphInput,
} from '../src/client/graph-model.ts'

function graph(input: Partial<SessionGraphInput>) {
  return deriveSessionGraph({
    eventNodes: [],
    partial: null,
    runningCalls: [],
    ...input,
  })
}

const NODES: ConversationNode[] = [
  {
    kind: 'user', seq: 1, time: 1_000,
    content: [{ type: 'text', text: 'fix the failing login test "quoted" [bracketed]' } as never],
    source: null,
  },
  { kind: 'assistant', seq: 2, time: 2_000, turn: 1, step: 1, blocks: [] },
  {
    kind: 'tool-result', seq: 3, time: 3_000, callId: 'c/1', callTime: 2_200,
    call: { name: 'read_file', argsRaw: '' }, content: [], isError: false,
    callView: null, resultView: null, subCalls: [],
  },
  {
    kind: 'tool-result', seq: 4, time: 4_000, callId: 'c/2', callTime: 3_200,
    call: { name: 'bash', argsRaw: '' }, content: [], isError: true,
    error: { name: 'Error', code: 'E' }, callView: null, resultView: null, subCalls: [],
  },
  { kind: 'command', seq: 5, time: 5_000, commandId: 'k1' as never, name: 'compact', args: '', outcome: null },
  { kind: 'compaction', seq: 6, time: 6_000, summary: null, summaryEventSeq: null, shadowedItemCount: null, shadowedTokenCount: null },
  { kind: 'turn-error', seq: 7, time: 7_000, turn: 1, step: 2, message: 'boom' },
]

describe('deriveSessionGraph', () => {
  it('folds every progress-bearing node kind with sequential edges', () => {
    const model = graph({ eventNodes: NODES })
    expect(model.nodes.map(node => [node.id, node.kind])).toEqual([
      ['n1', 'user'],
      ['t1s1', 'assistant'],
      ['c3', 'tool'],
      ['c4', 'error'],
      ['n5', 'command'],
      ['n6', 'compaction'],
      ['n7', 'error'],
    ])
    expect(model.edges).toEqual([
      { from: 'n1', to: 't1s1' },
      { from: 't1s1', to: 'c3' },
      { from: 'c3', to: 'c4' },
      { from: 'c4', to: 'n5' },
      { from: 'n5', to: 'n6' },
      { from: 'n6', to: 'n7' },
    ])
    expect(model.live).toBe(false)
  })

  it('skips progress-neutral ledger entries and blank labels fall back', () => {
    const model = graph({
      eventNodes: [
        { kind: 'context', seq: 1, time: 1, content: [], source: null, provenance: {} as never, form: null },
        { kind: 'user', seq: 2, time: 2, content: [], source: null },
        {
          kind: 'model-retry', seq: 3, time: 3, retryState: 'scheduled',
        } as never,
        { kind: 'turn-max-tokens', seq: 4, time: 4, turn: 1, step: 1 },
        { kind: 'unknown', seq: 5, time: 5, type: 'x', data: null },
        { kind: 'command', seq: 6, time: 6, commandId: 'k' as never, name: null, args: '', outcome: null },
        {
          kind: 'steering', seq: 7, time: 7, messageId: 'm' as never,
          content: [], source: null,
        },
        {
          kind: 'steering', seq: 8, time: 8, messageId: 'm2' as never,
          content: [{ type: 'image' } as never, { type: 'text', text: 'also check the timeout' } as never],
          source: null,
        },
        {
          kind: 'tool-result', seq: 9, time: 9, callId: 'c', callTime: null,
          call: null, content: [], isError: false, callView: null, resultView: null, subCalls: [],
        },
        { kind: 'turn-error', seq: 10, time: 10, turn: 1, step: 1, message: '' },
      ],
    })
    expect(model.nodes.map(node => [node.id, node.kind, node.label])).toEqual([
      ['n2', 'user', 'User'],
      ['n6', 'command', 'Command'],
      ['n7', 'steering', 'Steering'],
      ['n8', 'steering', 'Steering: also check the timeout'],
      ['c9', 'tool', 'Tool'],
      ['n10', 'error', 'Error'],
    ])
  })

  it('appends live thinking and running-tool nodes for in-flight work', () => {
    const model = graph({
      eventNodes: NODES.slice(0, 2),
      partial: { turn: 2, step: 1, blocks: [] },
      runningCalls: [{ callId: 'a b/1', name: 'bash "quoted"', argsRaw: '', turn: 2, step: 1, time: 9_000, callView: null, subCalls: [] }],
    })
    expect(model.live).toBe(true)
    expect(model.nodes.slice(-2)).toEqual([
      { id: 't2s1p', kind: 'thinking', label: 'Thinking', turn: 2 },
      { id: 'ra_b_1', kind: 'runningTool', label: 'bash quoted', turn: 2 },
    ])
    expect(model.edges.at(-1)).toEqual({ from: 't2s1p', to: 'ra_b_1' })
  })

  it('derives an empty model for a blank session', () => {
    expect(graph({})).toEqual({ nodes: [], edges: [], live: false })
  })
})

describe('sessionGraphMermaid', () => {
  it('serializes subgraphs, classes, and edges with sanitized labels', () => {
    const code = sessionGraphMermaid(graph({
      eventNodes: [
        { kind: 'user', seq: 1, time: 1, content: [{ type: 'text', text: 'hello "world"' } as never], source: null },
        { kind: 'assistant', seq: 2, time: 2, turn: 1, step: 1, blocks: [] },
        { kind: 'assistant', seq: 3, time: 3, turn: 2, step: 1, blocks: [] },
      ],
    }))
    expect(code).toBe(
      [
        'flowchart TD',
        '  classDef user fill:#2563eb,color:#fff',
        '  classDef steering fill:#4f46e5,color:#fff',
        '  classDef assistant fill:#0e7490,color:#fff',
        '  classDef thinking fill:#7c3aed,color:#fff,stroke-dasharray:4 3',
        '  classDef tool fill:#0f766e,color:#fff',
        '  classDef runningTool fill:#b45309,color:#fff',
        '  classDef command fill:#6d28d9,color:#fff',
        '  classDef compaction fill:#475569,color:#fff',
        '  classDef error fill:#b91c1c,color:#fff',
        '  classDef live stroke:#f59e0b,stroke-width:3px',
        '  n1["User: hello world"]',
        '  subgraph T1 ["Turn 1"]',
        '  t1s1["Turn 1 Step 1"]',
        '  end',
        '  subgraph T2 ["Turn 2"]',
        '  t2s1["Turn 2 Step 1"]',
        '  end',
        '  class n1 user',
        '  class t1s1 assistant',
        '  class t2s1 assistant',
        '  n1 --> t1s1',
        '  t1s1 --> t2s1',
      ].join('\n'),
    )
  })

  it('marks every node live while the session is in flight', () => {
    const code = sessionGraphMermaid(graph({
      eventNodes: [{ kind: 'assistant', seq: 1, time: 1, turn: 1, step: 1, blocks: [] }],
      partial: { turn: 1, step: 2, blocks: [] },
    }))
    expect(code).toContain('class t1s1 assistant,live')
    expect(code).toContain('class t1s2p thinking,live')
  })

  it('keeps a turn that reappears after its subgraph closed at top level', () => {
    const code = sessionGraphMermaid(graph({
      eventNodes: [
        { kind: 'assistant', seq: 1, time: 1, turn: 1, step: 1, blocks: [] },
        { kind: 'assistant', seq: 2, time: 2, turn: 2, step: 1, blocks: [] },
      ],
      runningCalls: [
        { callId: 'x', name: 'bash', argsRaw: '', turn: 1, step: 1, time: 3, callView: null, subCalls: [] },
        { callId: 'y', name: 'read', argsRaw: '', turn: 1, step: 1, time: 4, callView: null, subCalls: [] },
      ],
    }))
    expect(code.match(/subgraph T\d/g)).toHaveLength(2)
    expect(code).toContain('  end\n  rx["bash"]\n  ry["read"]')
    expect(code).not.toContain('  ry["read"]\n  end')
  })

  it('truncates long labels to one line', () => {
    const long = 'word '.repeat(20).trim()
    const code = sessionGraphMermaid(graph({
      eventNodes: [{
        kind: 'user', seq: 1, time: 1,
        content: [{ type: 'text', text: `${long}\nnewline` } as never],
        source: null,
      }],
    }))
    expect(code).toContain(`"User: ${long.slice(0, 29)}…"`)
  })
})
