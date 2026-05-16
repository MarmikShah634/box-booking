import { type Browser, type Page } from 'puppeteer'
import { launchBrowser, USER_WEB, LANDING, waitForText, elementExists, screenshotOnFailure } from './helpers'

// ---------------------------------------------------------------------------
// Existing suite — landing page served from the user-web (port 3000)
// ---------------------------------------------------------------------------
describe('Landing Page (user-web)', () => {
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
      (e) => !e.includes('localhost:3001') && !e.includes('localhost:3002') && !e.includes('fetch') && !e.includes('net::ERR'),
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
    for (const legalPath of ['/legal/terms', '/legal/privacy', '/legal/refund', '/legal/cancellation']) {
      await page.goto(`${USER_WEB}${legalPath}`, { waitUntil: 'networkidle2' })
      const h1 = await page.$eval('h1', (el) => el.textContent)
      expect(h1).toBeTruthy()
    }
  })
})

// ---------------------------------------------------------------------------
// Extended suite — marketing landing page (port 3003)
// ---------------------------------------------------------------------------
describe('Marketing Landing Page (port 3003)', () => {
  let browser: Browser
  let page: Page

  beforeAll(async () => {
    browser = await launchBrowser()
  })

  afterAll(async () => {
    await browser.close()
  })

  beforeEach(async () => {
    page = await browser.newPage()
    await page.setViewport({ width: 1280, height: 720 })
  })

  afterEach(async () => {
    await page.close()
  })

  it('page title and meta description are set', async () => {
    await page.goto(`${LANDING}/`, { waitUntil: 'networkidle2' })

    const title = await page.title()
    expect(title.length).toBeGreaterThan(5)

    const metaDesc = await page.$eval(
      'meta[name="description"]',
      (el) => el.getAttribute('content') ?? '',
    )
    expect(metaDesc.length).toBeGreaterThan(10)
  })

  it('hero section renders with headline text', async () => {
    await page.goto(`${LANDING}/`, { waitUntil: 'networkidle2' })
    const bodyText = await page.evaluate(() => document.body.innerText)
    expect(bodyText).toMatch(/cricket/i)
    const h1 = await page.$('h1')
    expect(h1).toBeTruthy()
  })

  it('"Find venues" / "Book" CTA links to user web app', async () => {
    await page.goto(`${LANDING}/`, { waitUntil: 'networkidle2' })
    // The Hero CTA href points to localhost:3000
    const hrefs: string[] = await page.evaluate(() =>
      Array.from(document.querySelectorAll('a')).map((a) => a.getAttribute('href') ?? ''),
    )
    const hasUserWebLink = hrefs.some((h) => h.includes('localhost:3000') || h === '/')
    expect(hasUserWebLink).toBe(true)
  })

  it('"List your venue" CTA links to owner portal', async () => {
    await page.goto(`${LANDING}/`, { waitUntil: 'networkidle2' })
    const hrefs: string[] = await page.evaluate(() =>
      Array.from(document.querySelectorAll('a')).map((a) => a.getAttribute('href') ?? ''),
    )
    const hasOwnerLink = hrefs.some(
      (h) => h.includes('/owner/register') || h.includes('localhost:3001'),
    )
    expect(hasOwnerLink).toBe(true)
  })

  it('navigation has logo text "BoxCricket"', async () => {
    await page.goto(`${LANDING}/`, { waitUntil: 'networkidle2' })
    await waitForText(page, 'BoxCricket')
    const logo = await page.evaluate(() => {
      // Logo is a Link containing "Box" + "Cricket" spans
      return document.body.innerText.includes('BoxCricket') ||
             document.body.innerHTML.includes('BoxCricket')
    })
    expect(logo).toBe(true)
  })

  it('navigation contains section anchor links', async () => {
    await page.goto(`${LANDING}/`, { waitUntil: 'networkidle2' })
    const navHrefs: string[] = await page.evaluate(() =>
      Array.from(document.querySelectorAll('header a, nav a')).map(
        (a) => a.getAttribute('href') ?? '',
      ),
    )
    // Expect at least one anchor link to a section
    const hasAnchorLinks = navHrefs.some((h) => h.startsWith('#'))
    expect(hasAnchorLinks).toBe(true)
  })

  it('footer contains Terms, Privacy, Refund, Cancellation links', async () => {
    await page.goto(`${LANDING}/`, { waitUntil: 'networkidle2' })
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
    await new Promise((r) => setTimeout(r, 400))

    const footerText = await page.$eval('footer', (el) => el.innerText)
    expect(footerText).toMatch(/terms/i)
    expect(footerText).toMatch(/privacy/i)
    expect(footerText).toMatch(/refund/i)
    expect(footerText).toMatch(/cancellation/i)
  })

  it('footer legal links point to user-web legal pages', async () => {
    await page.goto(`${LANDING}/`, { waitUntil: 'networkidle2' })
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
    await new Promise((r) => setTimeout(r, 400))

    const footerLinks: string[] = await page.evaluate(() =>
      Array.from(document.querySelectorAll('footer a')).map(
        (a) => a.getAttribute('href') ?? '',
      ),
    )
    const hasTerms = footerLinks.some((h) => h.includes('/legal/terms'))
    const hasPrivacy = footerLinks.some((h) => h.includes('/legal/privacy'))
    const hasRefund = footerLinks.some((h) => h.includes('/legal/refund'))
    const hasCancellation = footerLinks.some((h) => h.includes('/legal/cancellation'))

    expect(hasTerms).toBe(true)
    expect(hasPrivacy).toBe(true)
    expect(hasRefund).toBe(true)
    expect(hasCancellation).toBe(true)
  })

  it('mobile menu toggle works at 375px viewport', async () => {
    await page.setViewport({ width: 375, height: 812 })
    await page.goto(`${LANDING}/`, { waitUntil: 'networkidle2' })

    // Hamburger button should be visible, desktop nav hidden
    const hamburger = await page.$('button[aria-label="Toggle menu"]')
    expect(hamburger).toBeTruthy()

    // Mobile menu panel should NOT be visible before click
    const menuBefore = await elementExists(page, 'header .md\\:hidden a[href="#how-it-works"]')
    expect(menuBefore).toBe(false)

    // Click hamburger to open menu
    await hamburger!.click()
    await new Promise((r) => setTimeout(r, 300))

    // After click, the mobile nav links should appear
    const bodyText = await page.evaluate(() => document.body.innerText)
    expect(bodyText).toMatch(/how it works|cities|for owners|pricing/i)
  })

  it('each legal page loads with an h1 heading (not 404)', async () => {
    const legalPaths = ['/legal/terms', '/legal/privacy', '/legal/refund', '/legal/cancellation']
    for (const legalPath of legalPaths) {
      // These pages are served by user-web (port 3000)
      const newPage = await browser.newPage()
      try {
        await newPage.setViewport({ width: 1280, height: 720 })
        await newPage.goto(`${USER_WEB}${legalPath}`, { waitUntil: 'networkidle2' })
        const bodyText = await newPage.evaluate(() => document.body.innerText)
        // Must not be a 404 page
        expect(bodyText).not.toMatch(/404|page not found/i)
        // Must have meaningful content
        const h1 = await newPage.$eval('h1', (el) => el.textContent?.trim() ?? '')
        expect(h1.length).toBeGreaterThan(3)
      } finally {
        await newPage.close()
      }
    }
  })
})
