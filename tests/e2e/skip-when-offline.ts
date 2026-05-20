/**
 * Utility: conditionally run or skip E2E tests based on server availability.
 * Import this at the top of each E2E test file.
 *
 * Usage:
 *   import { userWebIt, adminWebIt } from './skip-when-offline'
 *   userWebIt('navigates to login', async () => { ... })
 */

export function userWebIt(desc: string, fn: () => Promise<void>, timeoutMs = 20000): void {
  if (process.env['E2E_USER_WEB_UP'] === '1') {
    it(desc, fn, timeoutMs)
  } else {
    it.skip(`[SERVER OFFLINE] ${desc}`, fn)
  }
}

export function adminWebIt(desc: string, fn: () => Promise<void>, timeoutMs = 20000): void {
  if (process.env['E2E_ADMIN_WEB_UP'] === '1') {
    it(desc, fn, timeoutMs)
  } else {
    it.skip(`[SERVER OFFLINE] ${desc}`, fn)
  }
}

export const isUserWebUp = (): boolean => process.env['E2E_USER_WEB_UP'] === '1'
export const isAdminWebUp = (): boolean => process.env['E2E_ADMIN_WEB_UP'] === '1'
