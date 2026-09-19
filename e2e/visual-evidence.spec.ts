import { mkdirSync } from "node:fs";
import { expect, test, type Page, type TestInfo } from "@playwright/test";
import { expectNoHorizontalOverflow, routeWhatsapp, scratchGift } from "./gift-flow";

async function enableShare(page: Page) {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "share", { configurable: true, value: async () => undefined });
    Object.defineProperty(navigator, "canShare", { configurable: true, value: () => false });
  });
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

async function completeMokaEvidence(page: Page, testInfo: TestInfo) {
  await resetSession(page);
  await routeWhatsapp(page);
  await page.goto("/moka?reset=1");
  await page.getByRole("button", { name: /Descubrir mi regalo/ }).click();
  await expect(page.getByTestId("gift-share-stage")).toBeVisible();
  await expectNoHorizontalOverflow(page);
  await capture(page, testInfo, "moka-share-390");

  await page.getByRole("button", { name: "Compartir por WhatsApp" }).click();
  await expect(page.getByTestId("gift-scratch-stage")).toBeVisible();
  await capture(page, testInfo, "moka-scratch-390");

  const reward = await scratchGift(page);
  await expectNoHorizontalOverflow(page);
  await capture(page, testInfo, "moka-reward-390");

  await page.goto(`/premio/${reward.token}`);
  await expect(page.getByTestId("public-reward-voucher")).toBeVisible();
  await expect(page.getByRole("button", { name: /Marcar como canjeado/i })).toHaveCount(0);
  await expectNoHorizontalOverflow(page);
  await capture(page, testInfo, "moka-public-reward-390");
  return page.locator("main").getAttribute("data-reward-object");
}

async function completeAtlasEvidence(page: Page, testInfo: TestInfo) {
  await resetSession(page);
  await enableShare(page);
  await page.goto("/atlas-barber");
  await page.getByRole("button", { name: /Descubrir mi premio/ }).click();
  await expect(page.getByTestId("share-poster-preview")).toBeVisible();
  await expectNoHorizontalOverflow(page);
  await capture(page, testInfo, "atlas-barber-share-390");

  await page.getByTestId("native-share").click();
  await expect(page.getByTestId("wheel-stage")).toBeVisible();
  await capture(page, testInfo, "atlas-barber-wheel-390");

  const spinResponse = page.waitForResponse((response) =>
    response.url().endsWith("/spin") && response.request().method() === "POST",
  );
  await page.getByRole("button", { name: /Girar la ruleta/ }).click();
  const payload = await (await spinResponse).json() as { reward: { token: string } };
  await expect(page.getByTestId("reward-stage")).toBeVisible();
  await expectNoHorizontalOverflow(page);
  await capture(page, testInfo, "atlas-barber-reward-390");

  await page.goto(`/premio/${payload.reward.token}`);
  await expect(page.getByTestId("public-reward-voucher")).toBeVisible();
  await expectNoHorizontalOverflow(page);
  await capture(page, testInfo, "atlas-barber-public-reward-390");
  return page.locator("main").getAttribute("data-reward-object");
}

test("final browser evidence covers the new Moka gift flow and the distinct Atlas wheel flow", async ({ page }, testInfo) => {
  await page.emulateMedia({ reducedMotion: "reduce" });

  for (const viewport of [
    { width: 360, height: 800 },
    { width: 390, height: 844 },
    { width: 430, height: 932 },
  ]) {
    await page.setViewportSize(viewport);
    await page.goto("/moka?reset=1");
    await expect(page.getByTestId("gift-landing-stage")).toBeVisible();
    await expectNoHorizontalOverflow(page);
    await capture(page, testInfo, `moka-landing-${viewport.width}`);

    await page.goto("/atlas-barber");
    await expect(page.getByTestId("landing-stage")).toBeVisible();
    await expectNoHorizontalOverflow(page);
    await capture(page, testInfo, `atlas-barber-landing-${viewport.width}`);
  }

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/moka?reset=1");
  await expect(page.locator("main")).toHaveAttribute("data-design-version", "gift-premium-v1");
  await page.goto("/atlas-barber");
  await expect(page.locator("main")).toHaveAttribute("data-design-version", "020b");

  const mokaReward = await completeMokaEvidence(page, testInfo);
  const atlasReward = await completeAtlasEvidence(page, testInfo);
  expect(mokaReward).toBe("seal");
  expect(atlasReward).toBe("token");
  expect(mokaReward).not.toBe(atlasReward);
});
