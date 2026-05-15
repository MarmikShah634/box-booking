import { type Browser, type Page } from 'puppeteer'
import { launchBrowser, USER_WEB, waitForText, fillInput } from './helpers'

describe('User Authentication Flow', () => {
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

  it('shows login page at /auth/login', async () => {
    await page.goto(`${USER_WEB}/auth/login`, { waitUntil: 'networkidle2' })
    await waitForText(page, 'Sign in to BoxCricket')
    const input = await page.$('input[type="text"], input[type="tel"]')
    expect(input).toBeTruthy()
  })

  it('validates phone number format', async () => {
    await page.goto(`${USER_WEB}/auth/login`, { waitUntil: 'networkidle2' })
    await fillInput(page, 'input[type="text"], input[type="tel"]', '123')
    await page.keyboard.press('Enter')
    await waitForText(page, 'valid 10-digit')
  })

  it('redirects unauthenticated user from /me to /auth/login', async () => {
    await page.goto(`${USER_WEB}/me`, { waitUntil: 'networkidle2' })
    await page.waitForFunction(() => window.location.pathname.startsWith('/auth/login'), { timeout: 5000 })
  })

  it('shows OTP input on verify page', async () => {
    await page.goto(`${USER_WEB}/auth/verify?phone=9999999999`, { waitUntil: 'networkidle2' })
    await waitForText(page, 'Enter OTP')
    const inputs = await page.$$('input[type="text"][maxlength="1"]')
    expect(inputs).toHaveLength(6)
  })

  it('shows resend button on verify page', async () => {
    await page.goto(`${USER_WEB}/auth/verify?phone=9999999999`, { waitUntil: 'networkidle2' })
    await waitForText(page, 'Resend OTP')
  })
})
