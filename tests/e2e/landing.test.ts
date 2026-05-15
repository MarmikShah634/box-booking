import { type Browser, type Page } from 'puppeteer'
import { launchBrowser, USER_WEB, waitForText } from './helpers'

describe('Landing Page', () => {
  let browser: Browser
  let page: Page

  beforeAll(async () => {
    browser = await launchBrowser()
    page = await browser.newPage()
    await page.setViewport({ width: 1280, height: 720 })
  })

  afterAll(async () => {
    await browser.close()
  })

  it('renders the home page without errors', async () => {
    const errors: string[] = []
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text())
    })
    page.on('pageerror', (err) => errors.push(err.message))

    await page.goto(`${USER_WEB}/`, { waitUntil: 'networkidle2' })

    // Filter out expected network errors for API calls to local backend
    const criticalErrors = errors.filter(
      (e) => !e.includes('localhost:3001') && !e.includes('fetch') && !e.includes('net::ERR'),
    )
    expect(criticalErrors).toHaveLength(0)
  })

  it('shows header navigation', async () => {
    await page.goto(`${USER_WEB}/`, { waitUntil: 'networkidle2' })
    await waitForText(page, 'BoxCricket')
    const loginLink = await page.$('a[href="/auth/login"]')
    expect(loginLink).toBeTruthy()
  })

  it('shows key sections', async () => {
    await page.goto(`${USER_WEB}/`, { waitUntil: 'networkidle2' })
    const bodyText = await page.evaluate(() => document.body.innerText)
    expect(bodyText).toMatch(/book|venue|cricket/i)
  })

  it('footer has legal links', async () => {
    await page.goto(`${USER_WEB}/`, { waitUntil: 'networkidle2' })
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
    await new Promise((r) => setTimeout(r, 500))
    const termsLink = await page.$('a[href="/legal/terms"]')
    const privacyLink = await page.$('a[href="/legal/privacy"]')
    expect(termsLink).toBeTruthy()
    expect(privacyLink).toBeTruthy()
  })

  it('legal pages render correctly', async () => {
    for (const path of ['/legal/terms', '/legal/privacy', '/legal/refund', '/legal/cancellation']) {
      await page.goto(`${USER_WEB}${path}`, { waitUntil: 'networkidle2' })
      const h1 = await page.$eval('h1', (el) => el.textContent)
      expect(h1).toBeTruthy()
    }
  })
})
