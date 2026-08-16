/**
 * Shared browser platform modules. Seeding, bundling externals, and Vite
 * aliases consume this list so their module identities cannot drift.
 * @module @coco-harness/cch-client-web/src/platform
 */

/** The module specifiers the shell shares into the frozen module table. */
export const PLATFORM_MODULES = [
  'react', 'react/jsx-runtime', 'react-dom', 'react-dom/client', '@coco-harness/cordis',
  '@coco-harness/cch-client-ui-slots',
  '@coco-harness/cch-client-web-react',
  '@coco-harness/cch-client-ui-primitives',
  '@coco-harness/cch-client-ui-attachment',
  '@coco-harness/cch-client-schema-form',
] as const

/** One platform module specifier (a seed-table key). */
export type PlatformModule = (typeof PLATFORM_MODULES)[number]
