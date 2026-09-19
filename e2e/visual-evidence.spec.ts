import { mkdirSync } from "node:fs";
import { expect, test, type Page, type TestInfo } from "@playwright/test";
import { expectNoHorizontalOverflow, routeWhatsapp, scratchGift } from "./gift-flow";

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

async function completeGiftEvidence(page: Page, testInfo: TestInfo, slug: string) {
  await resetSession(page);
  await routeWhatsapp(page);
  await page.goto(`/${slug}?reset=1`);
  await page.getByRole("button", { name: /Descubrir mi regalo/ }).click();
  await expect(page.getByTestId("gift-share-stage")).toBeVisible();
  await expectNoHorizontalOverflow(page);
  await capture(page, testInfo, `${slug}-share-390`);

  await page.getByRole("button", { name: "Compartir por WhatsApp" }).click();
  await expect(page.getByTestId("gift-scratch-stage")).toBeVisible();
  await capture(page, testInfo, `${slug}-scratch-390`);

  const reward = await scratchGift(page);
  await expectNoHorizontalOverflow(page);
  await capture(page, testInfo, `${slug}-reward-390`);

  await page.goto(`/premio/${reward.token}`);
  await expect(page.getByTestId("public-reward-voucher")).toBeVisible();
  await expect(page.getByRole("button", { name: /Marcar como canjeado/i })).toHaveCount(0);
  await expectNoHorizontalOverflow(page);
  await capture(page, testInfo, `${slug}-public-reward-390`);
  return page.locator("main").getAttribute("data-reward-object");
}

test("final browser evidence covers premium gift flows with materially distinct Moka and Atlas skins", async ({ page }, testInfo) => {
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

    await page.goto("/atlas-barber?reset=1");
    await expect(page.getByTestId("gift-landing-stage")).toBeVisible();
    await expectNoHorizontalOverflow(page);
    await capture(page, testInfo, `atlas-barber-landing-${viewport.width}`);
  }

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/moka?reset=1");
  const mokaRoot = page.locator("main");
  await expect(mokaRoot).toHaveAttribute("data-design-version", "gift-premium-v1");
  const mokaBackground = await mokaRoot.evaluate((node) => getComputedStyle(node).backgroundImage);

  await page.goto("/atlas-barber?reset=1");
  const atlasRoot = page.locator("main");
  await expect(atlasRoot).toHaveAttribute("data-design-version", "gift-premium-v1");
  const atlasBackground = await atlasRoot.evaluate((node) => getComputedStyle(node).backgroundImage);
  expect(atlasBackground).not.toBe(mokaBackground);

  const mokaReward = await completeGiftEvidence(page, testInfo, "moka");
  const atlasReward = await completeGiftEvidence(page, testInfo, "atlas-barber");
  expect(mokaReward).toBe("seal");
  expect(atlasReward).toBe("token");
  expect(mokaReward).not.toBe(atlasReward);
});
