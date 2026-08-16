import { fileURLToPath } from 'node:url'
import type { Browser, Page } from 'playwright'
import { chromium } from 'playwright'
import { afterAll, beforeAll, describe, expect, it, onTestFailed } from 'vitest'
import { createMessage, createUserMessage } from '@coco-harness/cch-llm'
import { SESSION_FORMAT_VERSION, Session, SessionId } from '@coco-harness/cch-session'
import type {} from '@coco-harness/cch-session-title'
import {
  assertFixtureInventory,
  captureStableAria,
  compareOrRefreshGolden,
  launchWebScaffold,
  seedSession,
  watchConsole,
  webSnapshotMode,
  type WebScaffold,
} from './scaffold.ts'
import { newEnglishPage, saveFailureShot } from './support.ts'

const SNAPSHOT_DIR = fileURLToPath(new URL('./snapshots/markdown-cjk-strong', import.meta.url))
const UI_EXPECTED = fileURLToPath(new URL('./snapshots/markdown-cjk-strong/ui.expected.md', import.meta.url))
const MODE = webSnapshotMode()
const SEED_ID = 'markdown-cjk-strong-web-e2e'
const DONE = 'CJK_STRONG_DONE'
const CASES = [
  ['**Note：**content', 'Note：', 'Note：content'],
  ['**Notice:**content', 'Notice:', 'Notice:content'],
  ['**Middleware（waterfall）**implementation', 'Middleware（waterfall）', 'Middleware（waterfall）implementation'],
  ['**Middleware(waterfall)**implementation', 'Middleware(waterfall)', 'Middleware(waterfall)implementation'],
  ['**Period。**follow-up', 'Period。', 'Period。follow-up'],
  ['**Period.**follow-up', 'Period.', 'Period.follow-up'],
  ['**Reminder！**continue', 'Reminder！', 'Reminder！continue'],
  ['**Warning!**continue', 'Warning!', 'Warning!continue'],
] as const

/** Build one settled assistant reply covering strong-span boundaries at CJK punctuation. */
function markdownFixture(): string {
  const session = Session.create(SessionId('markdown-cjk-strong-source'))
  const eventTimeOrigin = new Date().setHours(12, 0, 0, 0)
  session.append('turn/start', { turn: 1 })
  const user = session.append('user/message', createUserMessage({
    content: [{ type: 'text', text: 'Render adjacent CJK strong emphasis.' }],
    source: { kind: 'user' },
  }), { surfaceOp: 'append' })
  session.append('session/title', {
    title: 'CJK strong emphasis',
    messageSeqs: [user.seq],
    source: { kind: 'fallback' },
  })
  session.append('step/start', { turn: 1, step: 1 })
  session.append('assistant/message', {
    turn: 1,
    step: 1,
    message: createMessage({
      role: 'assistant',
      content: [{
        type: 'text',
        text: [
          '## CJK strong emphasis',
          '',
          ...CASES.flatMap(([markdown]) => [markdown, '']),
          DONE,
        ].join('\n'),
      }],
      source: { kind: 'model', provider: 'fixture', model: 'fixture' },
    }),
  }, { surfaceOp: 'append' })
  session.append('step/end', { turn: 1, step: 1 })
  session.append('turn/end', { turn: 1, reason: { kind: 'completed' } })

  return [
    JSON.stringify({
      type: 'session',
      version: SESSION_FORMAT_VERSION,
      id: '{{sessionId}}',
      createdAt: 0,
      cwd: '{{cwd}}',
    }),
    ...session.events.map(event => JSON.stringify({
      ...event,
      time: eventTimeOrigin + event.seq * 1_000,
    })),
    '',
  ].join('\n')
}

describe('web e2e: Markdown strong emphasis at CJK punctuation', () => {
  let scaffold: WebScaffold
  let browser: Browser
  let page: Page
  let tripwire: ReturnType<typeof watchConsole>

  beforeAll(async () => {
    scaffold = await launchWebScaffold({})
    await seedSession(scaffold, markdownFixture(), SEED_ID)
    browser = await chromium.launch()
    page = await newEnglishPage(browser)
    tripwire = watchConsole(page)
    await page.goto(scaffold.baseUrl, { waitUntil: 'load' })
    await page.waitForSelector('[class*="frame"]', { timeout: 30_000 })
  }, 120_000)

  afterAll(async () => {
    await browser?.close()
    await scaffold?.close()
  })

  it.skipIf(MODE === 'record')('renders punctuation-terminated strong spans before adjacent text', async () => {
    onTestFailed(() => saveFailureShot(page, 'web-e2e-markdown-cjk-strong'))
    const groupRow = page.locator('[role="treeitem"]').first()
    await groupRow.waitFor({ timeout: 15_000 })
    await groupRow.click()
    const sessionRow = page.locator('[role="treeitem"]').nth(1)
    await sessionRow.waitFor({ timeout: 10_000 })
    await sessionRow.click()
    await expect.poll(() => page.getByText(DONE, { exact: true }).count(), { timeout: 15_000 }).toBe(1)

    const strong = page.locator('[class*="markdown"] strong')
    await expect.poll(() => strong.count(), { timeout: 10_000 }).toBe(CASES.length)
    expect(await strong.allTextContents()).toEqual(CASES.map(([, expected]) => expected))
    for (const [, , paragraph] of CASES) {
      expect(await page.getByText(paragraph, { exact: true }).count()).toBe(1)
    }

    const snapshot = (await captureStableAria(page, '[class*="centerCol"]', scaffold.workspaceCwd))
      .split(SEED_ID).join('{{seededId}}')
    await compareOrRefreshGolden(UI_EXPECTED, snapshot, MODE)
    expect(tripwire.pageErrors).toEqual([])
    expect(tripwire.warnings).toEqual([])
    await assertFixtureInventory(SNAPSHOT_DIR, ['ui.expected.md'])
  }, 60_000)
})
