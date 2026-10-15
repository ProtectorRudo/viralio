import {defineConfig} from "@playwright/test";
export default defineConfig({
  testDir:"./e2e",
  fullyParallel:false,
  workers:1,
  retries:0,
  timeout:60_000,
  reporter:"list",
  expect:{timeout:12_000},
  use:{baseURL:"http://127.0.0.1:3000",browserName:"chromium",trace:"retain-on-failure"},
  webServer:{
    command:"node node_modules/next/dist/bin/next start --hostname 127.0.0.1 --port 3000",
    url:"http://127.0.0.1:3000/la-ultima-jugada",
    reuseExistingServer:false,
    timeout:120_000
  }
});