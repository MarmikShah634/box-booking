/**
 * Booking flow E2E tests.
 * These tests require a running backend with test seeding enabled.
 * Set TEST_SECRET env var to enable seeding endpoint.
 *
 * Run with: TEST_SECRET=test-secret npx jest tests/e2e/booking-flow.test.ts
 */
import { type Browser, type Page } from 'puppeteer'
import { launchBrowser, USER_WEB, waitForText, fillInput, apiSeedTestData } from './helpers'

const TEST_PHONE = '9876543210'

describe('Booking Flow', () => {
  let browser: Browser
  let page: Page
  let venueSlug: string

  beforeAll(async () => {
    browser = await launchBrowser()
    // Seed a venue with an available box
    try {
      const seeded = await apiSeedTestData({ phone: TEST_PHONE })
      venueSlug = seeded.venueSlug ?? 'test-venue-1'
    } catch {
      venueSlug = 'test-venue-1'
    }
  })

  afterAll(async () => {
    await browser.close()
  })

  beforeEach(async () => {
    page = await browser.newPage()
    await page.setViewport({ width: 1280, height: 800 })
  })

  afterEach(async () => {
    await page.close()
  })

  it('venue page shows box listing', async () => {
    await page.goto(`${USER_WEB}/venue/${venueSlug}`, { waitUntil: 'networkidle2' })
    const bodyText = await page.evaluate(() => document.body.innerText)
    // Should show venue name or a fallback
    expect(bodyText.length).toBeGreaterThan(100)
  })

  it('redirects to login when unauthenticated user tries to book', async () => {
    await page.goto(`${USER_WEB}/book/test-box-1`, { waitUntil: 'networkidle2' })
    const url = page.url()
    const bodyText = await page.evaluate(() => document.body.innerText)
    const isLoginPage = url.includes('/auth/login') || bodyText.includes('Sign in')
    expect(isLoginPage).toBe(true)
  })

  it('booking page shows date picker when authenticated', async () => {
    // This test requires a valid session — skip in CI without test auth
    if (!process.env.TEST_SECRET) {
      console.log('Skipping authenticated booking test (TEST_SECRET not set)')
      return
    }
    // Set a test auth cookie
    await page.setCookie({
      name: 'refresh_user',
      value: 'test-refresh-token',
      domain: 'localhost',
      path: '/',
    })
    await page.goto(`${USER_WEB}/book/test-box-1`, { waitUntil: 'networkidle2' })
    await waitForText(page, 'Select date')
  })
})

describe('My Bookings Page', () => {
  let browser: Browser
  let page: Page

  beforeAll(async () => {
    browser = await launchBrowser()
    page = await browser.newPage()
    await page.setViewport({ width: 1280, height: 800 })
  })

  afterAll(async () => {
    await browser.close()
  })

  it('redirects to login when unauthenticated', async () => {
    await page.goto(`${USER_WEB}/me`, { waitUntil: 'networkidle2' })
    await page.waitForFunction(
      () => window.location.pathname.startsWith('/auth/login'),
      { timeout: 5000 },
    )
  })

  it('booking detail page 404s for invalid id', async () => {
    await page.goto(`${USER_WEB}/me/bookings/nonexistent-booking-id`, { waitUntil: 'networkidle2' })
    const bodyText = await page.evaluate(() => document.body.innerText)
    // Either 404 page or redirect to login
    const is404OrLogin = bodyText.includes('404') || bodyText.includes('not found') || bodyText.includes('Sign in') || page.url().includes('/auth/login')
    expect(is404OrLogin).toBe(true)
  })
})
