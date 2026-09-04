import { expect, test, type Page } from "@playwright/test";

async function enableShare(page: Page) {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "share", { configurable: true, value: async () => undefined });
    Object.defineProperty(navigator, "canShare", { configurable: true, value: () => false });
  });
}

async function issueReward(page: Page, slug: string): Promise<string> {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await enableShare(page);
  await page.goto(`/${slug}`);
  await page.getByRole("button", { name: /Descubrir mi premio/ }).click();
  await page.getByTestId("native-share").click();
  const spinResponse = page.waitForResponse((response) => response.url().endsWith("/spin") && response.request().method() === "POST");
  await page.getByRole("button", { name: /Girar la ruleta/ }).click();
  const payload = await (await spinResponse).json() as { reward: { token: string } };
  await expect(page.getByTestId("reward-stage")).toBeVisible();
  return payload.reward.token;
}

async function publicGeometry(page: Page, token: string) {
  await page.goto(`/premio/${token}`);
  const voucher = page.getByTestId("public-reward-voucher");
  await expect(voucher).toBeVisible();
  await expect(page.getByRole("button", { name: /Marcar como canjeado/i })).toHaveCount(0);
  const box = await voucher.boundingBox();
  const radius = await voucher.evaluate((node) => getComputedStyle(node).borderTopLeftRadius);
  const object = await page.locator("main").getAttribute("data-reward-object");
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
  expect(overflow).toBe(false);
  return { object, width: Math.round(box?.width ?? 0), height: Math.round(box?.height ?? 0), radius };
}

test("Warm Crafted seal and Bold Contemporary token render as different official reward objects", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const mokaToken = await issueReward(page, "moka");
  const atlasToken = await issueReward(page, "atlas-barber");

  const moka = await publicGeometry(page, mokaToken);
  const atlas = await publicGeometry(page, atlasToken);

  expect(moka.object).toBe("seal");
  expect(atlas.object).toBe("token");
  expect(Math.abs(moka.width - moka.height)).toBeLessThanOrEqual(3);
  expect(moka.radius).not.toBe(atlas.radius);
  expect(`${moka.width}x${moka.height}`).not.toBe(`${atlas.width}x${atlas.height}`);
});

test("public reward objects stay contained at required phone widths", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  const token = await issueReward(page, "moka");

  for (const width of [360, 390, 430]) {
    await page.setViewportSize({ width, height: 844 });
    await publicGeometry(page, token);
  }
});
