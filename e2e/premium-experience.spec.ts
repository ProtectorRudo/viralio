import { expect, test, type Page } from "@playwright/test";

async function expectNoOverflow(page: Page) {
  const dimensions = await page.evaluate(() => ({ width: document.documentElement.clientWidth, scrollWidth: document.documentElement.scrollWidth }));
  expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.width);
}

async function sendReferralAndReachWheel(page: Page) {
  await page.context().route("https://wa.me/**", (route) => route.fulfill({ status: 200, contentType: "text/html", body: "WhatsApp" }));
  const popupPromise = page.waitForEvent("popup");
  await page.getByTestId("whatsapp-share").click();
  const popup = await popupPromise;
  await expect.poll(() => popup.url()).toContain("wa.me");
  await popup.close();
  await expect(page.getByTestId("wheel-stage")).toBeVisible();
}

async function reachWheel(page: Page, path: string) {
  await page.goto(path);
  await page.getByRole("button", { name: /Descubrir mi regalo/ }).click();
  await expect(page.getByTestId("unlock-stage")).toBeVisible();
  await expect(page.getByTestId("wheel-stage")).toHaveCount(0);
  await sendReferralAndReachWheel(page);
}

test("Moka mobile: WhatsApp referral gates wheel, reward persists and expiration is explicit", async ({ page, context }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await context.route("https://wa.me/**", (route) => route.fulfill({ status: 200, contentType: "text/html", body: "WhatsApp" }));
  await page.goto("/moka");
  await expect(page.locator("main")).toHaveAttribute("data-merchant", "moka");
  await expect(page.getByRole("heading", { name: "Tenemos un regalo especial para vos" })).toBeVisible();
  await expect(page.getByTestId("premium-wheel")).toHaveCount(0);
  await expectNoOverflow(page);

  await page.getByRole("button", { name: /Descubrir mi regalo/ }).click();
  await expect(page.getByRole("heading", { name: "La otra persona también recibe un regalo" })).toBeVisible();
  await expect(page.getByTestId("whatsapp-share")).toBeVisible();
  await expect(page.getByTestId("share-poster-preview")).toHaveCount(0);
  await expect(page.getByTestId("whatsapp-status-share")).toHaveCount(0);
  await expect(page.getByTestId("instagram-story-share")).toHaveCount(0);
  await expect(page.getByTestId("native-share")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Compartí tu regalo con otra persona" })).toBeVisible();
  await expect(page.getByTestId("premium-wheel")).toHaveCount(0);

  const sharePopupPromise = page.waitForEvent("popup");
  await page.getByTestId("whatsapp-share").click();
  const sharePopup = await sharePopupPromise;
  await expect.poll(() => sharePopup.url()).toContain("wa.me");
  const decodedShare = decodeURIComponent(sharePopup.url());
  expect(decodedShare).toContain("vos también recibís tu propio regalo");
  expect(decodedShare).toContain("/moka?ref=");
  await sharePopup.close();

  await expect(page.getByTestId("premium-wheel").locator(".wheel-segment")).toHaveCount(5);
  await expect(page.getByTestId("premium-wheel")).toHaveAttribute("data-spin-turns", "9");

  const spinResponse = page.waitForResponse((response) => response.url().endsWith("/spin") && response.request().method() === "POST");
  await page.getByRole("button", { name: /Girar la ruleta/ }).click();
  const serverResult = await (await spinResponse).json() as { reward: { prizeId: string; prizeName: string; shortCode: string } };
  await expect(page.getByTestId("premium-wheel")).toHaveAttribute("data-winning-prize", serverResult.reward.prizeName);
  const prizeIds = await page.getByTestId("premium-wheel").locator(".wheel-segment").evaluateAll((segments) => segments.map((segment) => segment.getAttribute("data-prize-id")));
  const winningIndex = prizeIds.indexOf(serverResult.reward.prizeId);
  const expectedRotation = (9 * 360) - ((winningIndex + 0.5) * 360) / prizeIds.length;
  await expect(page.getByTestId("premium-wheel").locator(".wheel-svg")).toHaveAttribute("style", `transform: rotate(${expectedRotation}deg);`);
  await expect(page.getByTestId("reward-stage")).toBeVisible({ timeout: 6_000 });
  await expect(page.getByRole("heading", { name: serverResult.reward.prizeName })).toBeVisible();
  await expect(page.getByTestId("reward-expiration")).toContainText("FECHA DE VENCIMIENTO");
  await expect(page.getByTestId("reward-expiration")).toContainText(/\d{2}\/\d{2}\/\d{4}/);
  await expect(page.getByTestId("reward-voucher")).toHaveCSS("border-radius", "24px");
  await expectNoOverflow(page);

  await page.reload();
  await expect(page.getByTestId("reward-stage")).toBeVisible();
  await expect(page.getByText(serverResult.reward.shortCode)).toBeVisible();
  await expect(page.getByTestId("reward-expiration")).toBeVisible();

  const popupPromise = page.waitForEvent("popup");
  await page.getByRole("button", { name: "Guardar premio en WhatsApp" }).click();
  const popup = await popupPromise;
  await expect.poll(() => popup.url()).toContain("wa.me/5491100000000");
  const decoded = decodeURIComponent(popup.url());
  expect(decoded).toContain("Hola Moka, guardo mi premio:");
  expect(decoded).toContain("Código:");
  expect(decoded).toContain("Vence:");
  expect(decoded).toContain("/premio/");
});

test("share stage is title plus one WhatsApp action", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/moka");
  await page.getByRole("button", { name: /Descubrir mi regalo/ }).click();

  await expect(page.getByText("La otra persona también recibe un regalo")).toBeVisible();
  await expect(page.getByText("Abrí este pase y recibí tu regalo")).toHaveCount(0);
  await expect(page.locator(".whatsapp-only-share button")).toHaveCount(1);
  await expect(page.getByRole("button", { name: "Compartí tu regalo con otra persona" })).toBeVisible();
});

