/**
 * Timeline view: the session trace as a turn-based waterfall. Each turn is a
 * horizontally-scaled group; items are bars (tool calls span call-start to
 * result, live items grow to a ticking now), points are markers, and
 * overlapping items stack in swimlanes so parallel calls read as parallel.
 */

import { useEffect, useMemo, useState } from 'react'
import type { TrajectorySnapshot } from '@coco-harness/cch-client-ui-trajectory/client'
import type { TimelineItem } from './timeline-model.ts'
import { deriveTimeline, formatDuration } from './timeline-model.ts'
import css from './views.module.css'

/** Bar accent per item kind: color carries progress, glyph carries kind. */
const ITEM_STYLE: Record<TimelineItem['kind'], { glyph: string; hue: string }> = {
  user: { glyph: '❯', hue: 'var(--dsw-alias-state-business-primary)' },
  steering: { glyph: '↪', hue: 'var(--dsw-alias-state-business-primary)' },
  response: { glyph: '◆', hue: 'var(--dsw-alias-label-primary)' },
  thinking: { glyph: '◌', hue: 'var(--dsw-alias-state-warn-label)' },
  tool: { glyph: '⚙', hue: 'var(--dsw-alias-label-secondary)' },
  toolError: { glyph: '⚙', hue: 'var(--dsw-alias-state-error-primary)' },
  command: { glyph: '/', hue: 'var(--dsw-alias-label-secondary)' },
  compaction: { glyph: '≡', hue: 'var(--dsw-alias-label-secondary)' },
  turnError: { glyph: '✕', hue: 'var(--dsw-alias-state-error-primary)' },
}

/** The trajectory facts the timeline derives from. */
export type TimelineFacts = Pick<TrajectorySnapshot, 'eventNodes' | 'partial' | 'runningCalls'>

/** Props of the timeline view. */
export interface TimelineViewProps {
  readonly trajectory: TimelineFacts
  readonly turnTimings: ReadonlyMap<number, { readonly startTime: number; readonly endTime?: number }>
  /** True while the session has in-flight work (drives the ticking clock). */
  readonly live: boolean
  /** Open the shared inspector with one item. */
  readonly onInspect: (item: TimelineItem) => void
}

/** One bar: positioned by span share; a point marker when start equals end. */
function Bar({ item, span, onInspect }: { item: TimelineItem; span: number; onInspect: () => void }) {
  const style = ITEM_STYLE[item.kind]
  const left = (item.start / span) * 100
  const width = Math.max(0.5, ((item.end - item.start) / span) * 100)
  const isPoint = item.end === item.start
  return (
    <button
      type="button"
      className={[
        css.bar,
        isPoint ? css.barPoint : '',
        item.live ? css.barLive : '',
      ].filter(Boolean).join(' ')}
      style={{
        top: `calc(${item.lane} * var(--lane-height))`,
        left: `${left}%`,
        width: isPoint ? undefined : `${width}%`,
        background: isPoint ? style.hue : undefined,
        borderLeftColor: style.hue,
      }}
      title={`${style.glyph} ${item.label} · ${formatDuration(item.end - item.start)}`}
      onClick={onInspect}
    >
      {!isPoint && <span className={css.barLabel}>{item.label}</span>}
    </button>
  )
}

/**
 * The waterfall body: one group per turn, live items re-derived on a one-
 * second tick while the session is in flight.
 * @param props - trajectory facts, turn timings, live bit, inspector open.
 * @returns the scrollable timeline, or null when the session is blank.
 */
export function TimelineView({ trajectory, turnTimings, live, onInspect }: TimelineViewProps) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    if (!live) return
    const timer = setInterval(() => { setNow(Date.now()) }, 1_000)
    return () => clearInterval(timer)
  }, [live])
  const model = useMemo(() => deriveTimeline({
    eventNodes: trajectory.eventNodes,
    partial: trajectory.partial,
    runningCalls: trajectory.runningCalls,
    turnTimings,
    now,
  }), [trajectory, turnTimings, now])
  if (model.turns.length === 0) return null
  const span = Math.max(1, model.span.end - model.span.start)
  return (
    <div className={css.timeline}>
      {model.turns.map((turn) => {
        const lanes = Math.max(1, ...turn.items.map(item => item.lane + 1))
        const header = turn.turn === 0
          ? css.turnHeaderSession
          : css.turnHeader
        return (
          <section key={turn.turn} className={css.turn}>
            <div className={header}>
              <span>{turn.turn === 0 ? 'Session' : `Turn ${turn.turn}`}</span>
              <span className={css.turnDuration}>
                {formatDuration((turn.end ?? model.span.end) - turn.start)}
                {turn.items.some(item => item.live) ? ' · live' : ''}
              </span>
            </div>
            <div className={css.lanes} style={{ '--lanes': lanes } as React.CSSProperties}>
              {turn.items.map(item => (
                <Bar
                  key={item.id}
                  item={{ ...item, start: item.start - model.span.start, end: item.end - model.span.start }}
                  span={span}
                  onInspect={() => { onInspect(item) }}
                />
              ))}
            </div>
          </section>
        )
      })}
    </div>
  )
}
