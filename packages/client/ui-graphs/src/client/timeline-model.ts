/**
 * Pure derivation of a turn-based trace timeline: every turn becomes a lane
 * group on a shared time axis whose items are the real intervals of the
 * session — tool calls span call-start to result, the in-flight partial and
 * running calls span start to now, and instantaneous events are point
 * markers. Overlapping items stack into swimlanes (interval-graph coloring),
 * so parallel tool calls read as parallel.
 */
import type {
  ConversationNode, PartialAssistant, RunningToolCall,
} from '@coco-harness/cch-client-runtime/client'

/** Item classification driving bar shape and accent. */
export type TimelineItemKind =
  | 'user'
  | 'steering'
  | 'response'
  | 'thinking'
  | 'tool'
  | 'toolError'
  | 'command'
  | 'compaction'
  | 'turnError'

/** One bar or point marker on the timeline. */
export interface TimelineItem {
  readonly id: string
  readonly kind: TimelineItemKind
  readonly label: string
  /** Inspector paragraph. */
  readonly detail: string
  /** Span start (session epoch ms). */
  readonly start: number
  /** Span end (session epoch ms); while in flight, the derivation ends it at `now`. */
  readonly end: number
  /** Swimlane index within the turn (0 = base lane). */
  readonly lane: number
  /** True while the session has this item in flight. */
  readonly live: boolean
}

/** One turn's group: header span plus its stacked items. */
export interface TimelineTurn {
  readonly turn: number
  readonly start: number
  /** Turn end; undefined while the turn is still open. */
  readonly end?: number
  readonly items: readonly TimelineItem[]
}

/** The whole derivable timeline plus the axis span. */
export interface TimelineModel {
  readonly turns: readonly TimelineTurn[]
  /** Axis bounds: earliest item start to the latest end (or `now` when live). */
  readonly span: { readonly start: number; readonly end: number }
  readonly live: boolean
}

/** Trajectory-view facts the timeline derives from. */
export interface TimelineInput {
  readonly eventNodes: readonly ConversationNode[]
  readonly partial: PartialAssistant | null
  readonly runningCalls: readonly RunningToolCall[]
  /** Turn start/end timings (session epoch ms) keyed by turn number. */
  readonly turnTimings: ReadonlyMap<number, { readonly startTime: number; readonly endTime?: number }>
  /** Wall clock for live-item ends; the view passes Date.now() per tick. */
  readonly now: number
}

/** Structural slice of a text content block (the only one the preview reads). */
interface TextLike { readonly type: 'text'; readonly text: string }

function textPreview(content: readonly unknown[]): string {
  for (const block of content) {
    const text = block as Partial<TextLike> | null
    if (text?.type === 'text' && typeof text.text === 'string' && text.text.trim() !== '') {
      return text.text
    }
  }
  return ''
}

function labelLine(raw: string): string {
  const squeezed = raw.replace(/\s+/g, ' ').trim()
  return squeezed.length > 40 ? `${squeezed.slice(0, 39)}…` : squeezed
}

function detailText(raw: string): string {
  const flat = raw.replace(/\s+/g, ' ').trim()
  return flat.length > 280 ? `${flat.slice(0, 279)}…` : flat
}

/** Assign swimlanes: an item opens on the first lane free at its start. */
function assignLanes(items: readonly Omit<TimelineItem, 'lane'>[]): TimelineItem[] {
  const laneEnds: number[] = []
  const sorted = [...items].sort((a, b) => a.start - b.start)
  return sorted.map((item) => {
    let lane = laneEnds.findIndex(end => end <= item.start)
    if (lane === -1) {
      lane = laneEnds.length
      laneEnds.push(item.end)
    } else {
      laneEnds[lane] = item.end
    }
    return { ...item, lane }
  })
}

/**
 * Fold the trajectory facts into the turn timeline. Finalized turns close
 * their items; the open turn keeps the in-flight partial and running calls
 * as live items ended at `now`.
 * @param input - trajectory facts, turn timings, and the current clock.
 * @returns the timeline model; empty turns when nothing has happened.
 */
