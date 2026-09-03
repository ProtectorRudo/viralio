import { expect, test } from "@playwright/test";

test("Aurora landing keeps reference headline, photo and CTA in separate visible zones", async ({ page }) => {
  await page.setViewportSize({ width: 430, height: 800 });
  await page.goto("/joyeria-aurora");

  const stage = page.getByTestId("landing-stage");
  await expect(stage).toBeVisible();

  const button = page.getByRole("button", { name: /Descubrir mi premio/ });
  await expect(button).toBeVisible();

  const geometry = await page.evaluate(() => {
    const stage = document.querySelector<HTMLElement>(".theme-joyeria-aurora .premium-campaign-stage");
    const copy = document.querySelector<HTMLElement>(".theme-joyeria-aurora .campaign-copy");
    const title = document.querySelector<HTMLElement>(".theme-joyeria-aurora .campaign-copy h1");
    const lead = document.querySelector<HTMLElement>(".theme-joyeria-aurora .campaign-copy .lead");
    const photo = document.querySelector<HTMLElement>(".theme-joyeria-aurora .campaign-visual");
    const action = document.querySelector<HTMLElement>(".theme-joyeria-aurora .campaign-action");
    if (!stage || !copy || !title || !lead || !photo || !action) throw new Error("Aurora landing nodes missing");

    const before = getComputedStyle(title, "::before");
    const middle = getComputedStyle(title, "::after");
    const third = getComputedStyle(lead, "::before");
    const photoBefore = getComputedStyle(photo, "::before");
    const stageRect = stage.getBoundingClientRect();
    const actionRect = action.getBoundingClientRect();

    const px = (value: string) => Number.parseFloat(value);
    return {
      firstTop: px(before.top),
      firstFont: px(before.fontSize),
      firstLine: px(before.lineHeight),
      middleTop: px(middle.top),
      middleFont: px(middle.fontSize),
      middleLine: px(middle.lineHeight),
      thirdTop: px(third.top),
      thirdFont: px(third.fontSize),
      thirdLine: px(third.lineHeight),
      photoTop: px(photoBefore.top),
      actionTop: actionRect.top - stageRect.top,
      actionBottom: actionRect.bottom - stageRect.top,
      stageHeight: stageRect.height,
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    };
  });

  const firstBottom = geometry.firstTop + geometry.firstFont * geometry.firstLine / geometry.firstFont;
  const middleBottom = geometry.middleTop + geometry.middleFont * geometry.middleLine / geometry.middleFont;
  const thirdBottom = geometry.thirdTop + geometry.thirdFont * geometry.thirdLine / geometry.thirdFont;

  expect(geometry.middleTop).toBeGreaterThanOrEqual(firstBottom - 4);
  expect(geometry.thirdTop).toBeGreaterThanOrEqual(middleBottom - 4);
  expect(geometry.photoTop).toBeGreaterThan(thirdBottom + 70);
  expect(geometry.actionTop).toBeGreaterThan(geometry.photoTop + 200);
  expect(geometry.actionBottom).toBeLessThanOrEqual(geometry.stageHeight);
  expect(geometry.scrollWidth).toBeLessThanOrEqual(geometry.clientWidth);
});
