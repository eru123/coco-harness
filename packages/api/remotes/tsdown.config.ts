import { clientBundle } from '../../client/tsdown.client.ts'

export default clientBundle(
  '@coco-harness/cch-api-remotes',
  ['lib/types/index.js', 'lib/types/invariant.js'],
  { hostPhase: true },
)