export function deriveTimeline(input: TimelineInput): TimelineModel {
  interface TurnDraft { start: number; end: number | undefined; items: Omit<TimelineItem, 'lane'>[] }
  const drafts = new Map<number, TurnDraft>()
  const turnOf = (turn: number, fallbackTime: number): TurnDraft => {
    const timing = input.turnTimings.get(turn)
    const existing = drafts.get(turn)
    if (existing !== undefined) return existing
    const draft: TurnDraft = {
      start: timing?.startTime ?? fallbackTime,
      end: timing?.endTime,
      items: [],
    }
    drafts.set(turn, draft)
    return draft
  }
  const push = (turn: number | null, time: number, item: Omit<TimelineItem, 'lane'>): void => {
    // Turn-less entries (user prompts, commands) open turn 0's group so they
    // still land on the axis; a real turn 1 then takes over from its timing.
    turnOf(turn ?? 0, time).items.push(item)
  }
  // Tool results carry no turn of their own; the enclosing turn timing
  // places them (a call outside every timing stays in the session group).
  const resolveTurn = (time: number): number | null => {
    let match: number | null = null
    for (const [turn, timing] of input.turnTimings) {
      if (timing.startTime <= time && (timing.endTime === undefined || time <= timing.endTime)) {
        if (match === null || turn > match) match = turn
      }
    }
    return match
  }

  for (const event of input.eventNodes) {
    switch (event.kind) {
      case 'user': {
        const preview = textPreview(event.content)
        push(null, event.time, {
          id: `n${event.seq}`,
          kind: 'user',
          label: labelLine(preview === '' ? 'You asked' : preview),
          detail: detailText(preview === '' ? 'User message' : preview),
          start: event.time,
          end: event.time,
          live: false,
        })
        break
      }
      case 'steering': {
        const preview = textPreview(event.content)
        push(null, event.time, {
          id: `n${event.seq}`,
          kind: 'steering',
          label: labelLine(preview === '' ? 'Steering' : preview),
          detail: detailText(preview === '' ? 'Steering message' : preview),
          start: event.time,
          end: event.time,
          live: false,
        })
        break
      }
      case 'assistant':
        push(event.turn, event.time, {
          id: `t${event.turn}s${event.step}`,
          kind: 'response',
          label: `Response ${event.turn}.${event.step}`,
          detail: 'Assistant response step (text renders in the Chat tab).',
          start: event.time,
          end: event.time,
          live: false,
        })
        break
      case 'tool-result': {
        const name = event.call === null ? 'Tool' : event.call.name
        push(resolveTurn(event.callTime ?? event.time), event.callTime ?? event.time, {
          id: `c${event.seq}`,
          kind: event.isError ? 'toolError' : 'tool',
          label: labelLine(name),
          detail: detailText(event.isError ? `Tool call failed: ${name}` : `Tool call: ${name}`),
          start: event.callTime ?? event.time,
          end: event.time,
          live: false,
        })
        break
      }
      case 'command':
        push(null, event.time, {
          id: `n${event.seq}`,
          kind: 'command',
          label: labelLine(event.name === null ? 'Command' : `/${event.name}`),
          detail: detailText(event.name === null ? 'Session command' : `Session command /${event.name}`),
          start: event.time,
          end: event.time,
          live: false,
        })
        break
      case 'compaction':
        push(null, event.time, {
          id: `n${event.seq}`,
          kind: 'compaction',
          label: 'Compaction',
          detail: 'Conversation history was compacted.',
          start: event.time,
          end: event.time,
          live: false,
        })
        break
      case 'turn-error':
        push(event.turn, event.time, {
          id: `n${event.seq}`,
          kind: 'turnError',
          label: labelLine(event.message === '' ? 'Error' : event.message),
          detail: detailText(event.message === '' ? 'The turn ended with an error.' : event.message),
          start: event.time,
          end: event.time,
          live: false,
        })
        break
      case 'context':
      case 'model-retry':
      case 'turn-max-tokens':
      case 'unknown':
        break
    }
  }
  const live = input.partial !== null || input.runningCalls.length > 0
  // The partial carries no timestamp of its own; it opens where the last
  // finalized step ended (a live bar that grows from a real anchor).
  const liveAnchor = input.eventNodes.at(-1)?.time ?? input.now
  if (input.partial !== null) {
    push(input.partial.turn, input.now, {
      id: `t${input.partial.turn}s${input.partial.step}p`,
      kind: 'thinking',
      label: 'Thinking',
      detail: 'The model is composing a response.',
      start: liveAnchor,
      end: input.now,
      live: true,
    })
  }
  for (const call of input.runningCalls) {
    push(call.turn, input.now, {
      id: `r${call.callId.replace(/[^A-Za-z0-9_]/g, '_')}`,
      kind: 'thinking',
      label: labelLine(call.name),
      detail: detailText(`Running tool call: ${call.name}`),
      start: call.time,
      end: input.now,
      live: true,
    })
  }

  const turns: TimelineTurn[] = [...drafts.entries()]
    // Turn 0 is the pre-turn session ledger (prompts, commands): it always
    // leads, whatever clock skew its fallback start picked up.
    .sort((a, b) => (a[0] === 0 ? -1 : b[0] === 0 ? 1 : a[1].start - b[1].start))
    .map(([turn, draft]) => {
      // A group without a timing end closes at its last item unless it holds
      // live work (the synthetic session group would otherwise read as a
      // 67-minute open turn).
      const hasLive = draft.items.some(item => item.live)
      const lastEnd = Math.max(...draft.items.map(item => item.end))
      const end = draft.end ?? (hasLive ? undefined : lastEnd)
      return {
        turn,
        start: draft.start,
        ...end !== undefined ? { end } : {},
        items: assignLanes(draft.items),
      }
    })

  const allItems = turns.flatMap(turn => turn.items)
  const firstStart = allItems[0]?.start ?? 0
  const lastEnd = Math.max(input.now, ...allItems.map(item => item.end))
  return { turns, span: { start: firstStart, end: lastEnd }, live }
}

/**
 * Human duration for bar tooltips and turn headers.
 * @param ms - elapsed milliseconds.
 * @returns compact string (e.g. "412ms", "6.2s", "1m 03s").
 */
export function formatDuration(ms: number): string {
  if (ms < 1_000) return `${Math.max(0, Math.round(ms))}ms`
  if (ms < 10_000) return `${(ms / 1_000).toFixed(1)}s`
  if (ms < 60_000) return `${Math.round(ms / 1_000)}s`
  const minutes = Math.floor(ms / 60_000)
  const seconds = Math.round((ms % 60_000) / 1_000)
  return `${minutes}m ${String(seconds).padStart(2, '0')}s`
}
