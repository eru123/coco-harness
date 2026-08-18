/**
 * Browser graphs plugin contributing one entry to the conversation view
 * slot without defining a service.
 */
import type { Context } from '@coco-harness/cordis'
// Type-only: pulls the locale plugin's Context merge (ctx.locale).
import type {} from '@coco-harness/cch-client-locale/client'
// Type-only: the 'conversation.view' SlotMap row (declared by the slot's
// owning package) must be in the program for the register calls to type.
import type {} from '@coco-harness/cch-client-ui-conversation/client'
import { en, NS } from './locales.ts'
import { GraphsView } from './GraphsView.tsx'

/** Required services: the conversation view ring and the locale service. */
export const inject = ['slots', 'locale']

/**
 * Client plugin body: register the graphs view tab beside the trajectory
 * tab. The registration rides the slot service's effect wrapper, so plugin
 * unload removes the tab.
 * @param ctx - client root context.
 */
export function apply(ctx: Context): void {
  ctx.effect(() => ctx.locale.register(NS, { en }), 'ui-graphs: dictionaries')
  // Registration-time text (the view tab label) reads through the bound
  // translate as a thunk, so it follows the active locale without
  // re-registration.
  const t = ctx.locale.bind(NS)
  ctx.slots.inject('conversation.view', () => ctx.slots.register({
    name: 'conversation.view',
    id: 'graphs',
    order: 11,
    locale: NS,
    label: () => t('view.graphs'),
  }, GraphsView))
}
