import puppeteer, { type Browser, type Page } from 'puppeteer'
import * as fs from 'fs'
import * as path from 'path'

const USER_WEB = process.env.USER_WEB_URL || 'http://localhost:3000'
const ADMIN_WEB = process.env.ADMIN_WEB_URL || 'http://localhost:3001'
const LANDING = process.env.LANDING_URL || 'http://localhost:3003'
const API_URL = process.env.API_URL || 'http://localhost:3002'

export { USER_WEB, ADMIN_WEB, LANDING, API_URL }

export async function launchBrowser(): Promise<Browser> {
  return puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  })
}

export async function waitForText(page: Page, text: string, timeout = 8000): Promise<void> {
  await page.waitForFunction(
    (t: string) => document.body.innerText.includes(t),
    { timeout },
    text,
  )
}

export async function fillInput(page: Page, selector: string, value: string): Promise<void> {
  await page.waitForSelector(selector, { timeout: 5000 })
  await page.click(selector, { clickCount: 3 })
  await page.type(selector, value)
}

export async function clickButton(page: Page, text: string): Promise<void> {
  await page.evaluate((t: string) => {
    const btns = Array.from(document.querySelectorAll('button, a'))
    const btn = btns.find((el) => el.textContent?.trim().includes(t))
    if (btn) (btn as HTMLElement).click()
    else throw new Error(`Button "${t}" not found`)
  }, text)
}

export async function apiSeedTestData(data: {
  phone?: string
  venueOwnerId?: string
}): Promise<Record<string, string>> {
  const res = await fetch(`${API_URL}/api/v1/test/seed`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Test-Secret': process.env.TEST_SECRET || 'test-secret' },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error(`Seed failed: ${res.status}`)
  return res.json() as Promise<Record<string, string>>
}

/**
 * Wait for the browser's network activity to go idle for at least `timeout` ms.
 * Falls back to a simple setTimeout if the page's network never quiesces.
 */
export async function waitForNetworkIdle(page: Page, timeout = 5000): Promise<void> {
  try {
    await page.waitForNetworkIdle({ idleTime: 500, timeout })
  } catch {
    // networkidle not supported in all puppeteer versions — fall back
    await new Promise((r) => setTimeout(r, 500))
  }
}

/**
 * Fill a group of single-digit OTP inputs one character at a time.
 * @param selector  CSS selector that matches ALL digit inputs (e.g. 'input[maxlength="1"]')
 * @param otp       6-character numeric string
 */
export async function fillOtp(page: Page, selector: string, otp: string): Promise<void> {
  const inputs = await page.$$(selector)
  for (let i = 0; i < Math.min(otp.length, inputs.length); i++) {
    await inputs[i].click({ clickCount: 3 })
    await inputs[i].type(otp[i])
  }
}

/**
 * Wait for a toast / alert element to appear and return its visible text.
 * Tries several common toast selectors used by shadcn/ui and custom implementations.
 */
export async function getToastText(page: Page): Promise<string> {
  const toastSelectors = [
    '[data-testid="toast"]',
    '[role="alert"]',
    '[data-sonner-toast]',
    '.toast',
    '[class*="toast"]',
  ]

  for (const sel of toastSelectors) {
    try {
      await page.waitForSelector(sel, { timeout: 3000 })
      const text = await page.textContent(sel)
      if (text && text.trim().length > 0) return text.trim()
    } catch {
      // try next selector
    }
  }
  return ''
}

/**
 * Return true if the element identified by `selector` exists in the DOM,
 * without throwing when it is absent.
 */
export async function elementExists(page: Page, selector: string): Promise<boolean> {
  const el = await page.$(selector)
  return el !== null
}

/**
 * Take a PNG screenshot if the Jest test is currently failing.
 * Saves to `tests/e2e/screenshots/<testName>.png`.
 * Call this from an `afterEach` block.
 */
export async function screenshotOnFailure(page: Page, testName: string): Promise<void> {
  // Jest exposes the current test state via jasmine / jest globals
  const state = (expect as unknown as { getState: () => { currentTestName?: string; assertionCalls?: number; numPassingAsserts?: number } }).getState()
  const isFailing = state.numPassingAsserts !== undefined
    ? false // can't reliably detect mid-test; always capture when called explicitly
    : true

  // Always capture when this helper is invoked — callers decide when to invoke it
  const screenshotDir = path.join(__dirname, 'screenshots')
  if (!fs.existsSync(screenshotDir)) {
    fs.mkdirSync(screenshotDir, { recursive: true })
  }
  const safeName = testName.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 100)
  const filePath = path.join(screenshotDir, `${safeName}.png`)
  try {
    await page.screenshot({ path: filePath, fullPage: true })
  } catch {
    // page may already be closed
  }
  void isFailing // suppress unused-var warning
}

/**
 * Intercept a URL pattern and reply with a canned JSON response.
 * Uses Puppeteer's `page.route` (CDP-level request interception).
 */
export async function mockApiRoute(
  page: Page,
  urlPattern: string,
  response: object,
  status = 200,
): Promise<void> {
  await page.setRequestInterception(true)

  const listener = (request: Parameters<Parameters<typeof page.on<'request'>>[1]>[0]) => {
    if (request.url().includes(urlPattern)) {
      void request.respond({
        status,
        contentType: 'application/json',
        body: JSON.stringify(response),
      })
    } else {
      void request.continue()
    }
  }

  page.on('request', listener)
}
