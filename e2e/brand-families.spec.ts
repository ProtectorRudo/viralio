import { expect, test } from "@playwright/test";
import { expectNoHorizontalOverflow } from "./gift-flow";

test("Moka and Atlas share the premium gift structure while keeping distinct brand skins", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });

  await page.goto("/moka?reset=1");
  const moka = page.locator("main");
  await expect(moka).toHaveAttribute("data-merchant", "moka");
  await expect(moka).toHaveAttribute("data-design-version", "gift-premium-v1");
  await expect(page.getByTestId("gift-landing-stage")).toBeVisible();
  expect(await moka.evaluate((node) => getComputedStyle(node).getPropertyValue("--color-primary").trim())).toBe("#8F4327");
  const mokaBackground = await moka.evaluate((node) => getComputedStyle(node).backgroundImage);
  await expectNoHorizontalOverflow(page);

  await page.goto("/atlas-barber?reset=1");
  const atlas = page.locator("main");
  await expect(atlas).toHaveAttribute("data-merchant", "atlas-barber");
  await expect(atlas).toHaveAttribute("data-design-version", "gift-premium-v1");
  await expect(page.getByTestId("gift-landing-stage")).toBeVisible();
  expect(await atlas.evaluate((node) => getComputedStyle(node).getPropertyValue("--color-primary").trim())).toBe("#D0A34A");
  const atlasBackground = await atlas.evaluate((node) => getComputedStyle(node).backgroundImage);
  expect(atlasBackground).not.toBe(mokaBackground);
  await expectNoHorizontalOverflow(page);
});

test("Moka and Atlas are both WhatsApp-first and do not expose unrelated share channels", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });

  for (const path of ["/moka?reset=1", "/atlas-barber?reset=1"]) {
    await page.goto(path);
    await page.getByRole("button", { name: /Descubrir mi regalo/ }).click();
    await expect(page.getByTestId("gift-share-stage")).toBeVisible();
    await expect(page.getByRole("button", { name: "Compartir por WhatsApp" })).toBeVisible();
    await expect(page.getByTestId("native-share")).toHaveCount(0);
    await expect(page.getByTestId("whatsapp-status-share")).toHaveCount(0);
    await expect(page.getByTestId("instagram-story-share")).toHaveCount(0);
    await expectNoHorizontalOverflow(page);
  }
});
