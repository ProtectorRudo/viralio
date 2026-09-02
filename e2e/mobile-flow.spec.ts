import { expect, test } from "@playwright/test";
import { spawn, type ChildProcess } from "node:child_process";

let server: ChildProcess;

test.beforeAll(async () => {
  server = spawn(process.execPath, ["node_modules/next/dist/bin/next", "start", "--hostname", "127.0.0.1"], {
    cwd: process.cwd(),
    stdio: "ignore",
  });
  for (let attempt = 0; attempt < 120; attempt += 1) {
    try {
      const response = await fetch("http://127.0.0.1:3000/moka");
      if (response.ok) return;
    } catch { /* server is still starting */ }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error("Next.js server did not start");
});

test.afterAll(() => {
  server.kill();
});

test("mobile flow: landing → unlock → share initiated → wheel → reward → WhatsApp", async ({ page, context }) => {
  await context.addInitScript(() => {
    Object.defineProperty(navigator, "share", { configurable: true, value: async () => undefined });
  });
  await context.route("https://wa.me/**", (route) => route.fulfill({ status: 200, contentType: "text/html", body: "WhatsApp" }));

  await page.goto("/moka");
  await expect(page.getByRole("heading", { name: "Tenés un premio oculto" })).toBeVisible();
  await expect(page.getByTestId("wheel-stage")).toHaveCount(0);

  await page.getByRole("button", { name: "Descubrir mi premio" }).click();
  await expect(page.getByTestId("unlock-stage")).toBeVisible();
  await expect(page.getByTestId("wheel-stage")).toHaveCount(0);

  await page.getByTestId("native-share").click();
  await expect(page.getByTestId("wheel-stage")).toBeVisible();
  await page.getByRole("button", { name: "Girar ahora" }).click();
  await expect(page.getByTestId("reward-stage")).toBeVisible({ timeout: 5_000 });

  const popupPromise = page.waitForEvent("popup");
  await page.getByRole("button", { name: "Guardar premio en WhatsApp" }).click();
  const popup = await popupPromise;
  await expect.poll(() => popup.url()).toContain("wa.me/5491100000000");
  expect(decodeURIComponent(popup.url())).toContain("Hola Moka, guardo mi premio:");
  expect(decodeURIComponent(popup.url())).toContain("Código:");
  expect(decodeURIComponent(popup.url())).toContain("Vence:");
  expect(decodeURIComponent(popup.url())).toContain("/premio/");
});
