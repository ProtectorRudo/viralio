import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  retries: 0,
  reporter: "list",
  expect: { timeout: 7_000 },
  use: { baseURL: "http://127.0.0.1:3000", browserName: "chromium", trace: "retain-on-failure" },
  webServer: {
    command: "node node_modules/next/dist/bin/next start --hostname 127.0.0.1",
    url: "http://127.0.0.1:3000/moka",
    reuseExistingServer: false,
    timeout: 30_000,
  },
  projects: [{ name: "chromium-responsive" }],
});
