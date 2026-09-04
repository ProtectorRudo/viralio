import { expect, test } from "@playwright/test";

async function geometry(page: import("@playwright/test").Page, slug: string) {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`/${slug}`);
  await expect(page.getByTestId("landing-stage")).toBeVisible();

  const root = page.locator("main");
  const frame = page.getByTestId("brand-campaign-frame");
  const visual = page.locator(".campaign-visual");
  const copy = page.locator(".campaign-copy");

  const result = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }));
  expect(result.scrollWidth).toBeLessThanOrEqual(result.clientWidth);

  return {
    family: await root.evaluate((node) => getComputedStyle(node).getPropertyValue("--brand-family-density").trim()),
    frameMinHeight: await frame.evaluate((node) => getComputedStyle(node).minHeight),
    visualWidth: Math.round((await visual.boundingBox())?.width ?? 0),
    copyAlign: await copy.evaluate((node) => getComputedStyle(node).textAlign),
  };
}

test("Warm Crafted and Bold Contemporary produce different landing geometry", async ({ page }) => {
  const moka = await geometry(page, "moka");
  const atlas = await geometry(page, "atlas-barber");

  expect(moka.family).toBe(".94");
  expect(atlas.family).toBe("1.04");
  expect(moka.copyAlign).toBe("center");
  expect(atlas.copyAlign).toBe("left");
  expect(moka.frameMinHeight).not.toBe(atlas.frameMinHeight);
  expect(Math.abs(moka.visualWidth - atlas.visualWidth)).toBeGreaterThan(24);
});

test("Warm Crafted and Bold Contemporary produce different share proportions", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });

  await page.goto("/moka");
  await page.getByRole("button", { name: /Descubrir mi premio/ }).click();
  const mokaPoster = page.getByTestId("share-poster-preview");
  await expect(mokaPoster).toBeVisible();
  const mokaAspect = await mokaPoster.evaluate((node) => getComputedStyle(node).aspectRatio);
  const mokaRadius = await mokaPoster.evaluate((node) => getComputedStyle(node).borderTopLeftRadius);

  await page.goto("/atlas-barber");
  await page.getByRole("button", { name: /Descubrir mi premio/ }).click();
  const atlasPoster = page.getByTestId("share-poster-preview");
  await expect(atlasPoster).toBeVisible();
  const atlasAspect = await atlasPoster.evaluate((node) => getComputedStyle(node).aspectRatio);
  const atlasRadius = await atlasPoster.evaluate((node) => getComputedStyle(node).borderTopLeftRadius);

  expect(mokaAspect).toBe("4 / 5");
  expect(atlasAspect).toBe("9 / 16");
  expect(mokaRadius).not.toBe(atlasRadius);
});
