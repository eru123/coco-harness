/**
 * Hero workspace-row style contracts as CSS text: the row's tuned offsets,
 * the chip-family geometry the New task entry shares with HeroShell's
 * .workspace chip, and the hover rule's feedback-only discipline. jsdom has
 * no layout, so the rendering specs pin which controls exist but not whether
 * the row reads as one family.
 */
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const rootCss = readFileSync(fileURLToPath(new URL('../src/client/skeleton/ConversationRoot.module.css', import.meta.url)), 'utf8')
const shellCss = readFileSync(fileURLToPath(new URL('../src/client/skeleton/HeroShell.module.css', import.meta.url)), 'utf8')

/**
 * Declarations of one exact selector, keyed by property.
 * @param css - the module stylesheet text.
 * @param selector - exact selector text.
 * @returns the normalized declarations, or undefined when absent.
 */
function declarations(css: string, selector: string): Map<string, string> | undefined {
  const withoutComments = css.replace(/\/\*[\s\S]*?\*\//g, ' ')
  for (const [, selectorList = '', body = ''] of withoutComments.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    if (!selectorList.split(',').map(value => value.trim()).includes(selector)) continue
    const found = new Map<string, string>()
    for (const part of body.split(';')) {
      const colon = part.indexOf(':')
      if (colon === -1) continue
      found.set(part.slice(0, colon).trim(), part.slice(colon + 1).trim().replace(/\s+/g, ' '))
    }
    return found
  }
  return undefined
}

describe('hero workspace row styles', () => {
  it('keeps the row offsets that seat the chip family above the card', () => {
    const row = declarations(rootCss, '.heroWorkspaceRow')
    expect(row?.get('margin-top')).toBe('4px')
    expect(row?.get('padding-left')).toBe('20px')
  })

  it('mirrors the New task entry to the workspace chip geometry', () => {
    const chip = declarations(shellCss, '.workspace')
    const entry = declarations(rootCss, '.newTaskButton')
    for (const property of [
      'display', 'align-items', 'gap', 'min-height', 'padding', 'border',
      'border-radius', 'background', 'color', 'font-size', 'line-height',
      'font-weight', 'cursor',
    ]) {
      expect(entry?.get(property), property).toBe(chip?.get(property))
    }
  })

  it('keeps hover feedback-only: no layout properties on the hover rule', () => {
    const hover = declarations(rootCss, '.newTaskButton:hover')
    // Exact equality: a padding/margin declaration smuggled into the hover
    // rule moves the entry instead of highlighting it.
    expect(hover && Object.fromEntries(hover)).toEqual({
      background: 'var(--dsw-alias-interactive-bg-hover)',
    })
  })
})
