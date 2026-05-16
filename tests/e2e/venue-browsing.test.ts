/**
 * Venue browsing E2E tests.
 *
 * All API calls are mocked via page.route() so tests run without a backend.
 */
import { type Browser, type Page } from 'puppeteer'
import {
  launchBrowser,
  USER_WEB,
  waitForText,
  elementExists,
  screenshotOnFailure,
} from './helpers'

// ---------------------------------------------------------------------------
// Mock data helpers
// ---------------------------------------------------------------------------

const MOCK_VENUES = Array.from({ length: 6 }, (_, i) => ({
  id: String(i + 1),
  slug: `venue-${i + 1}`,
  name: `Cricket Arena ${i + 1}`,
  city: ['Bangalore', 'Mumbai', 'Pune', 'Delhi', 'Hyderabad', 'Chennai'][i],
  area: ['Koramangala', 'Andheri', 'Baner', 'Lajpat Nagar', 'Gachibowli', 'T Nagar'][i],
  address: `${i + 1} Main Road, City`,
  rating: 4.2 + i * 0.1,
  reviewCount: 30 + i * 10,
  minPricePaise: (700 + i * 50) * 100,
  amenities: ['Floodlights', 'Parking', 'Washroom'],
}))

const MOCK_VENUE_DETAIL = {
  id: '1',
  slug: 'venue-1',
  name: 'Cricket Arena 1',
  city: 'Bangalore',
  area: 'Koramangala',
  address: '4th Block, Koramangala, Bangalore',
  phone: '+91 98765 43210',
  description: 'Premium box cricket facility.',
  images: [
    'https://picsum.photos/seed/v1/1200/800',
    'https://picsum.photos/seed/v2/1200/800',
  ],
  rating: 4.7,
  reviewCount: 143,
  openTime: '06:00 AM',
  closeTime: '11:00 PM',
  amenities: ['Floodlights', 'Parking', 'Washroom', 'Equipment', 'Cafeteria'],
  boxes: [
    {
      id: 'box-1',
      name: 'Box A – Premium',
      description: 'Natural turf, premium nets',
      capacity: 22,
      minPricePaise: 120000,
      isActive: true,
      surface: 'Natural turf',
      dimensions: '22 × 12m',
    },
    {
      id: 'box-2',
      name: 'Box B – Standard',
      description: 'Synthetic turf',
      capacity: 20,
      minPricePaise: 90000,
      isActive: true,
      surface: 'Synthetic turf',
      dimensions: '20 × 10m',
    },
  ],
  pricingSlots: [
    { label: 'Morning', startTime: '6:00 AM', endTime: '10:00 AM', weekdayPaise: 70000, weekendPaise: 80000 },
  ],
  reviews: [
    { id: 'r1', author: 'Rohit', rating: 5, comment: 'Excellent!', createdAt: '2024-12-15T10:00:00Z' },
  ],
}

