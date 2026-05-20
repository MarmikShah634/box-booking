import { chromium, type Browser, type Page, type Route } from 'playwright-core'
import * as fs from 'fs'
import * as path from 'path'
import * as child_process from 'child_process'

export const USER_WEB = process.env.USER_WEB_URL || 'http://localhost:3000'
export const ADMIN_WEB = process.env.ADMIN_WEB_URL || 'http://localhost:3001'
export const LANDING = process.env.LANDING_URL || 'http://localhost:3003'
export const API_URL = process.env.API_URL || 'http://localhost:3002'

// Use puppeteer's downloaded Chrome so we don't need a separate download
function findChrome(): string {
  const puppeteerCache = path.join(process.env.HOME ?? '/root', '.cache', 'puppeteer', 'chrome')
  if (fs.existsSync(puppeteerCache)) {
    const versions = fs.readdirSync(puppeteerCache).filter((d) => d.startsWith('linux-'))
    if (versions.length > 0) {
      const latest = versions[versions.length - 1]!
      const bin = path.join(puppeteerCache, latest, 'chrome-linux64', 'chrome')
      if (fs.existsSync(bin)) return bin
    }
  }
  // Fallback: try system paths
  for (const p of ['/usr/bin/chromium', '/usr/bin/chromium-browser', '/usr/bin/google-chrome']) {
    if (fs.existsSync(p)) return p
  }
  throw new Error('No Chrome/Chromium binary found. Run: npx puppeteer browsers install chrome')
}

export async function launchBrowser(): Promise<Browser> {
  return chromium.launch({
    executablePath: findChrome(),
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  })
}

export async function newPage(browser: Browser): Promise<Page> {
  const page = await browser.newPage()
  await page.setViewportSize({ width: 1280, height: 720 })
  return page
}

// ── Wait helpers ─────────────────────────────────────────────────────────────

export async function waitForText(page: Page, text: string, timeout = 8000): Promise<void> {
  await page.waitForFunction((t: string) => document.body.innerText.includes(t), text, { timeout })
}

export async function waitForNetworkIdle(page: Page, timeout = 5000): Promise<void> {
  await page.waitForLoadState('networkidle', { timeout })
}

export async function elementExists(page: Page, selector: string): Promise<boolean> {
  return (await page.$(selector)) !== null
}

// ── Form helpers ──────────────────────────────────────────────────────────────

export async function fillInput(page: Page, selector: string, value: string): Promise<void> {
  await page.waitForSelector(selector, { timeout: 5000 })
  await page.fill(selector, value)
}

// Fill 6-digit OTP split across individual single-char inputs
export async function fillOtp(page: Page, containerSelector: string, otp: string): Promise<void> {
  const inputs = await page.$$(containerSelector)
  for (let i = 0; i < Math.min(otp.length, inputs.length); i++) {
    await inputs[i]!.fill(otp[i]!)
  }
}

// ── API mocking ───────────────────────────────────────────────────────────────

type MockDef = { status: number; body?: unknown; contentType?: string }

export async function mockApiRoute(page: Page, urlPattern: string, response: MockDef): Promise<void> {
  await page.route(`**${urlPattern}**`, (route: Route) => {
    void route.fulfill({
      status: response.status,
      contentType: response.contentType ?? 'application/json',
      body: response.body !== undefined ? JSON.stringify(response.body) : '',
    })
  })
}

// ── Screenshot on failure ─────────────────────────────────────────────────────

export async function screenshotOnFailure(page: Page, testName: string): Promise<void> {
  const dir = path.join(__dirname, '..', 'screenshots')
  fs.mkdirSync(dir, { recursive: true })
  const file = path.join(dir, `${testName.replace(/\s+/g, '_')}_${Date.now()}.png`)
  await page.screenshot({ path: file, fullPage: true })
  console.log(`Screenshot saved: ${file}`)
}

// ── Toast helper ──────────────────────────────────────────────────────────────

export async function getToastText(page: Page, timeout = 5000): Promise<string> {
  const sel = '[role="alert"], [data-testid="toast"], .toast'
  await page.waitForSelector(sel, { timeout })
  return (await page.textContent(sel)) ?? ''
}

// ── Server availability ───────────────────────────────────────────────────────

export async function isServerUp(url: string, timeoutMs = 3000): Promise<boolean> {
  try {
    const ctrl = new AbortController()
    const id = setTimeout(() => ctrl.abort(), timeoutMs)
    const res = await fetch(url, { signal: ctrl.signal })
    clearTimeout(id)
    return res.status < 500
  } catch {
    return false
  }
}

// ── Seed helper ───────────────────────────────────────────────────────────────

export async function seedTestData(endpoint: string, data: unknown): Promise<void> {
  const res = await fetch(`${API_URL}${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error(`Seed failed: ${res.status}`)
}
