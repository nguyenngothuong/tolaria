import { expect, test } from '@playwright/test'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

type ScreenshotRecord = {
  description: string
  path: string
  project: string
  viewport: { height: number; width: number } | null
}

const screenshotDir = process.env.MOBILE_QA_SCREENSHOT_DIR ?? '/tmp/tolaria-mobile-ui-screenshots'

async function recordScreenshot(record: ScreenshotRecord) {
  const manifestPath = join(screenshotDir, 'manifest.json')
  let existing: ScreenshotRecord[] = []
  try {
    existing = JSON.parse(await readFile(manifestPath, 'utf8')) as ScreenshotRecord[]
  } catch {
    existing = []
  }

  const next = existing.filter((item) => item.path !== record.path)
  next.push(record)
  await writeFile(manifestPath, `${JSON.stringify(next, null, 2)}\n`)
}

async function captureUiState({
  description,
  page,
  projectName,
}: {
  description: string
  page: import('@playwright/test').Page
  projectName: string
}) {
  await mkdir(screenshotDir, { recursive: true })
  const screenshotPath = join(screenshotDir, `${projectName}-${description}.png`)
  await page.screenshot({ fullPage: true, path: screenshotPath })
  await recordScreenshot({
    description,
    path: screenshotPath,
    project: projectName,
    viewport: page.viewportSize(),
  })
}

test.describe('mobile UI lab screenshots', () => {
  test('captures the initial workspace reference state', async ({ page }, testInfo) => {
    await page.goto('/')

    await expect(page.getByText('Inbox').first()).toBeVisible()
    await expect(page.getByRole('button', { name: 'Workflow Orchestration Essay' })).toBeVisible()

    if (testInfo.project.name !== 'phone-portrait') {
      await expect(page.getByText('Properties', { exact: true })).toBeVisible()
    }

    await captureUiState({
      description: 'initial',
      page,
      projectName: testInfo.project.name,
    })
  })

  test('captures a selected-note state on tablet layouts', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === 'phone-portrait', 'Phone layout captures the scrollable tablet preview only.')

    await page.goto('/')

    await page.getByText('How I Run an Open Source Project').click()
    await expect(page.getByText('Inbox / How I Run an Open Source Project')).toBeVisible()
    await expect(page.getByText('Procedure').last()).toBeVisible()

    await captureUiState({
      description: 'selected-open-source-project',
      page,
      projectName: testInfo.project.name,
    })
  })
})
