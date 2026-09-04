import { expect, test } from "@playwright/test";

const slug = "joyeria-aurora";

async function expectNoOverflow(page: Parameters<typeof test>[0] extends never ? never : import("@playwright/test").Page) {
  const dimensions = await page.evaluate(() => ({
    width: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }));
  expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.width);
}

test("approved Aurora reference renders and reduced wheel remains perceptible", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "share", { configurable: true, value: async () => undefined });
    Object.defineProperty(navigator, "canShare", { configurable: true, value: () => false });
  });

  await page.goto("/alta");
  await page.getByTestId("onboarding-key").fill("ci-viralio-onboarding-key-with-24-characters");
  await page.getByTestId("onboarding-name").fill("Joyería Aurora");
  await page.getByTestId("onboarding-slug").fill(slug);
  await page.getByTestId("onboarding-template").selectOption("generic");
  await page.getByTestId("onboarding-whatsapp").fill("5492215550099");
  await page.getByTestId("onboarding-pin").fill("482619");
  const createResponse = page.waitForResponse((response) => response.url().endsWith("/api/onboarding/merchants") && response.request().method() === "POST");
  await page.getByTestId("create-merchant").click();
  expect((await createResponse).status()).toBe(201);

  for (const viewport of [
    { width: 360, height: 800 },
    { width: 390, height: 844 },
    { width: 430, height: 932 },
  ]) {
    await page.setViewportSize(viewport);
    await page.goto(`/${slug}`);
    await expect(page.getByTestId("landing-stage")).toBeVisible();
    await expectNoOverflow(page);
  }

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`/${slug}`);
  const root = page.locator("main");
  await expect(root).toHaveClass(/theme-joyeria-aurora/);

  const landingVisual = page.locator(".campaign-visual");
  await expect(landingVisual).toBeVisible();
  expect(await landingVisual.evaluate((node) => getComputedStyle(node).backgroundImage)).toContain("aurora-landing-jewelry.webp");
  await expect(page.getByRole("button", { name: /Descubrir mi premio/ })).toBeVisible();

  await page.getByRole("button", { name: /Descubrir mi premio/ }).click();
  await expect(page.getByTestId("unlock-stage")).toBeVisible();
  const poster = page.getByTestId("share-poster-preview");
  await expect(poster).toBeVisible();
  expect(await poster.evaluate((node) => getComputedStyle(node, "::before").backgroundImage)).toContain("aurora-share-jewelry.webp");

  await page.getByTestId("native-share").click();
  await expect(page.getByTestId("wheel-stage")).toBeVisible();
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.getByRole("button", { name: /Girar la ruleta/ }).click();
  await expect(page.getByTestId("premium-wheel")).toHaveAttribute("data-spin-turns", "1");
  await expect(page.getByTestId("premium-wheel")).toHaveAttribute("data-spin-duration-ms", "1600");
  await expect(page.getByTestId("reward-stage")).toBeVisible({ timeout: 3_500 });
  await expect(page.getByTestId("reward-voucher")).toBeVisible();
  await expectNoOverflow(page);
});