test("Atlas Barber uses the shared engine and the same explicit premium voucher contract", async ({ page, context }) => {
  await page.setViewportSize({ width: 412, height: 915 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await context.route("https://wa.me/**", (route) => route.fulfill({ status: 200, contentType: "text/html", body: "WhatsApp" }));
  await page.goto("/atlas-barber");
  await page.getByRole("button", { name: /Descubrir mi regalo/ }).click();
  await sendReferralAndReachWheel(page);

  const root = page.locator("main");
  await expect(root).toHaveAttribute("data-merchant", "atlas-barber");
  expect(await root.evaluate((node) => getComputedStyle(node).getPropertyValue("--color-primary").trim())).toBe("#D0A34A");
  await expect(page.getByTestId("premium-wheel").locator(".wheel-segment")).toHaveCount(5);
  await page.getByRole("button", { name: /Girar la ruleta/ }).click();
  await expect(page.getByTestId("reward-stage")).toBeVisible();
  await expect(page.getByTestId("reward-expiration")).toBeVisible();
  await expectNoOverflow(page);
  await page.getByRole("link", { name: "Ver tarjeta del premio" }).click();
  await expect(page.locator("main")).toHaveAttribute("data-merchant", "atlas-barber");
  await expect(page.locator("header").getByText("Atlas Barber", { exact: true })).toBeVisible();
  await expect(page.getByTestId("public-reward-expiration")).toContainText("FECHA DE VENCIMIENTO");
  await expect(page.getByTestId("reward-status")).toHaveText("Disponible");
});

test("required mobile and desktop viewports have no horizontal overflow", async ({ page }) => {
  const viewports = [
    { width: 360, height: 800 },
    { width: 390, height: 844 },
    { width: 412, height: 915 },
    { width: 430, height: 932 },
    { width: 1280, height: 800 },
  ];
  for (const viewport of viewports) {
    await page.setViewportSize(viewport);
    await page.goto("/moka");
    await expect(page.getByTestId("landing-stage")).toBeVisible();
    await expectNoOverflow(page);
  }
});

test("reduced motion keeps the complete flow operable", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await reachWheel(page, "/moka");
  await page.getByRole("button", { name: /Girar la ruleta/ }).click();
  await expect(page.getByTestId("reward-stage")).toBeVisible();
  await expect(page.getByTestId("reward-expiration")).toBeVisible();
  await expectNoOverflow(page);
});
