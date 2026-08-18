/** Graphs view: live mermaid projection of session progress. */

import { useMemo } from 'react'
import type { ConvViewProps } from '@coco-harness/cch-client-ui-conversation/client'
import type { PropsLocale } from '@coco-harness/cch-client-ui-slots'
import type { TrajectorySnapshot } from '@coco-harness/cch-client-ui-trajectory/client'
import { deriveSessionGraph, sessionGraphMermaid } from './graph-model.ts'
import { MermaidDiagram } from './MermaidDiagram.tsx'
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

/**
 * The graphs tab body: derives the session progress graph from the shared
 * trajectory view snapshot on every change and renders it live as an
 * animated mermaid flowchart.
 * @param props - the conversation view standard kit plus the locale seat.
 * @returns the mermaid diagram, or the empty state for a blank session.
 */
export function GraphsView({ useSession, t }: ConvViewProps & PropsLocale<'graphs'>) {
  const trajectory = useSession(snapshot =>
    snapshot.views.get('trajectory') ?? EMPTY_TRAJECTORY)
  const model = useMemo(() => deriveSessionGraph({
    eventNodes: trajectory.eventNodes,
    partial: trajectory.partial,
    runningCalls: trajectory.runningCalls,
  }), [trajectory])
  const code = useMemo(() => sessionGraphMermaid(model), [model])
  if (model.nodes.length === 0) {
    return <div className={css.empty}>{t('view.empty')}</div>
  }
  return (
    <div className={css.root}>
      <MermaidDiagram code={code} errorLabel={t('view.renderError')} />
    </div>
  )
}
