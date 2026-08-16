import { clientBundle } from '../tsdown.client.ts'

export default clientBundle(
  '@coco-harness/cch-client-ui-theme',
  ['lib/types/index.js', 'lib/types/invariant.js'],
  {
    lib: {
      copy: [{ from: 'src/styles/*', to: 'lib/styles' }],
    },
  },
)
