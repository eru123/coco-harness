/**
 * Package-owned invariant companion for `@coco-harness/cch-web-app`.
 * @module @coco-harness/cch-web-app/invariant
 */

import type { Context } from '@coco-harness/cordis'
import type { InvariantInstaller } from '@coco-harness/cch-invariants'

const PACKAGE_NAME = '@coco-harness/cch-web-app'

/** Cordis companion plugin name. */
export const name = 'web-app-invariant'
/** Service required before the companion can register. */
export const inject = ['invariants']

/**
 * No runtime invariant: every contribution (frontend-static child plugin,
 * prompt section, bashEnv registration) is registry-disposed with the fiber,
 * and each owning registry's package carries that relation's invariant; the
 * package holds no mutable state of its own to audit.
 */
const install: InvariantInstaller = () => {}

/**
 * Register this package's invariant companion.
 * @param ctx - Cordis context carrying the invariant service.
 * @returns the installed registration's disposer after setup succeeds.
 */
export const apply = (ctx: Context): Promise<() => void> =>
  Promise.resolve(ctx.invariants.register(PACKAGE_NAME, install))
