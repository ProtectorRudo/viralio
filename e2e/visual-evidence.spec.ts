import { mkdirSync } from "node:fs";
import { expect, test, type Page, type TestInfo } from "@playwright/test";
import { expectNoHorizontalOverflow, routeWhatsapp, scratchGift } from "./gift-flow";

async function capture(page: Page, testInfo: TestInfo, name: string) {
  mkdirSync("visual-qa-evidence", { recursive: true });
  const screenshotPath = `visual-qa-evidence/${name}.png`;
  await page.screenshot({ path: screenshotPath, fullPage: true });
  await testInfo.attach(name, { path: screenshotPath, contentType: "image/png" });
}

async function resetSession(page: Page) {
  if (!page.url().startsWith("http")) await page.goto("/");
  await page.evaluate(() => localStorage.clear());
}

async function completeGiftEvidence(page: Page, testInfo: TestInfo, slug: string) {
  await resetSession(page);
  await routeWhatsapp(page);
  await page.goto(`/${slug}?reset=1`);
  await page.getByRole("button", { name: /Descubrir mi regalo/ }).click();
  await expect(page.getByTestId("gift-share-stage")).toBeVisible();
  await expectNoHorizontalOverflow(page);
  await capture(page, testInfo, `${slug}-share-390`);

  await page.getByRole("button", { name: "Compartir por WhatsApp" }).click();
  await expect(page.getByTestId("gift-scratch-stage")).toBeVisible();
  await capture(page, testInfo, `${slug}-scratch-390`);

  const reward = await scratchGift(page);
  await expectNoHorizontalOverflow(page);
  await capture(page, testInfo, `${slug}-reward-390`);

  await page.goto(`/premio/${reward.token}`);
  await expect(page.getByTestId("public-reward-voucher")).toBeVisible();
  await expect(page.getByRole("button", { name: /Marcar como canjeado/i })).toHaveCount(0);
  await expectNoHorizontalOverflow(page);
  await capture(page, testInfo, `${slug}-public-reward-390`);
  return page.locator("main").getAttribute("data-reward-object");
}

test("final browser evidence covers premium gift flows with materially distinct Moka and Atlas skins", async ({ page }, testInfo) => {
  await page.emulateMedia({ reducedMotion: "reduce" });

  for (const viewport of [
    { width: 360, height: 800 },
    { width: 390, height: 844 },
    { width: 430, height: 932 },
  ]) {
    await page.setViewportSize(viewport);

    await page.goto("/moka?reset=1");
    await expect(page.getByTestId("gift-landing-stage")).toBeVisible();
    await expectNoHorizontalOverflow(page);
    await capture(page, testInfo, `moka-landing-${viewport.width}`);

    await page.goto("/atlas-barber?reset=1");
    await expect(page.getByTestId("gift-landing-stage")).toBeVisible();
    await expectNoHorizontalOverflow(page);
    await capture(page, testInfo, `atlas-barber-landing-${viewport.width}`);
  }

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/moka?reset=1");
  const mokaRoot = page.locator("main");
  await expect(mokaRoot).toHaveAttribute("data-design-version", "gift-premium-v1");
  const mokaBackground = await mokaRoot.evaluate((node) => getComputedStyle(node).backgroundImage);

  await page.goto("/atlas-barber?reset=1");
  const atlasRoot = page.locator("main");
  await expect(atlasRoot).toHaveAttribute("data-design-version", "gift-premium-v1");
  const atlasBackground = await atlasRoot.evaluate((node) => getComputedStyle(node).backgroundImage);
  expect(atlasBackground).not.toBe(mokaBackground);

  const mokaReward = await completeGiftEvidence(page, testInfo, "moka");
  const atlasReward = await completeGiftEvidence(page, testInfo, "atlas-barber");
  expect(mokaReward).toBe("seal");
  expect(atlasReward).toBe("token");
  expect(mokaReward).not.toBe(atlasReward);
});


test("Te Hice Esto visual evidence covers storefront, creator, premium scenes and admin login", async ({ page }, testInfo) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });

  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/tehiceesto");
  await expect(page.getByRole("heading", { name: /Convertimos tus recuerdos/i })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Regalo de cumpleaños" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Regalo para tu pareja" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Regalo de aniversario" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Regalo para una amistad" })).toBeVisible();
  await expectNoHorizontalOverflow(page);
  await capture(page, testInfo, "tehiceesto-home-1440");

  await page.goto("/tehiceesto/crear");
  await expect(page.getByRole("heading", { name: /Qué querés convertir/i })).toBeVisible();
  await expectNoHorizontalOverflow(page);
  await capture(page, testInfo, "tehiceesto-creator-1440");

  await page.goto("/tehiceesto/admin");
  await expect(page.getByRole("heading", { name: /Armado de regalos/i })).toBeVisible();
  await expectNoHorizontalOverflow(page);
  await capture(page, testInfo, "tehiceesto-admin-login-1440");

  await page.setViewportSize({ width: 390, height: 844 });

  await page.goto("/tehiceesto");
  await expectNoHorizontalOverflow(page);
  await capture(page, testInfo, "tehiceesto-home-390");

  await page.goto("/tehiceesto/crear");
  await expectNoHorizontalOverflow(page);
  await capture(page, testInfo, "tehiceesto-creator-390");

  await page.goto("/tehiceesto/experiencias/pareja");
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page.locator(".thi-door-wrap")).toBeVisible();
  await capture(page, testInfo, "tehiceesto-pareja-door-390");
  await page.locator(".thi-door-wrap").click();
  await page.waitForTimeout(950);
  await expect(page.getByText(/Hay días que terminan/i)).toBeVisible();
  await capture(page, testInfo, "tehiceesto-pareja-memories-390");

  await page.goto("/tehiceesto/experiencias/cumpleanos");
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page.getByRole("button", { name: /Soplar de verdad/i })).toBeVisible();
  await capture(page, testInfo, "tehiceesto-cumple-candles-390");
  await page.getByRole("button", { name: /apagarlas tocando/i }).click();
  await capture(page, testInfo, "tehiceesto-cumple-wish-390");

  await page.goto("/tehiceesto/experiencias/propuesta");
  await page.getByRole("button", { name: "Entrar" }).click();
  await page.locator(".thi-door-wrap").click();
  await page.waitForTimeout(950);
  await page.getByRole("button", { name: /Seguir/ }).click();
  await expect(page.getByText(/Tocá las estrellas/i)).toBeVisible();
  const stars = page.locator(".thi-stars button");
  await stars.nth(0).click();
  await stars.nth(1).click();
  await stars.nth(2).click();
  await capture(page, testInfo, "tehiceesto-propuesta-stars-390");

  await page.goto("/tehiceesto/admin");
  await expectNoHorizontalOverflow(page);
  await capture(page, testInfo, "tehiceesto-admin-login-390");
});
