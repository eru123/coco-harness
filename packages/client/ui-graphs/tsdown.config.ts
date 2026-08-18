import { clientBundle } from '../tsdown.client.ts'

export default clientBundle('@coco-harness/cch-client-ui-graphs', ['lib/types/index.js', 'lib/types/invariant.js'], {
  // The plugin loader fetches exactly one lib/client.js artifact, so the
  // lazily-imported mermaid engine must inline into that file instead of
  // emitting dynamic-import chunks the browser cannot resolve.
  client: { outputOptions: { inlineDynamicImports: true } },
})
