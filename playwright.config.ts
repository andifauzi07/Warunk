import { defineConfig, devices } from '@playwright/test'
import { ANON_KEY } from './e2e/constants'

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://127.0.0.1:4173'

export default defineConfig({
  testDir: './e2e',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [['list']],
  globalSetup: './e2e/global-setup.ts',
  use: {
    baseURL: BASE_URL,
    ...devices['Desktop Chrome'],
  },
  projects: [
    {
      name: 'terautentikasi',
      testMatch: /(day-cycle|validation)\.spec\.ts/,
      use: { storageState: 'e2e/.auth/user.json' },
    },
    {
      name: 'sesi',
      testMatch: /session\.spec\.ts/,
      use: { storageState: { cookies: [], origins: [] } },
    },
  ],
  webServer: {
    command: 'bun run build-only && bun run preview -- --port 4173 --host 127.0.0.1',
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
    env: {
      ...process.env,
      VITE_SUPABASE_URL: process.env.SUPABASE_URL ?? 'http://127.0.0.1:54321',
      VITE_SUPABASE_PUBLISHABLE_KEY: process.env.SUPABASE_ANON_KEY ?? ANON_KEY,
      VITE_SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY ?? ANON_KEY,
    },
  },
})