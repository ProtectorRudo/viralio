import { mkdirSync } from "node:fs";
import { expect, test, type Page, type TestInfo } from "@playwright/test";

async function enableShare(page: Page) {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "share", { configurable: true, value: async () => undefined });
    Object.defineProperty(navigator, "canShare", { configurable: true, value: () => false });
  });
}

function cssDurationMs(value: string): number {
  const values = value.split(",").map((part) => part.trim()).filter(Boolean).map((part) => {
    if (part.endsWith("ms")) return Number.parseFloat(part);
    if (part.endsWith("s")) return Number.parseFloat(part) * 1000;
    return Number.parseFloat(part);
  });
  return values.length ? Math.max(...values) : 0;
}

async function noHorizontalOverflow(page: Page) {
  const dimensions = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }));
  expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth + 1);
}

async function capture(page: Page, testInfo: TestInfo, name: string) {
  mkdirSync("visual-qa-evidence", { recursive: true });
  const screenshotPath = `visual-qa-evidence/${name}.png`;
  await page.screenshot({ path: screenshotPath, fullPage: true });
  await testInfo.attach(name, { path: screenshotPath, contentType: "image/png" });
}

async function resetSession(page: Page) {
  if (!page.url().startsWith("http")) await page.goto("/");
  await page.evaluate(() => localStorage.clear());
}

async function completeFlow(page: Page, slug: string, testInfo: TestInfo) {
  await resetSession(page);
  await page.goto(`/${slug}`);
  await page.getByRole("button", { name: /Descubrir mi premio/ }).click();
  await expect(page.getByTestId("share-poster-preview")).toBeVisible();
  await capture(page, testInfo, `${slug}-share-390`);
  await page.getByTestId("native-share").click();
  await expect(page.getByTestId("wheel-stage")).toBeVisible();
  await capture(page, testInfo, `${slug}-wheel-390`);

  const spinResponse = page.waitForResponse((response) =>
    response.url().endsWith("/spin") && response.request().method() === "POST",
  );
  await page.getByRole("button", { name: /Girar la ruleta/ }).click();
  const payload = await (await spinResponse).json() as { reward: { token: string } };
  await expect(page.getByTestId("reward-stage")).toBeVisible();
  await noHorizontalOverflow(page);
  await capture(page, testInfo, `${slug}-reward-390`);

  await page.goto(`/premio/${payload.reward.token}`);
  await expect(page.getByTestId("public-reward-voucher")).toBeVisible();
  await expect(page.getByRole("button", { name: /Marcar como canjeado/i })).toHaveCount(0);
  await noHorizontalOverflow(page);
  await capture(page, testInfo, `${slug}-public-reward-390`);
  return page.locator("main").getAttribute("data-reward-object");
}

test("final browser evidence stays responsive, accessible and materially distinct", async ({ page }, testInfo) => {
  await enableShare(page);
  await page.emulateMedia({ reducedMotion: "reduce" });

  const merchants = [
    { slug: "moka", density: ".94" },
    { slug: "atlas-barber", density: "1.04" },
  ];
  const fingerprints = new Set<string>();

  for (const merchant of merchants) {
    await resetSession(page);
    for (const viewport of [
      { width: 360, height: 800 },
      { width: 390, height: 844 },
      { width: 430, height: 932 },
    ]) {
      await page.setViewportSize(viewport);
      await page.goto(`/${merchant.slug}`);
      await expect(page.getByTestId("landing-stage")).toBeVisible();
      await noHorizontalOverflow(page);
      const density = await page.locator("main").evaluate((node) =>
        getComputedStyle(node).getPropertyValue("--brand-family-density").trim(),
      );
      expect(density).toBe(merchant.density);
      await capture(page, testInfo, `${merchant.slug}-landing-${viewport.width}`);
    }

    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`/${merchant.slug}`);
    const root = page.locator("main");
    const frame = page.getByTestId("brand-campaign-frame");
    const visual = page.locator(".campaign-visual");
    const visualBox = await visual.boundingBox();
    fingerprints.add([
      await root.evaluate((node) => getComputedStyle(node).getPropertyValue("--brand-family-density").trim()),
      await root.evaluate((node) => getComputedStyle(node).getPropertyValue("--brand-share-aspect").trim()),
      await frame.evaluate((node) => getComputedStyle(node).minHeight),
      Math.round(visualBox?.width ?? 0),
    ].join("|"));

    const primary = page.getByRole("button", { name: /Descubrir mi premio/ });
    await page.keyboard.press("Tab");
    await expect(primary).toBeFocused();
    const focus = await primary.evaluate((node) => {
      const style = getComputedStyle(node);
      return {
        outlineStyle: style.outlineStyle,
        outlineWidth: style.outlineWidth,
        transitionDuration: style.transitionDuration,
      };
    });
    expect(focus.outlineStyle).not.toBe("none");
    expect(Number.parseFloat(focus.outlineWidth)).toBeGreaterThanOrEqual(1);
    expect(cssDurationMs(focus.transitionDuration)).toBeLessThanOrEqual(.02);
  }

  expect(fingerprints.size).toBe(2);

  await page.setViewportSize({ width: 390, height: 844 });
  const mokaReward = await completeFlow(page, "moka", testInfo);
  const atlasReward = await completeFlow(page, "atlas-barber", testInfo);
  expect(mokaReward).toBe("seal");
  expect(atlasReward).toBe("token");
  expect(mokaReward).not.toBe(atlasReward);
});
