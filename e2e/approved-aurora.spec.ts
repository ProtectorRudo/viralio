import { mkdirSync } from "node:fs";
import { expect, test, type Page, type TestInfo } from "@playwright/test";

const slug = "joyeria-aurora";

async function expectNoOverflow(page: Page) {
  const dimensions = await page.evaluate(() => ({
    width: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }));
  expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.width);
}

async function capture(page: Page, testInfo: TestInfo, name: string) {
  mkdirSync("visual-qa-evidence", { recursive: true });
  const path = `visual-qa-evidence/${name}.png`;
  await page.screenshot({ path, fullPage: true });
  await testInfo.attach(name, { path, contentType: "image/png" });
}

test("Aurora follows Mauro feedback and keeps the approved wheel", async ({ page }, testInfo) => {
  const onboardingKey = process.env.VIRALIO_ONBOARDING_KEY;
  const merchantPins = process.env.VIRALIO_MERCHANT_PINS;
  if (!onboardingKey || !merchantPins) throw new Error("Aurora E2E requires onboarding and merchant test environment");
  const configuredPins = JSON.parse(merchantPins) as Record<string, string>;
  const merchantPin = configuredPins[slug] ?? configuredPins.moka;
  if (!merchantPin) throw new Error("Aurora E2E requires an available merchant test PIN");

  await page.setViewportSize({ width: 390, height: 844 });
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "share", { configurable: true, value: async () => undefined });
    Object.defineProperty(navigator, "canShare", { configurable: true, value: () => false });
  });

  await page.goto("/alta");
  await page.getByTestId("onboarding-key").fill(onboardingKey);
  await page.getByTestId("onboarding-name").fill("Joyería Aurora");
  await page.getByTestId("onboarding-slug").fill(slug);
  await page.getByTestId("onboarding-template").selectOption("generic");
  await page.getByTestId("onboarding-whatsapp").fill("5492215550099");
  await page.getByTestId("onboarding-pin").fill(merchantPin);
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
  await expect(page.locator("main")).toHaveClass(/theme-joyeria-aurora/);
  await expect(page.locator(".campaign-visual")).toBeHidden();
  await expect(page.getByRole("button", { name: /Descubrir mi premio/ })).toBeVisible();
  await capture(page, testInfo, "aurora-feedback-landing-390");

  await page.getByRole("button", { name: /Descubrir mi premio/ }).click();
  await expect(page.getByTestId("unlock-stage")).toBeVisible();
  const poster = page.getByTestId("share-poster-preview");
  await expect(poster).toBeVisible();
  expect(await poster.evaluate((node) => getComputedStyle(node, "::before").backgroundImage)).toBe("none");
  await expect(page.getByTestId("whatsapp-status-share")).toBeHidden();
  await expect(page.getByTestId("instagram-story-share")).toBeHidden();
  await expect(page.getByRole("button", { name: /Enviar por WhatsApp/ })).toBeVisible();
  await expect(page.getByTestId("native-share")).toBeVisible();
  await expectNoOverflow(page);
  await capture(page, testInfo, "aurora-feedback-share-390");

  await page.getByTestId("native-share").click();
  await expect(page.getByTestId("wheel-stage")).toBeVisible();
  await capture(page, testInfo, "aurora-feedback-wheel-390");

  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.getByRole("button", { name: /Girar la ruleta/ }).click();
  await expect(page.getByTestId("premium-wheel")).toHaveAttribute("data-spin-turns", "1");
  await expect(page.getByTestId("premium-wheel")).toHaveAttribute("data-spin-duration-ms", "1600");
  await expect(page.getByTestId("reward-stage")).toBeVisible({ timeout: 3_500 });
  await expect(page.getByTestId("reward-voucher")).toBeVisible();
  await expectNoOverflow(page);
  await capture(page, testInfo, "aurora-feedback-reward-390");
});
