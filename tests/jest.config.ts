import type { Config } from 'jest'

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',

  // Discover all test files under tests/e2e/ (and any future sub-dirs)
  testMatch: [
    '**/tests/e2e/**/*.test.ts',
    // Fallback glob so the config works from any CWD
    '**/*.test.ts',
  ],

  // Individual test timeout — Puppeteer navigation can be slow in CI
  testTimeout: 30000,

  // Run test files sequentially to avoid port-sharing race conditions
  // between multiple browser instances opening the same Next.js dev server.
  maxWorkers: 1,

  // Verbose output so each `it(...)` is listed individually in CI logs
  verbose: true,

  // Run server-availability check before any test suite
  globalSetup: '<rootDir>/e2e/setup.ts',

  globals: {
    'ts-jest': {
      tsconfig: {
        target: 'ES2020',
        module: 'commonjs',
        strict: true,
        esModuleInterop: true,
        resolveJsonModule: true,
        skipLibCheck: true,
        // Allow the `fs` and `path` imports used in screenshotOnFailure helper
        lib: ['ES2020', 'DOM'],
        types: ['node', 'jest'],
      },
    },
  },
}

export default config
