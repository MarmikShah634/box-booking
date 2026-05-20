/**
 * Global E2E test setup.
 * Checks server availability before each test suite.
 * Sets process.env.E2E_SERVERS_AVAILABLE so individual tests can skip.
 */
import { isServerUp, USER_WEB, ADMIN_WEB } from './helpers'

export default async function globalSetup(): Promise<void> {
  const [userUp, adminUp] = await Promise.all([
    isServerUp(USER_WEB, 2000),
    isServerUp(ADMIN_WEB, 2000),
  ])

  process.env['E2E_USER_WEB_UP'] = userUp ? '1' : '0'
  process.env['E2E_ADMIN_WEB_UP'] = adminUp ? '1' : '0'

  if (!userUp && !adminUp) {
    console.log('\n⚠️  E2E: No servers running. Tests will pass with skip messages.')
    console.log('   Start servers: pnpm dev')
    console.log(`   USER_WEB:  ${USER_WEB}`)
    console.log(`   ADMIN_WEB: ${ADMIN_WEB}\n`)
  }
}
