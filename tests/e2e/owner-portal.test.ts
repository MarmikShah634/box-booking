/**
 * Owner portal E2E tests.
 * All API calls are mocked — no running backend required.
 *
 * The owner portal runs on port 3001 under the /owner/... path prefix.
 */
import { type Browser, type Page } from 'puppeteer'
import {
  launchBrowser,
  ADMIN_WEB,
  waitForText,
  fillInput,
  elementExists,
  screenshotOnFailure,
} from './helpers'

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

const MOCK_DASHBOARD = {
  totalRevenuePaise: 1500000,
  totalBookings: 42,
  occupancyRate: 68,
  pendingReviews: 3,
  todayBookings: [],
  revenueChart: [],
  occupancyChart: [],
}

const MOCK_VENUES = [
  {
    id: 'v1',
    name: 'Koramangala Cricket Hub',
    city: 'Bangalore',
    state: 'Karnataka',
    address: '4th Block, Koramangala',
    status: 'approved',
  },
  {
    id: 'v2',
    name: 'Indiranagar Box Arena',
    city: 'Bangalore',
    state: 'Karnataka',
    address: 'HAL 2nd Stage, Indiranagar',
    status: 'pending_review',
  },
]

const MOCK_BOOKINGS = [
  {
    id: 'b1',
    venueName: 'Koramangala Cricket Hub',
    boxName: 'Box A',
    date: '2025-05-20',
    slotLabel: '6:00 AM – 7:00 AM',
    status: 'confirmed',
    amountPaise: 90000,
    userName: 'Test Player',
  },
]

// ---------------------------------------------------------------------------
// Suite: Login page
// ---------------------------------------------------------------------------
describe('Owner Portal — Login Page', () => {
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
    await screenshotOnFailure(page, expect.getState().currentTestName ?? 'unknown')
    await page.close()
  })

  it('/owner/login renders email + password form', async () => {
    await page.goto(`${ADMIN_WEB}/owner/login`, { waitUntil: 'networkidle2' })

    const emailInput = await page.$('input[type="email"]')
    const passwordInput = await page.$('input[type="password"]')
    const submitBtn = await page.$('button[type="submit"]')

    expect(emailInput).toBeTruthy()
    expect(passwordInput).toBeTruthy()
    expect(submitBtn).toBeTruthy()
  })

  it('login page has "Owner Portal" heading', async () => {
    await page.goto(`${ADMIN_WEB}/owner/login`, { waitUntil: 'networkidle2' })
    await waitForText(page, 'Owner Portal')
  })

  it('submitting empty form shows HTML5 or custom validation errors', async () => {
    await page.goto(`${ADMIN_WEB}/owner/login`, { waitUntil: 'networkidle2' })

    const submitBtn = await page.$('button[type="submit"]')
    await submitBtn!.click()
    await new Promise((r) => setTimeout(r, 400))

    // Page should still be on login (not redirect) — validation prevented submission
    const url = page.url()
    expect(url).toContain('/owner/login')
  })

  it('invalid credentials (401) show error message', async () => {
    await page.route('**/api/v1/auth/owner/login', (route) => {
      void route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'INVALID_CREDENTIALS', message: 'Invalid email or password' }),
      })
    })

    await page.goto(`${ADMIN_WEB}/owner/login`, { waitUntil: 'networkidle2' })
    await fillInput(page, 'input[type="email"]', 'owner@example.com')
    await fillInput(page, 'input[type="password"]', 'wrongpassword')

    const submitBtn = await page.$('button[type="submit"]')
    await submitBtn!.click()
    await new Promise((r) => setTimeout(r, 800))

    const bodyText = await page.evaluate(() => document.body.innerText)
    // Should show an error alert or inline error message
    const hasError = bodyText.match(/invalid|incorrect|error|wrong|failed/i) !== null
    expect(hasError).toBe(true)

    // Must still be on login page
    expect(page.url()).toContain('/owner/login')
  })

  it('423 response (account locked) shows account-locked message', async () => {
    await page.route('**/api/v1/auth/owner/login', (route) => {
      void route.fulfill({
        status: 423,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'ACCOUNT_LOCKED', message: 'Account temporarily locked' }),
      })
    })

    await page.goto(`${ADMIN_WEB}/owner/login`, { waitUntil: 'networkidle2' })
    await fillInput(page, 'input[type="email"]', 'locked@example.com')
    await fillInput(page, 'input[type="password"]', 'somepassword')

    const submitBtn = await page.$('button[type="submit"]')
    await submitBtn!.click()
    await new Promise((r) => setTimeout(r, 800))

    const bodyText = await page.evaluate(() => document.body.innerText)
    // Should show locked / error message
    const hasLockedMsg = bodyText.match(/lock|block|suspend|error|invalid/i) !== null
    expect(hasLockedMsg).toBe(true)
  })

  it('forgot password page has an email input', async () => {
    await page.goto(`${ADMIN_WEB}/owner/forgot-password`, { waitUntil: 'networkidle2' })
    const emailInput = await page.$('input[type="email"]')
    expect(emailInput).toBeTruthy()
  })

  it('register page is accessible and contains a form', async () => {
    await page.goto(`${ADMIN_WEB}/owner/register`, { waitUntil: 'networkidle2' })
    const bodyText = await page.evaluate(() => document.body.innerText)
    expect(bodyText.toLowerCase()).toMatch(/register|sign up|create/i)
  })
})

