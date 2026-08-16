/**
 * Package-owned invariant companion for `@coco-harness/cch-typert-protocol`.
 * @module @coco-harness/cch-typert-protocol/invariant
 */

/* jscpd:ignore-start */
import type { Context } from '@coco-harness/cordis'
import type { InvariantInstaller } from '@coco-harness/cch-invariants'

const PACKAGE_NAME = '@coco-harness/cch-typert-protocol'

/** Cordis companion plugin name. */
export const name = 'typert-protocol-invariant'
/** Service required before the companion can reserve package ownership. */
export const inject = ['invariants']

/**
 * No runtime invariant: decorators retain private immutable declarations and
 * bindings are frozen values with no independent event stream to cross-check.
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
