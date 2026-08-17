// Coco Harness brand mark: the coconut. A harness strap loop (the broken
// ring doubles as the letter C) carries the coconut's three germination
// pores — three dots for the harness mount points: model, tools, you.
// Native 24x24 (square); ink rides currentColor (wordmark ink).

import type { IconProps } from './icons/props.ts'

/**
 * Render the brand mark.
 * @param props.size - width in px (default 24; height keeps the 1:1 ratio).
 * @param props.className - extra class for layout placement.
 * @returns the mark svg (aria-hidden; pair with the wordmark for accessibility).
 */
export function BrandMark({ size = 24, className }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path d="M 20.556 6.229 A 10.32 10.32 0 1 0 20.556 17.771 L 16.576 15.087 A 5.52 5.52 0 1 1 16.576 8.913 Z" fill="currentColor"/>
      <path d="M 8.448 9.12 a 1.344 1.344 0 1 0 2.688 0 a 1.344 1.344 0 1 0 -2.688 0 Z" fill="currentColor"/>
      <path d="M 12.864 9.504 a 1.344 1.344 0 1 0 2.688 0 a 1.344 1.344 0 1 0 -2.688 0 Z" fill="currentColor"/>
      <path d="M 10.56 14.496 a 1.536 1.536 0 1 0 3.072 0 a 1.536 1.536 0 1 0 -3.072 0 Z" fill="currentColor"/>
    </svg>
  )
}
