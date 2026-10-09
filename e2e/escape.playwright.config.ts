import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: ".",
  testMatch: "escape.spec.ts",
  fullyParallel: false,
  retries: 0,
  reporter: "list",
  expect: { timeout: 9_000 },
  use: {
    baseURL: "http://127.0.0.1:3333",
    browserName: "chromium",
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
  },
  webServer: {
    command: "node node_modules/next/dist/bin/next start --hostname 127.0.0.1 --port 3333",
    url: "http://127.0.0.1:3333/escape",
    timeout: 120_000,
    reuseExistingServer: false,
  },
});
