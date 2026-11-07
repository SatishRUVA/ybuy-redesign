import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  timeout: 30000,
  fullyParallel: false,
  workers: 1,
  reporter: 'list',
  use: { baseURL: 'http://localhost:5177', headless: true },
  webServer: {
    command: 'pnpm exec vite preview --host localhost --port 5177 --strictPort',
    url: 'http://localhost:5177',
    reuseExistingServer: false,
    timeout: 30000,
  },
});
