/**
 * Mermaid renderer for the graphs view: lazily loads the mermaid engine,
 * renders the current flowchart definition into sanitized SVG, and animates
 * nodes that are new since the previous render plus every node carrying the
 * `live` class while the session is in flight.
 */
import { useEffect, useRef, useState } from 'react'
import type { Mermaid } from 'mermaid'
import css from './views.module.css'

let mermaidLoader: Promise<Mermaid> | null = null

function loadMermaid(): Promise<Mermaid> {
  mermaidLoader ??= import('mermaid').then((mod) => {
    mod.default.initialize({ startOnLoad: false, securityLevel: 'strict', theme: 'neutral' })
    return mod.default
  })
  return mermaidLoader
}

/** Props of the mermaid renderer. */
export interface MermaidDiagramProps {
  /** Complete mermaid document (the view's serialized graph model). */
  readonly code: string
  /** Heading announced above the rendered diagram (the render-failure label). */
  readonly errorLabel: string
}

/**
 * Render one mermaid document as animated SVG.
 * @param props - the document plus the localized failure label.
 * @returns the diagram container, or the failure fallback with the raw code.
 */
export function MermaidDiagram({ code, errorLabel }: MermaidDiagramProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const seenIds = useRef<ReadonlySet<string>>(new Set())
  const [error, setError] = useState<string | null>(null)
  const [rendered, setRendered] = useState(false)
  useEffect(() => {
    let cancelled = false
    setError(null)
    loadMermaid().then(async (mermaid) => {
      const { svg } = await mermaid.render('graphs-diagram', code)
      if (cancelled) return
      // The effect body runs only while mounted, and `cancelled` covers the
      // await gap, so the ref is present here.
      // oxlint-disable-next-line typescript/no-non-null-assertion
      containerRef.current!.innerHTML = svg
      // Mermaid mints deterministic node element ids from the document, so
      // the id diff between renders names exactly the newly added nodes.
      // oxlint-disable-next-line typescript/no-non-null-assertion
      const elements = [...containerRef.current!.querySelectorAll<SVGGElement>('g.node')]
      const ids = new Set<string>()
      for (const element of elements) {
        ids.add(element.id)
        if (!seenIds.current.has(element.id)) element.classList.add('graphs-new')
      }
      seenIds.current = ids
      setRendered(true)
    }).catch((reason: unknown) => {
      if (!cancelled) setError(String(reason))
    })
    return () => { cancelled = true }
  }, [code])
  if (error !== null) {
    return (
      <div className={css.error} role="alert">
        <p>{errorLabel}</p>
        <pre>{code}</pre>
      </div>
    )
  }
  return <div ref={containerRef} className={rendered ? css.diagram : css.pending} />
}
