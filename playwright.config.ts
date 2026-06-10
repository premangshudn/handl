import { defineConfig, devices } from '@playwright/test';
import path from 'path';

// 1. Load test environment variables
process.loadEnvFile(path.resolve(process.cwd(), '.env.test'));

export default defineConfig({
  testDir: './tests/specs',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: 'html',
  
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  // 2. Configure only Chromium and WebKit (Safari) projects
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],

  // 3. Automatically spin up local Vite server in test mode before running UI tests
  webServer: {
    command: 'npx vite --mode test --port 5173',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 30 * 1000,
  },
});
