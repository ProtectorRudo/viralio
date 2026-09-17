import { expect, test } from "@playwright/test";

test("public root sells Viralio and exposes demos without redirecting to Moka", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");

  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole("heading", { name: "Dale a tus clientes una razón para volver." })).toBeVisible();
  await expect(page.getByRole("link", { name: /Moka/ })).toHaveAttribute("href", "/moka");
  await expect(page.getByRole("link", { name: /Atlas Barber/ })).toHaveAttribute("href", "/atlas-barber");

  const size = await page.evaluate(() => ({
    width: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }));
  expect(size.scrollWidth).toBeLessThanOrEqual(size.width);
});
