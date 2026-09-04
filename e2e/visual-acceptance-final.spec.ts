import { expect, test, type Page, type TestInfo } from "@playwright/test";

const professionalSlug = "nexo-estudio-ci";

async function enableShare(page: Page) {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "share", { configurable: true, value: async () => undefined });
    Object.defineProperty(navigator, "canShare", { configurable: true, value: () => false });
  });
}

async function noHorizontalOverflow(page: Page) {
  const dimensions = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }));
  expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth + 1);
}

async function capture(page: Page, testInfo: TestInfo, name: string) {
  await testInfo.attach(name, {
    body: await page.screenshot({ fullPage: true }),
    contentType: "image/png",
  });
}

async function ensureProfessionalMerchant(request: import("@playwright/test").APIRequestContext) {
  const response = await request.post("/api/onboarding/merchants", {
    headers: { origin: "http://127.0.0.1:3000" },
    data: {
      onboardingKey: "ci-viralio-onboarding-key-with-24-characters",
      name: "Nexo Estudio CI",
      slug: professionalSlug,
      businessType: "Estudio contable",
      whatsappNumber: "5492215550099",
      pin: "918273",
    },
  });
  expect([201, 409]).toContain(response.status());
}

async function landingFingerprint(page: Page, slug: string) {
  await page.goto(`/${slug}`);
  await expect(page.getByTestId("landing-stage")).toBeVisible();
  await noHorizontalOverflow(page);
  const root = page.locator("main");
  const frame = page.getByTestId("brand-campaign-frame");
  const visual = page.locator(".campaign-visual");
  const box = await visual.boundingBox();
  return {
    familyDensity: await root.evaluate((node) => getComputedStyle(node).getPropertyValue("--brand-family-density").trim()),
    shareAspect: await root.evaluate((node) => getComputedStyle(node).getPropertyValue("--brand-share-aspect").trim()),
    rewardRadius: await root.evaluate((node) => getComputedStyle(node).getPropertyValue("--brand-reward-radius").trim()),
    frameMinHeight: await frame.evaluate((node) => getComputedStyle(node).minHeight),
    visualWidth: Math.round(box?.width ?? 0),
  };
}

async function completeFlow(page: Page, slug: string) {
  await page.goto(`/${slug}`);
  await page.getByRole("button", { name: /Descubrir mi premio/ }).click();
  await expect(page.getByTestId("share-poster-preview")).toBeVisible();
  await noHorizontalOverflow(page);
  await page.getByTestId("native-share").click();
  await expect(page.getByTestId("wheel-stage")).toBeVisible();
  const spinResponse = page.waitForResponse((response) => response.url().endsWith("/spin") && response.request().method() === "POST");
  await page.getByRole("button", { name: /Girar la ruleta/ }).click();
  const payload = await (await spinResponse).json() as { reward: { token: string } };
  await expect(page.getByTestId("reward-stage")).toBeVisible();
  await noHorizontalOverflow(page);
  return payload.reward.token;
}

test("VIRALIO-020 final objective visual acceptance", async ({ page, request }, testInfo) => {
  await ensureProfessionalMerchant(request);
  await enableShare(page);
  await page.emulateMedia({ reducedMotion: "reduce" });

  const merchants = [
    { slug: "moka", expectedDensity: ".94" },
    { slug: "atlas-barber", expectedDensity: "1.04" },
    { slug: professionalSlug, expectedDensity: ".9" },
  ];

  const fingerprints: string[] = [];
  for (const merchant of merchants) {
    for (const viewport of [
      { width: 360, height: 800 },
      { width: 390, height: 844 },
      { width: 430, height: 932 },
    ]) {
      await page.setViewportSize(viewport);
      const fingerprint = await landingFingerprint(page, merchant.slug);
      expect(fingerprint.familyDensity).toBe(merchant.expectedDensity);
      await capture(page, testInfo, `${merchant.slug}-landing-${viewport.width}`);
    }

    await page.setViewportSize({ width: 390, height: 844 });
    const fingerprint = await landingFingerprint(page, merchant.slug);
    fingerprints.push([
      fingerprint.familyDensity,
      fingerprint.shareAspect,
      fingerprint.rewardRadius,
      fingerprint.frameMinHeight,
      fingerprint.visualWidth,
    ].join("|"));

    const primary = page.getByRole("button", { name: /Descubrir mi premio/ });
    await page.keyboard.press("Tab");
    await expect(primary).toBeFocused();
    const focus = await primary.evaluate((node) => {
      const style = getComputedStyle(node);
      return { outlineStyle: style.outlineStyle, outlineWidth: style.outlineWidth, transitionDuration: style.transitionDuration };
    });
    expect(focus.outlineStyle).not.toBe("none");
    expect(parseFloat(focus.outlineWidth)).toBeGreaterThanOrEqual(1);
    expect(parseFloat(focus.transitionDuration)).toBeLessThanOrEqual(.001);

    await primary.click();
    await expect(page.getByTestId("share-poster-preview")).toBeVisible();
    await capture(page, testInfo, `${merchant.slug}-share-390`);
    await page.getByTestId("native-share").click();
    await expect(page.getByTestId("wheel-stage")).toBeVisible();
    await capture(page, testInfo, `${merchant.slug}-wheel-390`);
  }

  expect(new Set(fingerprints).size).toBe(3);

  const rewardObjects: string[] = [];
  for (const merchant of merchants) {
    await page.setViewportSize({ width: 390, height: 844 });
    const token = await completeFlow(page, merchant.slug);
    await capture(page, testInfo, `${merchant.slug}-reward-390`);
    await page.goto(`/premio/${token}`);
    await expect(page.getByTestId("public-reward-voucher")).toBeVisible();
    await expect(page.getByRole("button", { name: /Marcar como canjeado/i })).toHaveCount(0);
    const rewardObject = await page.locator("main").getAttribute("data-reward-object");
    expect(rewardObject).toBeTruthy();
    rewardObjects.push(rewardObject!);
    await noHorizontalOverflow(page);
    await capture(page, testInfo, `${merchant.slug}-public-reward-390`);
  }

  expect(new Set(rewardObjects).size).toBe(3);
});
