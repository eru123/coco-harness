import { clientLibrary } from '../../client/tsdown.client.ts'

export default clientLibrary(
  '@coco-harness/cch-client-test-runtime',
  ['lib/types/index.js', 'lib/types/invariant.js'],
)
