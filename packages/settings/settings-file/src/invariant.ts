/**
 * Package-owned invariant companion for `@coco-harness/cch-settings-file`.
 * @module @coco-harness/cch-settings-file/invariant
 */

/* jscpd:ignore-start */
import type { Context } from '@coco-harness/cordis'
import type { InvariantInstaller } from '@coco-harness/cch-invariants'

const PACKAGE_NAME = '@coco-harness/cch-settings-file'

/** Cordis companion plugin name. */
export const name = 'settings-file-invariant'
/** Service required before the companion can reserve package ownership. */
export const inject = ['invariants']

/**
 * No runtime invariant: this provider's contracts are file round-trip,
 * watcher timing, and atomic-write behavior — IO effects proven by package
 * tests; the in-process commit relation is owned by `@coco-harness/cch-settings`.
 */
const install: InvariantInstaller = () => {}

/**
 * Register this package's invariant companion.
 * @param ctx - Cordis context carrying the invariant service.
 * @returns the installed registration's disposer after setup succeeds.
 */
export const apply = (ctx: Context): Promise<() => void> =>
  Promise.resolve(ctx.invariants.register(PACKAGE_NAME, install))
/* jscpd:ignore-end */
