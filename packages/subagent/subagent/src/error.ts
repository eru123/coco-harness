/**
 * Typed failures shared by subagent service and provider operations.
 *
 * @module @coco-harness/cch-subagent
 */

import { HarnessError } from '@coco-harness/cch-llm'

/** Typed failure for the subagent seam. */
export class SubagentError extends HarnessError {
  constructor(message: string, code: string, options?: ErrorOptions) {
    super(message, code, options)
    this.name = 'SubagentError'
  }
}
