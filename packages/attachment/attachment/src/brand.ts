/** Attachment identifier brand. @module @coco-harness/cch-attachment/brand */

import type { Branded } from '@coco-harness/cch-brand'

/** Opaque content-addressed identifier for one immutable attachment object. */
export type AttachmentId = Branded<'AttachmentId'>

/**
 * Brand a validated storage identifier.
 * @param value - backend-produced opaque identifier.
 * @returns the branded identifier.
 */
export function AttachmentId(value: string): AttachmentId {
  return value as AttachmentId
}
