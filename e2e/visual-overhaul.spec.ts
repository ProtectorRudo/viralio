import { expect, test } from "@playwright/test";
import { completeGiftFlow, expectNoHorizontalOverflow } from "./gift-flow";

test("Atlas premium funnel uses WhatsApp, scratch reveal and coupon without a wheel", async ({ page, context }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await context.route("https://wa.me/**", (route) =>
    route.fulfill({ status: 200, contentType: "text/html", body: "WhatsApp" }),
  );

  await page.goto("/atlas-barber?reset=1");
  await expect(page.locator("main")).toHaveAttribute("data-design-version", "gift-premium-v1");
  await expect(page.getByTestId("gift-landing-stage")).toBeVisible();
  await expect(page.getByTestId("premium-wheel")).toHaveCount(0);
  await expectNoHorizontalOverflow(page);

  const reward = await completeGiftFlow(page, "/atlas-barber?reset=1");
  await expect(page.getByTestId("gift-reward-voucher")).toContainText(reward.prizeName);
  await expect(page.getByTestId("gift-reward-voucher")).toContainText(reward.shortCode);
  await expect(page.getByTestId("premium-wheel")).toHaveCount(0);
  await expectNoHorizontalOverflow(page);

  await page.goto(`/premio/${reward.token}`);
  await expect(page.getByTestId("public-reward-voucher")).toBeVisible();
  await expect(page.getByRole("button", { name: /Marcar como canjeado/i })).toHaveCount(0);
});

test("Atlas premium landing stays composed at required phone widths", async ({ page }) => {
  for (const viewport of [
    { width: 360, height: 800 },
    { width: 390, height: 844 },
    { width: 430, height: 932 },
  ]) {
    await page.setViewportSize(viewport);
    await page.goto("/atlas-barber?reset=1");
    await expect(page.getByTestId("gift-landing-stage")).toBeVisible();
    await expectNoHorizontalOverflow(page);
  }
});
