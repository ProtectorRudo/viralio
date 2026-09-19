import { expect, test } from "@playwright/test";
import { expectNoHorizontalOverflow } from "./gift-flow";

test("Moka and Atlas now use intentionally different customer experience families", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });

  await page.goto("/moka?reset=1");
  const moka = page.locator("main");
  await expect(moka).toHaveAttribute("data-merchant", "moka");
  await expect(moka).toHaveAttribute("data-design-version", "gift-premium-v1");
  await expect(page.getByTestId("gift-landing-stage")).toBeVisible();
  expect(await moka.evaluate((node) => getComputedStyle(node).getPropertyValue("--color-primary").trim())).toBe("#8F4327");
  await expectNoHorizontalOverflow(page);

  await page.goto("/atlas-barber");
  const atlas = page.locator("main");
  await expect(atlas).toHaveAttribute("data-merchant", "atlas-barber");
  await expect(atlas).toHaveAttribute("data-design-version", "020b");
  await expect(page.getByTestId("landing-stage")).toBeVisible();
  expect(await atlas.evaluate((node) => getComputedStyle(node).getPropertyValue("--color-primary").trim())).toBe("#D0A34A");
  await expectNoHorizontalOverflow(page);
});

test("Moka uses the WhatsApp-first gift share while Atlas keeps its social poster options", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });

  await page.goto("/moka?reset=1");
  await page.getByRole("button", { name: /Descubrir mi regalo/ }).click();
  await expect(page.getByTestId("gift-share-stage")).toBeVisible();
  await expect(page.getByRole("button", { name: "Compartir por WhatsApp" })).toBeVisible();
  await expect(page.getByTestId("native-share")).toHaveCount(0);
  await expect(page.getByTestId("whatsapp-status-share")).toHaveCount(0);
  await expectNoHorizontalOverflow(page);

  await page.goto("/atlas-barber");
  await page.getByRole("button", { name: /Descubrir mi premio/ }).click();
  await expect(page.getByTestId("share-poster-preview")).toBeVisible();
  await expect(page.getByTestId("whatsapp-status-share")).toBeVisible();
  await expect(page.getByTestId("instagram-story-share")).toBeVisible();
  await expectNoHorizontalOverflow(page);
});
