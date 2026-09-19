import { expect, type Page } from "@playwright/test";

export type GiftReward = {
  token: string;
  shortCode: string;
  prizeName: string;
  prizeId?: string;
};

export async function routeWhatsapp(page: Page) {
  await page.context().route("https://wa.me/**", (route) =>
    route.fulfill({ status: 200, contentType: "text/html", body: "WhatsApp" }),
  );
}

export async function reachGiftScratch(page: Page, path = "/moka?reset=1") {
  await routeWhatsapp(page);
  await page.goto(path);
  await expect(page.getByTestId("gift-landing-stage")).toBeVisible();
  await page.getByRole("button", { name: /Descubrir mi regalo/ }).click();
  await expect(page.getByTestId("gift-share-stage")).toBeVisible();
  await page.getByRole("button", { name: "Compartir por WhatsApp" }).click();
  await expect(page.getByTestId("gift-scratch-stage")).toBeVisible();
}

export async function scratchGift(page: Page): Promise<GiftReward> {
  const canvas = page.getByTestId("gift-scratch-canvas");
  await expect(canvas).toBeVisible();
  const box = await canvas.boundingBox();
  if (!box) throw new Error("Scratch canvas has no layout box");

  const spinResponse = page.waitForResponse((response) =>
    response.url().endsWith("/spin") && response.request().method() === "POST",
  );

  const left = box.x + 24;
  const right = box.x + box.width - 24;
  const top = box.y + 36;
  const bottom = box.y + box.height - 36;
  const rows = 10;

  await page.mouse.move(left, top);
  await page.mouse.down();
  for (let row = 0; row < rows; row++) {
    const y = top + ((bottom - top) * row) / (rows - 1);
    const x = row % 2 === 0 ? right : left;
    await page.mouse.move(x, y, { steps: 18 });
  }
  await page.mouse.up();

  const transparentRatio = await canvas.evaluate((node) => {
    const canvas = node as HTMLCanvasElement;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return 0;
    const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    let transparent = 0;
    let sampled = 0;
    for (let i = 3; i < pixels.length; i += 80) {
      sampled++;
      if (pixels[i] < 45) transparent++;
    }
    return sampled ? transparent / sampled : 0;
  });
  expect(transparentRatio).toBeGreaterThan(.60);

  const response = await spinResponse;
  const payload = await response.json() as { reward: GiftReward };
  await expect(page.getByRole("button", { name: /Guardar mi regalo/ })).toBeVisible();
  await page.getByRole("button", { name: /Guardar mi regalo/ }).click();
  await expect(page.getByTestId("gift-reward-stage")).toBeVisible();
  return payload.reward;
}

export async function completeGiftFlow(page: Page, path = "/moka?reset=1"): Promise<GiftReward> {
  await reachGiftScratch(page, path);
  return scratchGift(page);
}

export async function expectNoHorizontalOverflow(page: Page) {
  const dimensions = await page.evaluate(() => ({
    width: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }));
  expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.width + 1);
}
