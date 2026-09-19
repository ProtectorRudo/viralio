import { expect, test, type Page } from "@playwright/test";

async function expectNoOverflow(page: Page) {
  const sizes = await page.evaluate(() => ({
    viewport: document.documentElement.clientWidth,
    content: document.documentElement.scrollWidth,
  }));
  expect(sizes.content).toBeLessThanOrEqual(sizes.viewport);
}

async function loginMoka(page: Page) {
  await page.goto("/comercio/moka/canjes");
  await expect(page.getByTestId("merchant-login-form")).toBeVisible();
  await page.getByTestId("merchant-pin").fill("246810");
  await page.getByRole("button", { name: /Ingresar al panel/ }).click();
  await expect(page.getByTestId("merchant-reward-search")).toBeVisible();
}

test("tracked QR entry and merchant backoffice stay measurable and responsive", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });

  await page.goto("/q/moka");
  await expect(page).toHaveURL(/\/moka$/);
  await expect(page.getByRole("button", { name: /Descubrir mi (?:premio|regalo)/ })).toBeVisible();
  await page.getByRole("button", { name: /Descubrir mi (?:premio|regalo)/ }).click();

  await loginMoka(page);

  for (const width of [360, 390, 430]) {
    await page.setViewportSize({ width, height: 844 });

    await page.goto("/comercio/moka/canjes");
    await expect(page.locator("main.merchant-redemption-shell")).toBeVisible();
    await expect(page.getByTestId("merchant-reward-search")).toBeVisible();
    await expectNoOverflow(page);

    await page.goto("/comercio/moka/panel");
    await expect(page.getByTestId("merchant-dashboard")).toBeVisible();
    await expect(page.getByTestId("metric-qr-scans")).toBeVisible();
    await expect(page.getByTestId("metric-starts")).toBeVisible();
    await expect(page.getByTestId("metric-sessions")).toBeVisible();

    const qrScans = Number.parseInt((await page.getByTestId("metric-qr-scans").textContent()) ?? "0", 10);
    const starts = Number.parseInt((await page.getByTestId("metric-starts").textContent()) ?? "0", 10);
    expect(qrScans).toBeGreaterThanOrEqual(1);
    expect(starts).toBeGreaterThanOrEqual(1);
    await expectNoOverflow(page);

    await page.goto("/comercio/moka/configuracion");
    await expect(page.getByTestId("merchant-settings-panel")).toBeVisible();
    await expect(page.getByTestId("merchant-settings-preview")).toBeVisible();
    await expect(page.getByTestId("save-settings")).toBeEnabled();
    await expectNoOverflow(page);
  }
});