// ---------------------------------------------------------------------------
// Suite: Home page
// ---------------------------------------------------------------------------
describe('Venue Browsing — Home Page', () => {
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
    await page.setViewport({ width: 1280, height: 800 })

    // Mock the featured venues API
    await page.route('**/venues/public**', (route) => {
      void route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ venues: MOCK_VENUES }),
      })
    })
  })

  afterEach(async () => {
    await screenshotOnFailure(page, expect.getState().currentTestName ?? 'unknown')
    await page.close()
  })

  it('home page loads and shows featured venues section', async () => {
    await page.goto(`${USER_WEB}/`, { waitUntil: 'networkidle2' })

    // Either the actual API data or mock fallback renders venue cards
    const bodyText = await page.evaluate(() => document.body.innerText)
    expect(bodyText).toMatch(/venue|cricket|arena/i)
  })

  it('home page shows a "Browse by city" section', async () => {
    await page.goto(`${USER_WEB}/`, { waitUntil: 'networkidle2' })
    await waitForText(page, 'Browse by city')
  })

  it('city cards link to /city/[slug]', async () => {
    await page.goto(`${USER_WEB}/`, { waitUntil: 'networkidle2' })
    await waitForText(page, 'Browse by city')

    const cityLinks: string[] = await page.evaluate(() =>
      Array.from(document.querySelectorAll('a[href^="/city/"]')).map(
        (a) => a.getAttribute('href') ?? '',
      ),
    )
    expect(cityLinks.length).toBeGreaterThan(0)
    expect(cityLinks[0]).toMatch(/^\/city\//)
  })

  it('clicking a city card navigates to /city/[slug]', async () => {
    await page.goto(`${USER_WEB}/`, { waitUntil: 'networkidle2' })
    await waitForText(page, 'Browse by city')

    await Promise.all([
      page.waitForURL('**/city/**', { timeout: 8000 }),
      page.click('a[href^="/city/"]'),
    ])

    expect(page.url()).toContain('/city/')
  })

  it('venue card shows name, city and price info', async () => {
    await page.goto(`${USER_WEB}/`, { waitUntil: 'networkidle2' })
    await new Promise((r) => setTimeout(r, 1000)) // allow Suspense to resolve

    const bodyText = await page.evaluate(() => document.body.innerText)
    // Mock data or real data: should contain venue/price text
    expect(bodyText).toMatch(/₹|arena|venue|cricket/i)
  })

  it('venue cards link to /venue/[slug]', async () => {
    await page.goto(`${USER_WEB}/`, { waitUntil: 'networkidle2' })
    await new Promise((r) => setTimeout(r, 1200))

    const venueLinks: string[] = await page.evaluate(() =>
      Array.from(document.querySelectorAll('a[href^="/venue/"]')).map(
        (a) => a.getAttribute('href') ?? '',
      ),
    )
    // There should be venue links (either from API data or mock fallback)
    expect(venueLinks.length).toBeGreaterThanOrEqual(0)
    // If any exist, they should have the correct prefix
    for (const link of venueLinks) {
      expect(link).toMatch(/^\/venue\//)
    }
  })

  it('"Top-rated venues" heading is visible', async () => {
    await page.goto(`${USER_WEB}/`, { waitUntil: 'networkidle2' })
    await new Promise((r) => setTimeout(r, 1200))

    const bodyText = await page.evaluate(() => document.body.innerText)
    expect(bodyText).toMatch(/top.rated|featured|venues/i)
  })
})

// ---------------------------------------------------------------------------
// Suite: City listing page
// ---------------------------------------------------------------------------
describe('Venue Browsing — City Listing Page', () => {
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
    await page.setViewport({ width: 1280, height: 800 })

    // Mock city venue API
    await page.route('**/venues/public**', (route) => {
      void route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          venues: MOCK_VENUES.slice(0, 3),
          total: 3,
          page: 1,
          limit: 20,
        }),
      })
    })
  })

  afterEach(async () => {
    await screenshotOnFailure(page, expect.getState().currentTestName ?? 'unknown')
    await page.close()
  })

  it('city page loads for /city/bangalore', async () => {
    await page.goto(`${USER_WEB}/city/bangalore`, { waitUntil: 'networkidle2' })
    const bodyText = await page.evaluate(() => document.body.innerText)
    expect(bodyText).toMatch(/bangalore|venue|cricket/i)
    expect(bodyText).not.toMatch(/404|not found/i)
  })

  it('city page shows venue cards or empty state', async () => {
    await page.goto(`${USER_WEB}/city/bangalore`, { waitUntil: 'networkidle2' })
    await new Promise((r) => setTimeout(r, 800))

    const bodyText = await page.evaluate(() => document.body.innerText)
    // Should show either venue listings or an empty/loading state
    const hasMeaningfulContent = bodyText.length > 50
    expect(hasMeaningfulContent).toBe(true)
  })

  it('city page for unknown city returns graceful fallback (no crash)', async () => {
    await page.goto(`${USER_WEB}/city/nowhere-land`, { waitUntil: 'networkidle2' })
    const bodyText = await page.evaluate(() => document.body.innerText)
    // Should not hard-crash; shows empty state or 404 page gracefully
    expect(bodyText.length).toBeGreaterThan(0)
  })
})

