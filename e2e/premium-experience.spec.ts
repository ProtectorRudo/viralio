import { expect, test, type Page } from "@playwright/test";

async function enableNativeShare(page: Page) {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "share", { configurable: true, value: async () => undefined });
  });
}

async function reachWheel(page: Page, path: string) {
  await enableNativeShare(page);
  await page.goto(path);
  await page.getByRole("button", { name: /Descubrir mi premio/ }).click();
  await expect(page.getByTestId("unlock-stage")).toBeVisible();
  await expect(page.getByTestId("wheel-stage")).toHaveCount(0);
  await page.getByTestId("native-share").click();
  await expect(page.getByTestId("wheel-stage")).toBeVisible();
}

async function expectNoOverflow(page: Page) {
  const dimensions = await page.evaluate(() => ({ width: document.documentElement.clientWidth, scrollWidth: document.documentElement.scrollWidth }));
  expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.width);
}

test("Moka mobile: share gates wheel, server reward drives landing, refresh persists and WhatsApp works", async ({ page, context }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await context.route("https://wa.me/**", (route) => route.fulfill({ status: 200, contentType: "text/html", body: "WhatsApp" }));
  await enableNativeShare(page);
  await page.goto("/moka");
  await expect(page.locator("main")).toHaveAttribute("data-merchant", "moka");
  await expect(page.getByRole("heading", { name: "Hay algo especial esperando" })).toBeVisible();
  await expect(page.getByTestId("premium-wheel")).toHaveCount(0);
  await expectNoOverflow(page);

  await page.getByRole("button", { name: /Descubrir mi premio/ }).click();
  await expect(page.getByRole("heading", { name: "Compartí tu pase para abrirlo" })).toBeVisible();
  await expect(page.getByTestId("premium-wheel")).toHaveCount(0);
  await page.getByTestId("native-share").click();
  await expect(page.getByTestId("premium-wheel").locator(".wheel-segment")).toHaveCount(5);

  const spinResponse = page.waitForResponse((response) => response.url().endsWith("/spin") && response.request().method() === "POST");
  await page.getByRole("button", { name: /Girar la ruleta/ }).click();
  const serverResult = await (await spinResponse).json() as { reward: { prizeId: string; prizeName: string; shortCode: string } };
  await expect(page.getByTestId("premium-wheel")).toHaveAttribute("data-winning-prize", serverResult.reward.prizeName);
  const prizeIds = await page.getByTestId("premium-wheel").locator(".wheel-segment").evaluateAll((segments) => segments.map((segment) => segment.getAttribute("data-prize-id")));
  const winningIndex = prizeIds.indexOf(serverResult.reward.prizeId);
  const expectedRotation = 1800 - ((winningIndex + 0.5) * 360) / prizeIds.length;
  await expect(page.getByTestId("premium-wheel").locator(".wheel-svg")).toHaveAttribute("style", `transform: rotate(${expectedRotation}deg);`);
  await expect(page.getByTestId("reward-stage")).toBeVisible();
  await expect(page.getByRole("heading", { name: serverResult.reward.prizeName })).toBeVisible();
  await expectNoOverflow(page);

  await page.reload();
  await expect(page.getByTestId("reward-stage")).toBeVisible();
  await expect(page.getByText(serverResult.reward.shortCode)).toBeVisible();

  const popupPromise = page.waitForEvent("popup");
  await page.getByRole("button", { name: "Guardar premio en WhatsApp" }).click();
  const popup = await popupPromise;
  await expect.poll(() => popup.url()).toContain("wa.me/5491100000000");
  const decoded = decodeURIComponent(popup.url());
  expect(decoded).toContain("Hola Moka, guardo mi premio:");
  expect(decoded).toContain("Código:");
  expect(decoded).toContain("Vence:");
  expect(decoded).toContain("/premio/");
});

test("Atlas Barber uses the shared engine, independent theme, and themed reward card", async ({ page }) => {
  await page.setViewportSize({ width: 412, height: 915 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await reachWheel(page, "/atlas-barber");
  const root = page.locator("main");
  await expect(root).toHaveAttribute("data-merchant", "atlas-barber");
  expect(await root.evaluate((node) => getComputedStyle(node).getPropertyValue("--color-primary").trim())).toBe("#D2A64C");
  await expect(page.getByTestId("premium-wheel").locator(".wheel-segment")).toHaveCount(5);
  await page.getByRole("button", { name: /Girar la ruleta/ }).click();
  await expect(page.getByTestId("reward-stage")).toBeVisible();
  await expectNoOverflow(page);
  await page.getByRole("link", { name: "Ver tarjeta del premio" }).click();
  await expect(page.locator("main")).toHaveAttribute("data-merchant", "atlas-barber");
  await expect(page.locator("header").getByText("Atlas Barber", { exact: true })).toBeVisible();
  await expect(page.getByTestId("reward-status")).toHaveText("Disponible");
});

test("required mobile and desktop viewports have no horizontal overflow", async ({ page }) => {
  const viewports = [
    { width: 360, height: 800 },
    { width: 390, height: 844 },
    { width: 412, height: 915 },
    { width: 430, height: 932 },
    { width: 1280, height: 800 },
  ];
  for (const viewport of viewports) {
    await page.setViewportSize(viewport);
    await page.goto("/moka");
    await expect(page.getByTestId("landing-stage")).toBeVisible();
    await expectNoOverflow(page);
  }
});

test("reduced motion keeps the complete flow operable", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await reachWheel(page, "/moka");
  await page.getByRole("button", { name: /Girar la ruleta/ }).click();
  await expect(page.getByTestId("reward-stage")).toBeVisible();
  await expectNoOverflow(page);
});
