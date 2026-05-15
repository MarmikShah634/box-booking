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
