import { expect, test } from "@playwright/test";
import { completeGiftFlow, expectNoHorizontalOverflow } from "./gift-flow";

test("Moka scratch progress stays visible while the reward loads in the background", async ({ page, context }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await context.route("https://wa.me/**", (route) =>
    route.fulfill({ status: 200, contentType: "text/html", body: "WhatsApp" }),
  );
  await page.route("**/api/sessions/*/spin", async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    await route.continue();
  });

  await page.goto("/moka?reset=1");
  await page.getByRole("button", { name: /Descubrir mi regalo/ }).click();
  await page.getByRole("button", { name: "Compartir por WhatsApp" }).click();
  await expect(page.getByTestId("gift-scratch-stage")).toBeVisible();

  const canvas = page.getByTestId("gift-scratch-canvas");
  const box = await canvas.boundingBox();
  if (!box) throw new Error("Scratch canvas has no layout box");

  const spinResponse = page.waitForResponse((response) =>
    response.url().endsWith("/spin") && response.request().method() === "POST",
  );

  const left = box.x + 28;
  const right = box.x + box.width - 28;
  const top = box.y + 70;
  await page.mouse.move(left, top);
  await page.mouse.down();
  for (let row = 0; row < 4; row++) {
    const y = top + row * 34;
    await page.mouse.move(row % 2 === 0 ? right : left, y, { steps: 14 });
  }
  await page.mouse.up();

  const scratchedRatio = async () => canvas.evaluate((node) => {
    const scratch = node as HTMLCanvasElement;
    const ctx = scratch.getContext("2d", { willReadFrequently: true });
    if (!ctx) return 0;
    const pixels = ctx.getImageData(0, 0, scratch.width, scratch.height).data;
    let transparent = 0;
    let sampled = 0;
    for (let i = 3; i < pixels.length; i += 80) {
      sampled++;
      if (pixels[i] < 45) transparent++;
    }
    return sampled ? transparent / sampled : 0;
  });

  const beforeReward = await scratchedRatio();
  expect(beforeReward).toBeGreaterThan(.08);
  await spinResponse;
  await page.waitForTimeout(250);
  const afterReward = await scratchedRatio();
  expect(afterReward).toBeGreaterThanOrEqual(beforeReward * .85);
});

test("Moka mobile: premium gift flow uses WhatsApp, real scratch reveal, persistence and complete coupon message", async ({ page, context }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await context.route("https://wa.me/**", (route) =>
    route.fulfill({ status: 200, contentType: "text/html", body: "WhatsApp" }),
  );

  await page.goto("/moka?reset=1");
  await expect(page.locator("main")).toHaveAttribute("data-merchant", "moka");
  await expect(page.locator("main")).toHaveAttribute("data-design-version", "gift-premium-v1");
  await expect(page.getByTestId("gift-landing-stage")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Tenemos un regalo para vos." })).toBeVisible();
  await expect(page.getByTestId("premium-wheel")).toHaveCount(0);
  await expectNoHorizontalOverflow(page);

  const reward = await completeGiftFlow(page, "/moka?reset=1");
  await expect(page.getByTestId("gift-reward-voucher")).toContainText(reward.prizeName);
  await expect(page.getByTestId("gift-reward-voucher")).toContainText(reward.shortCode);

  await page.reload();
  await expect(page.getByTestId("gift-reward-stage")).toBeVisible();
  await expect(page.getByText(reward.shortCode)).toBeVisible();

  const popupPromise = page.waitForEvent("popup");
  await page.getByRole("button", { name: "Guardar cupón en WhatsApp" }).click();
  const popup = await popupPromise;
  await expect.poll(() => popup.url()).toContain("wa.me/5491100000000");
  const decoded = decodeURIComponent(popup.url());
  expect(decoded).toContain("Premio:");
  expect(decoded).toContain(reward.prizeName);
  expect(decoded).toContain("Válido hasta:");
  expect(decoded).toContain("Código:");
  expect(decoded).toContain(reward.shortCode);
});

test("Atlas Barber uses the new premium WhatsApp and scratch experience with its own dark-gold skin", async ({ page, context }) => {
  await page.setViewportSize({ width: 412, height: 915 });
  await context.route("https://wa.me/**", (route) =>
    route.fulfill({ status: 200, contentType: "text/html", body: "WhatsApp" }),
  );

  await page.goto("/atlas-barber?reset=1");
  const root = page.locator("main");
  await expect(root).toHaveAttribute("data-merchant", "atlas-barber");
  await expect(root).toHaveAttribute("data-design-version", "gift-premium-v1");
  expect(await root.evaluate((node) => getComputedStyle(node).getPropertyValue("--color-primary").trim())).toBe("#D0A34A");
  await expect(page.getByTestId("gift-landing-stage")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Tenemos un regalo para vos." })).toBeVisible();
  await expect(page.getByTestId("premium-wheel")).toHaveCount(0);
  await expect(page.getByTestId("native-share")).toHaveCount(0);
  await expectNoHorizontalOverflow(page);

  const reward = await completeGiftFlow(page, "/atlas-barber?reset=1");
  await expect(page.getByTestId("gift-reward-voucher")).toContainText(reward.prizeName);
  await expect(page.getByTestId("gift-reward-voucher")).toContainText(reward.shortCode);
  await expectNoHorizontalOverflow(page);

  await page.reload();
  await expect(page.getByTestId("gift-reward-stage")).toBeVisible();
  await expect(page.getByText(reward.shortCode)).toBeVisible();

  const popupPromise = page.waitForEvent("popup");
  await page.getByRole("button", { name: "Guardar cupón en WhatsApp" }).click();
  const popup = await popupPromise;
  await expect.poll(() => popup.url()).toContain("wa.me/5491100000001");
  const decoded = decodeURIComponent(popup.url());
  expect(decoded).toContain("Atlas Barber");
  expect(decoded).toContain(reward.prizeName);
  expect(decoded).toContain(reward.shortCode);
});

test("premium gift landings stay contained at required mobile and desktop widths", async ({ page }) => {
  const viewports = [
    { width: 360, height: 800 },
    { width: 390, height: 844 },
    { width: 412, height: 915 },
    { width: 430, height: 932 },
    { width: 1280, height: 800 },
  ];
  for (const path of ["/moka?reset=1", "/atlas-barber?reset=1"]) {
    for (const viewport of viewports) {
      await page.setViewportSize(viewport);
      await page.goto(path);
      await expect(page.getByTestId("gift-landing-stage")).toBeVisible();
      await expectNoHorizontalOverflow(page);
    }
  }
});

test("reduced motion keeps premium gift flows operable", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  for (const path of ["/moka?reset=1", "/atlas-barber?reset=1"]) {
    await completeGiftFlow(page, path);
    await expect(page.getByTestId("gift-reward-stage")).toBeVisible();
    await expectNoHorizontalOverflow(page);
  }
});
