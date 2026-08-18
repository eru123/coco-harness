/** `graphs` namespace dictionaries (view tab label + view strings). */

/** Dictionary namespace owned by this plugin. */
export const NS = 'graphs'

/** The graphs dictionary key set. */
export type GraphsKey =
  | 'view.graphs'
  | 'view.empty'
  | 'view.renderError'

declare module '@coco-harness/cch-client-ui-slots' {
  interface LocaleNamespaceMap {
    /** The graphs view tab label and view strings. */
    'graphs': GraphsKey
  }
}

/** English dictionary (the key-set source of truth). */
export const en: Record<GraphsKey, string> = {
  'view.graphs': 'Graphs',
  'view.empty': 'No session activity to visualize yet.',
  'view.renderError': 'Graph rendering failed',
}
