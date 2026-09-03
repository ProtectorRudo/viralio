import { expect, test } from "@playwright/test";

async function enableShare(page: import("@playwright/test").Page) {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "share", { configurable: true, value: async () => undefined });
    Object.defineProperty(navigator, "canShare", { configurable: true, value: () => false });
  });
}

async function noHorizontalOverflow(page: import("@playwright/test").Page) {
  const dimensions = await page.evaluate(() => ({
    width: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }));
  expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.width);
}

test("premium funnel uses campaign, poster, wheel hardware and voucher without changing the gate", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await enableShare(page);
  await page.goto("/moka");

  await expect(page.locator("main")).toHaveAttribute("data-design-version", "020b");
  await expect(page.getByTestId("brand-campaign-frame")).toBeVisible();
  await expect(page.getByTestId("premium-wheel")).toHaveCount(0);
  await noHorizontalOverflow(page);

  await page.getByRole("button", { name: /Descubrir mi premio/ }).click();
  await expect(page.getByTestId("share-poster-preview")).toBeVisible();
  await expect(page.getByTestId("premium-wheel")).toHaveCount(0);
  await page.getByTestId("native-share").click();

  const wheel = page.getByTestId("premium-wheel");
  await expect(wheel.locator(".wheel-bezel")).toBeVisible();
  await expect(wheel.locator(".wheel-center-cap")).toBeVisible();
  await expect(wheel).toHaveAttribute("data-spin-turns", "9");

  const spinResponse = page.waitForResponse((response) => response.url().endsWith("/spin") && response.request().method() === "POST");
  await page.getByRole("button", { name: /Girar la ruleta/ }).click();
  const result = await (await spinResponse).json() as { reward: { token: string; prizeName: string } };
  await expect(page.getByTestId("reward-voucher")).toBeVisible();
  await expect(page.getByRole("heading", { name: result.reward.prizeName })).toBeVisible();
  await noHorizontalOverflow(page);

  await page.goto(`/premio/${result.reward.token}`);
  await expect(page.getByTestId("public-reward-voucher")).toBeVisible();
  await expect(page.getByRole("button", { name: /Marcar como canjeado/i })).toHaveCount(0);
});

test("premium landing stays composed at required phone widths", async ({ page }) => {
  for (const viewport of [
    { width: 360, height: 800 },
    { width: 390, height: 844 },
    { width: 430, height: 932 },
  ]) {
    await page.setViewportSize(viewport);
    await page.goto("/atlas-barber");
    await expect(page.getByTestId("brand-campaign-frame")).toBeVisible();
    await noHorizontalOverflow(page);
  }
});
