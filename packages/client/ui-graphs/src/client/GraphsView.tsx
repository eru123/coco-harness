/**
 * Graphs view shell: two visualizations of the agentic workflow behind a
 * mode switch. Timeline (default) is the per-session trace waterfall — the
 * data is temporal and mostly sequential, so it renders as turn lanes with
 * duration bars, not a node graph. Delegation is the cross-session tree —
 * genuinely graph-shaped (parents spawning subagents) — on the explorable
 * React Flow canvas.
 */

import { useState } from 'react'
import type { ConvViewProps } from '@coco-harness/cch-client-ui-conversation/client'
import type { PropsLocale } from '@coco-harness/cch-client-ui-slots'
import type { TrajectorySnapshot } from '@coco-harness/cch-client-ui-trajectory/client'
import { TimelineView } from './TimelineView.tsx'
import { DelegationView } from './DelegationView.tsx'
import css from './views.module.css'

/** Stable empty target used until ui-trajectory has assembled the ledger. */
const EMPTY_TRAJECTORY: TrajectorySnapshot = {
  eventNodes: [],
  eventLocations: new Map(),
  requests: [],
  callSchemas: new Map(),
  partial: null,
  runningCalls: [],
}

/** The two visualizations behind the tab's mode switch. */
type GraphsMode = 'timeline' | 'delegation'

/** One inspected subject: a timeline item or a delegation session node. */
interface Inspection {
  readonly accent: string
  readonly kind: string
  readonly turn: string | null
  readonly detail: string
}

/**
 * The graphs tab body: derives everything from the shared trajectory
 * snapshot plus the sessions list, and renders the selected mode.
 * @param props - the conversation view standard kit plus the locale seat.
 * @returns the mode switch, the selected visualization with its inspector,
 *   or the empty state for a blank session.
 */
export function GraphsView({ sessionId, useSession, useSessions, t }: ConvViewProps & PropsLocale<'graphs'>) {
  const trajectory = useSession(snapshot =>
    snapshot.views.get('trajectory') ?? EMPTY_TRAJECTORY)
  const turnTimings = useSession(snapshot => snapshot.turnTimings)
  const running = useSession(snapshot => snapshot.running)
  const sessions = useSessions(state => state)
  const [mode, setMode] = useState<GraphsMode>('timeline')
  const [inspection, setInspection] = useState<Inspection | null>(null)

  const hasTrace = trajectory.eventNodes.length > 0
    || trajectory.partial !== null
    || trajectory.runningCalls.length > 0

  const modes: readonly { readonly id: GraphsMode; readonly label: string }[] = [
    { id: 'timeline', label: t('mode.timeline') },
    { id: 'delegation', label: t('mode.delegation') },
  ]

  return (
    <div className={css.root}>
      <div className={css.modeSwitch} role="tablist">
        {modes.map(entry => (
          <button
            key={entry.id}
            type="button"
            role="tab"
            aria-selected={mode === entry.id}
            className={mode === entry.id ? css.modeActive : css.mode}
            onClick={() => {
              setMode(entry.id)
              setInspection(null)
            }}
          >
            {entry.label}
          </button>
        ))}
      </div>
      <div className={css.modeBody}>
        {mode === 'timeline'
          ? hasTrace
            ? (
              <TimelineView
                trajectory={trajectory}
                turnTimings={turnTimings}
                live={running}
                onInspect={(item) => {
                  setInspection({
                    accent: 'var(--dsw-alias-label-primary)',
                    kind: item.kind,
                    turn: null,
                    detail: item.live ? `${item.label} · in flight` : item.detail,
                  })
                }}
              />
            )
            : <div className={css.empty}>{t('view.empty')}</div>
          : (
            <DelegationView
              sessions={sessions}
              sessionId={sessionId}
              emptyLabel={t('view.delegationEmpty')}
              onInspect={(node) => {
                setInspection({
                  accent: 'var(--dsw-alias-label-primary)',
                  kind: `session · ${node.status}`,
                  turn: node.preset ?? null,
                  detail: node.current ? `${node.title} — this session` : node.title,
                })
              }}
            />
          )}
      </div>
      {inspection !== null && (
        <aside className={css.inspector} role="complementary">
          <div className={css.inspectorHead}>
            <span style={{ color: inspection.accent }}>{inspection.kind}</span>
            {inspection.turn !== null && <span>{inspection.turn}</span>}
          </div>
          <p className={css.inspectorDetail}>{inspection.detail}</p>
        </aside>
      )}
    </div>
  )
}