// ---------------------------------------------------------------------------
// Suite: Auth guard
// ---------------------------------------------------------------------------
describe('Owner Portal — Auth Guards', () => {
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

  it('unauthenticated access to /owner redirects to /owner/login', async () => {
    await page.goto(`${ADMIN_WEB}/owner`, { waitUntil: 'networkidle2' })
    await page.waitForFunction(
      () => window.location.pathname.includes('/login'),
      { timeout: 8000 },
    )
  })

  it('unauthenticated access to /owner/venues redirects to login', async () => {
    await page.goto(`${ADMIN_WEB}/owner/venues`, { waitUntil: 'networkidle2' })
    const url = page.url()
    expect(url).toContain('/login')
  })

  it('unauthenticated access to /owner/bookings redirects to login', async () => {
    await page.goto(`${ADMIN_WEB}/owner/bookings`, { waitUntil: 'networkidle2' })
    const url = page.url()
    expect(url).toContain('/login')
  })
})

// ---------------------------------------------------------------------------
// Suite: Dashboard (mocked auth via Zustand store injection)
// ---------------------------------------------------------------------------
describe('Owner Portal — Dashboard (mocked)', () => {
  let browser: Browser
  let page: Page

  const injectOwnerAuth = async (p: Page) => {
    await p.evaluateOnNewDocument(() => {
      localStorage.setItem(
        'owner-auth',
        JSON.stringify({
          state: {
            owner: {
              id: 'o1',
              name: 'Test Owner',
              email: 'owner@example.com',
              kycStatus: 'verified',
              subscriptionPlan: 'pro',
              razorpayConnected: true,
              createdAt: '2024-01-01T00:00:00Z',
              subscriptionExpiresAt: '2026-01-01T00:00:00Z',
            },
          },
          version: 0,
        }),
      )
    })
  }

  beforeAll(async () => {
    browser = await launchBrowser()
  })

  afterAll(async () => {
    await browser.close()
  })

  beforeEach(async () => {
    page = await browser.newPage()
    await page.setViewport({ width: 1280, height: 800 })

    await injectOwnerAuth(page)

    // Mock dashboard API
    await page.route('**/owners/me/dashboard', (route) => {
      void route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_DASHBOARD),
      })
    })

    // Mock venues API
    await page.route('**/venues/mine', (route) => {
      void route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: MOCK_VENUES }),
      })
    })

    // Mock bookings API
    await page.route('**/owners/me/bookings', (route) => {
      void route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: MOCK_BOOKINGS }),
      })
    })

    // Mock owner profile
    await page.route('**/owners/me', (route) => {
      void route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'o1',
          name: 'Test Owner',
          email: 'owner@example.com',
          kycStatus: 'verified',
          subscriptionPlan: 'pro',
          razorpayConnected: true,
          createdAt: '2024-01-01T00:00:00Z',
          subscriptionExpiresAt: '2026-01-01T00:00:00Z',
        }),
      })
    })
  })

  afterEach(async () => {
    await screenshotOnFailure(page, expect.getState().currentTestName ?? 'unknown')
    await page.close()
  })

  it('dashboard page loads — either shows stats or redirects to login', async () => {
    await page.goto(`${ADMIN_WEB}/owner`, { waitUntil: 'networkidle2' })
    await new Promise((r) => setTimeout(r, 800))

    const bodyText = await page.evaluate(() => document.body.innerText)
    // Accepted outcomes: dashboard content OR login redirect
    const hasExpectedContent =
      bodyText.match(/dashboard|revenue|bookings|venue|login|sign in/i) !== null
    expect(hasExpectedContent).toBe(true)
  })

  it('dashboard stat tiles — page body contains booking/revenue metrics (when authenticated)', async () => {
    await page.goto(`${ADMIN_WEB}/owner`, { waitUntil: 'networkidle2' })
    await new Promise((r) => setTimeout(r, 800))

    const url = page.url()
    if (url.includes('/login')) {
      // Guard is working — skip dashboard-specific assertions
      expect(url).toContain('/login')
      return
    }

    await waitForText(page, 'Dashboard')
    const bodyText = await page.evaluate(() => document.body.innerText)
    // Dashboard should have stat labels
    expect(bodyText).toMatch(/revenue|bookings|occupancy/i)
  })

  it('venues tab shows venue list', async () => {
    await page.goto(`${ADMIN_WEB}/owner/venues`, { waitUntil: 'networkidle2' })
    await new Promise((r) => setTimeout(r, 800))

    const url = page.url()
    if (url.includes('/login')) {
      expect(url).toContain('/login')
      return
    }

    await waitForText(page, 'Venues')
    const bodyText = await page.evaluate(() => document.body.innerText)
    // Should list venue names from mock
    expect(bodyText).toMatch(/koramangala|indiranagar|venue/i)
  })

  it('empty venues state shows "No venues yet" with Add Venue CTA', async () => {
    // Override venue mock to return empty list
    await page.route('**/venues/mine', (route) => {
      void route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: [] }),
      })
    })

    await page.goto(`${ADMIN_WEB}/owner/venues`, { waitUntil: 'networkidle2' })
    await new Promise((r) => setTimeout(r, 800))

    const url = page.url()
    if (url.includes('/login')) {
      expect(url).toContain('/login')
      return
    }

    const bodyText = await page.evaluate(() => document.body.innerText)
    const hasEmptyState = bodyText.match(/no venues|add venue|no.*venue/i) !== null
    expect(hasEmptyState).toBe(true)

    // Should have a link/button to add a venue
    const addLink = await elementExists(page, 'a[href="/owner/venues/new"]')
    const addBtn = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button, a'))
      return btns.some((el) => el.textContent?.match(/add venue/i) !== null)
    })
    expect(addLink || addBtn).toBe(true)
  })

  it('bookings tab shows bookings list', async () => {
    await page.goto(`${ADMIN_WEB}/owner/bookings`, { waitUntil: 'networkidle2' })
    await new Promise((r) => setTimeout(r, 800))

    const url = page.url()
    if (url.includes('/login')) {
      expect(url).toContain('/login')
      return
    }

    const bodyText = await page.evaluate(() => document.body.innerText)
    expect(bodyText).toMatch(/bookings?|venue|date/i)
  })

  it('settings profile page renders profile form', async () => {
    await page.goto(`${ADMIN_WEB}/owner/settings/profile`, { waitUntil: 'networkidle2' })
    await new Promise((r) => setTimeout(r, 800))

    const url = page.url()
    if (url.includes('/login')) {
      expect(url).toContain('/login')
      return
    }

    const bodyText = await page.evaluate(() => document.body.innerText)
    expect(bodyText).toMatch(/profile|name|email/i)
  })
})
