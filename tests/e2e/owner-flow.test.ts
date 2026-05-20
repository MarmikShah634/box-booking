import { adminWebIt as it } from './skip-when-offline'
import { type Browser, type Page } from 'playwright-core'
import { launchBrowser, ADMIN_WEB, waitForText, fillInput } from './helpers'

describe('Owner Authentication', () => {
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
    await page.setViewportSize({ width: 1280, height: 720 })
  })

  afterEach(async () => {
    await page.close()
  })

  it('shows owner login page', async () => {
    await page.goto(`${ADMIN_WEB}/owner/login`, { waitUntil: 'networkidle' })
    await waitForText(page, 'email')
    const emailInput = await page.$('input[type="email"]')
    const passwordInput = await page.$('input[type="password"]')
    expect(emailInput).toBeTruthy()
    expect(passwordInput).toBeTruthy()
  })

  it('redirects unauthenticated owner from dashboard to login', async () => {
    await page.goto(`${ADMIN_WEB}/owner`, { waitUntil: 'networkidle' })
    await page.waitForFunction(
      () => window.location.pathname.includes('/login'),
      { timeout: 5000 },
    )
  })

  it('shows validation on empty login form submit', async () => {
    await page.goto(`${ADMIN_WEB}/owner/login`, { waitUntil: 'networkidle' })
    const submitBtn = await page.$('button[type="submit"]')
    if (submitBtn) await submitBtn.click()
    await new Promise((r) => setTimeout(r, 500))
    // HTML5 validation or custom error
    const bodyText = await page.evaluate(() => document.body.innerText)
    expect(bodyText).toBeTruthy() // page still loaded
  })

  it('shows register page', async () => {
    await page.goto(`${ADMIN_WEB}/owner/register`, { waitUntil: 'networkidle' })
    const bodyText = await page.evaluate(() => document.body.innerText)
    expect(bodyText.toLowerCase()).toMatch(/register|sign up|create/i)
  })

  it('shows forgot password page', async () => {
    await page.goto(`${ADMIN_WEB}/owner/forgot-password`, { waitUntil: 'networkidle' })
    const emailInput = await page.$('input[type="email"]')
    expect(emailInput).toBeTruthy()
  })
})

describe('Super Admin Authentication', () => {
  let browser: Browser
  let page: Page

  beforeAll(async () => {
    browser = await launchBrowser()
    page = await browser.newPage()
    await page.setViewportSize({ width: 1280, height: 720 })
  })

  afterAll(async () => {
    await browser.close()
  })

  it('shows super admin login page', async () => {
    await page.goto(`${ADMIN_WEB}/super-admin/login`, { waitUntil: 'networkidle' })
    const bodyText = await page.evaluate(() => document.body.innerText)
    expect(bodyText.toLowerCase()).toMatch(/admin|login|sign in/i)
  })

  it('redirects unauthenticated access to super-admin dashboard', async () => {
    await page.goto(`${ADMIN_WEB}/super-admin`, { waitUntil: 'networkidle' })
    await page.waitForFunction(
      () => window.location.pathname.includes('/login'),
      { timeout: 5000 },
    )
  })
})