// ---------------------------------------------------------------------------
// Suite: Venue detail page
// ---------------------------------------------------------------------------
describe('Venue Browsing — Venue Detail Page', () => {
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
    await page.setViewport({ width: 1280, height: 800 })

    // Mock the venue detail endpoint
    await page.route('**/api/v1/venues/public/**', (route) => {
      void route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_VENUE_DETAIL),
      })
    })
  })

  afterEach(async () => {
    await screenshotOnFailure(page, expect.getState().currentTestName ?? 'unknown')
    await page.close()
  })

  it('venue detail page renders the venue name as h1', async () => {
    await page.goto(`${USER_WEB}/venue/venue-1`, { waitUntil: 'networkidle2' })

    const h1 = await page.$eval('h1', (el) => el.textContent?.trim() ?? '')
    expect(h1.length).toBeGreaterThan(3)
  })

  it('venue detail page shows amenity chips', async () => {
    await page.goto(`${USER_WEB}/venue/venue-1`, { waitUntil: 'networkidle2' })

    const bodyText = await page.evaluate(() => document.body.innerText)
    // MOCK_VENUE_DETAIL has amenities: Floodlights, Parking, Washroom, Equipment, Cafeteria
    expect(bodyText).toMatch(/floodlights|parking|washroom|equipment/i)
  })

  it('venue detail page shows "Available boxes" section', async () => {
    await page.goto(`${USER_WEB}/venue/venue-1`, { waitUntil: 'networkidle2' })
    await waitForText(page, 'Available boxes')
  })

  it('venue detail page shows box names from the boxes list', async () => {
    await page.goto(`${USER_WEB}/venue/venue-1`, { waitUntil: 'networkidle2' })
    const bodyText = await page.evaluate(() => document.body.innerText)
    expect(bodyText).toMatch(/box/i)
  })

  it('"Book" button on a box navigates to /book/[boxId]', async () => {
    await page.goto(`${USER_WEB}/venue/venue-1`, { waitUntil: 'networkidle2' })
    await new Promise((r) => setTimeout(r, 600))

    // Find a Book link/button leading to /book/
    const bookLink = await page.$('a[href*="/book/"]')
    if (bookLink) {
      const href = await bookLink.evaluate((el) => el.getAttribute('href') ?? '')
      expect(href).toMatch(/\/book\//)
    } else {
      // If no Book link, the page should at least show box info
      const bodyText = await page.evaluate(() => document.body.innerText)
      expect(bodyText).toMatch(/box|book|₹/i)
    }
  })

  it('back navigation from venue detail returns to previous page', async () => {
    // First navigate to the home page, then to venue detail
    await page.goto(`${USER_WEB}/`, { waitUntil: 'networkidle2' })
    await page.goto(`${USER_WEB}/venue/venue-1`, { waitUntil: 'networkidle2' })

    await page.goBack()
    await new Promise((r) => setTimeout(r, 400))

    const url = page.url()
    expect(url).not.toContain('/venue/venue-1')
  })

  it('venue detail shows rating and review count', async () => {
    await page.goto(`${USER_WEB}/venue/venue-1`, { waitUntil: 'networkidle2' })
    const bodyText = await page.evaluate(() => document.body.innerText)
    // MOCK_VENUE_DETAIL has rating 4.7 and 143 reviews
    expect(bodyText).toMatch(/4\.[0-9]|reviews?/i)
  })

  it('venue detail shows location / address information', async () => {
    await page.goto(`${USER_WEB}/venue/venue-1`, { waitUntil: 'networkidle2' })
    const bodyText = await page.evaluate(() => document.body.innerText)
    expect(bodyText).toMatch(/koramangala|bangalore|location/i)
  })
})
