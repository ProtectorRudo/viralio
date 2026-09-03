import { expect, test } from "@playwright/test";

async function createAurora(page: import("@playwright/test").Page) {
  await page.goto("/alta");
  await expect(page.getByTestId("merchant-onboarding")).toBeVisible();
  await page.getByTestId("onboarding-key").fill("ci-viralio-onboarding-key-with-24-characters");
  await page.getByTestId("onboarding-name").fill("Joyería Aurora");
  await page.getByTestId("onboarding-slug").fill("joyeria-aurora");
  await page.getByTestId("onboarding-template").selectOption("coffee");
  await page.getByTestId("onboarding-whatsapp").fill("5492215550099");
  await page.getByTestId("onboarding-pin").fill("482619");

  const createResponse = page.waitForResponse((response) =>
    response.url().endsWith("/api/onboarding/merchants") && response.request().method() === "POST",
  );
  await page.getByTestId("create-merchant").click();
  expect((await createResponse).status()).toBe(201);
}

test("Aurora landing keeps reference headline, photo and CTA in separate visible zones", async ({ page }) => {
  await page.setViewportSize({ width: 430, height: 800 });
  await createAurora(page);
  await page.goto("/joyeria-aurora");

  const stage = page.getByTestId("landing-stage");
  await expect(stage).toBeVisible();

  const button = page.getByRole("button", { name: /Descubrir mi premio/ });
  await expect(button).toBeVisible();

  const geometry = await page.evaluate(() => {
    const stage = document.querySelector<HTMLElement>(".theme-joyeria-aurora .premium-campaign-stage");
    const title = document.querySelector<HTMLElement>(".theme-joyeria-aurora .campaign-copy h1");
    const lead = document.querySelector<HTMLElement>(".theme-joyeria-aurora .campaign-copy .lead");
    const photo = document.querySelector<HTMLElement>(".theme-joyeria-aurora .campaign-visual");
    const action = document.querySelector<HTMLElement>(".theme-joyeria-aurora .campaign-action");
    if (!stage || !title || !lead || !photo || !action) throw new Error("Aurora landing nodes missing");

    const first = getComputedStyle(title, "::before");
    const middle = getComputedStyle(title, "::after");
    const third = getComputedStyle(lead, "::before");
    const photoBefore = getComputedStyle(photo, "::before");
    const stageRect = stage.getBoundingClientRect();
    const actionRect = action.getBoundingClientRect();

    const px = (value: string) => Number.parseFloat(value);
    return {
      firstTop: px(first.top),
      firstLine: px(first.lineHeight),
      middleTop: px(middle.top),
      middleLine: px(middle.lineHeight),
      thirdTop: px(third.top),
      thirdLine: px(third.lineHeight),
      photoTop: px(photoBefore.top),
      actionTop: actionRect.top - stageRect.top,
      actionBottom: actionRect.bottom - stageRect.top,
      stageHeight: stageRect.height,
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    };
  });

  expect(geometry.middleTop).toBeGreaterThanOrEqual(geometry.firstTop + geometry.firstLine - 4);
  expect(geometry.thirdTop).toBeGreaterThanOrEqual(geometry.middleTop + geometry.middleLine - 4);
  expect(geometry.photoTop).toBeGreaterThan(geometry.thirdTop + geometry.thirdLine + 70);
  expect(geometry.actionTop).toBeGreaterThan(geometry.photoTop + 200);
  expect(geometry.actionBottom).toBeLessThanOrEqual(geometry.stageHeight);
  expect(geometry.scrollWidth).toBeLessThanOrEqual(geometry.clientWidth);
});
