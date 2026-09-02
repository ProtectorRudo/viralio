import { expect, test, type Page } from "@playwright/test";

async function enableShare(page: Page) {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "share", {
      configurable: true,
      value: async () => undefined,
    });
    Object.defineProperty(navigator, "canShare", {
      configurable: true,
      value: () => false,
    });
  });
}

async function issueMokaReward(page: Page) {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await enableShare(page);
  await page.goto("/moka");
  await page.getByRole("button", { name: /Descubrir mi premio/ }).click();
  await page.getByTestId("native-share").click();
  await expect(page.getByTestId("wheel-stage")).toBeVisible();

  const responsePromise = page.waitForResponse((response) =>
    response.url().endsWith("/spin") && response.request().method() === "POST",
  );
  await page.getByRole("button", { name: /Girar la ruleta/ }).click();
  const response = await responsePromise;
  const result = await response.json() as {
    reward: { token: string; shortCode: string; prizeName: string };
  };
  await expect(page.getByTestId("reward-stage")).toBeVisible();
  return result.reward;
}

test("public reward stays read-only and authenticated Moka staff can redeem by code", async ({ page, request }) => {
  const reward = await issueMokaReward(page);

  await page.goto(`/premio/${reward.token}`);
  await expect(page.getByText(reward.shortCode)).toBeVisible();
  await expect(page.getByRole("button", { name: /Marcar como canjeado/i })).toHaveCount(0);
  await expect(page.getByText(/panel seguro del comercio/i)).toBeVisible();

  const publicPatch = await request.patch(`http://127.0.0.1:3000/api/rewards/${reward.token}`, {
    headers: { origin: "http://127.0.0.1:3000" },
  });
  expect(publicPatch.status()).toBe(405);

  await page.goto(`/validar/${reward.token}`);
  await expect(page).toHaveURL(new RegExp(`/premio/${reward.token}$`));
  await expect(page.getByRole("button", { name: /Marcar como canjeado/i })).toHaveCount(0);

  await page.goto("/comercio/moka/panel");
  await expect(page).toHaveURL(/\/comercio\/moka\/canjes$/);
  await expect(page.getByTestId("merchant-login-form")).toBeVisible();

  await page.getByTestId("merchant-pin").fill("000000");
  const failedLoginPromise = page.waitForResponse((response) =>
    response.url().endsWith("/api/merchant/auth") && response.request().method() === "POST",
  );
  await page.getByRole("button", { name: /Ingresar al panel/ }).click();
  expect((await failedLoginPromise).status()).toBe(401);
  await expect(page.getByText("Credenciales inválidas", { exact: true })).toBeVisible();
  await expect(page.getByTestId("merchant-login-form")).toBeVisible();

  await page.getByTestId("merchant-pin").fill("246810");
  const loginPromise = page.waitForResponse((response) =>
    response.url().endsWith("/api/merchant/auth") && response.request().method() === "POST",
  );
  await page.getByRole("button", { name: /Ingresar al panel/ }).click();
  expect((await loginPromise).status()).toBe(200);

  const merchantCookie = (await page.context().cookies()).find((cookie) => cookie.name === "viralio_merchant_session");
  expect(merchantCookie).toBeDefined();
  expect(merchantCookie?.httpOnly).toBe(true);
  expect(merchantCookie?.sameSite).toBe("Strict");
  expect(merchantCookie?.secure).toBe(true);
  await expect(page.getByTestId("merchant-reward-search")).toBeVisible();

  await page.getByTestId("reward-code").fill(reward.shortCode.toLowerCase());
  await page.getByRole("button", { name: /Buscar premio/ }).click();
  await expect(page.getByTestId("merchant-reward-status")).toHaveText("Disponible");
  await expect(page.getByRole("heading", { name: reward.prizeName })).toBeVisible();

  await page.getByTestId("merchant-redeem").click();
  await expect(page.getByTestId("merchant-reward-status")).toHaveText("Canjeado");
  await expect(page.getByTestId("merchant-redeem")).toHaveCount(0);

  await page.getByRole("link", { name: "Resumen" }).click();
  await expect(page).toHaveURL(/\/comercio\/moka\/panel$/);
  await expect(page.getByTestId("merchant-dashboard")).toBeVisible();
  await expect(page.getByTestId("metric-sessions")).toHaveText("1");
  await expect(page.getByTestId("metric-shares")).toHaveText("1");
  await expect(page.getByTestId("metric-redeemed")).toHaveText("1");

  await page.getByRole("link", { name: "Canjes" }).click();
  await expect(page.getByTestId("merchant-reward-search")).toBeVisible();

  await page.goto(`/premio/${reward.token}`);
  await expect(page.getByTestId("reward-status")).toHaveText("Canjeado");

  await page.goto("/comercio/atlas-barber/canjes");
  await expect(page.getByTestId("merchant-login-form")).toBeVisible();

  await page.goto("/comercio/moka/canjes");
  await expect(page.getByTestId("merchant-reward-search")).toBeVisible();
  await page.getByTestId("merchant-logout").click();
  await expect(page.getByTestId("merchant-login-form")).toBeVisible();
});

test("merchant write APIs reject requests without same-origin browser context", async ({ request }) => {
  const auth = await request.post("http://127.0.0.1:3000/api/merchant/auth", {
    data: { merchantSlug: "moka", pin: "246810" },
    headers: { origin: "https://evil.example" },
  });
  expect(auth.status()).toBe(403);

  const redeem = await request.post("http://127.0.0.1:3000/api/merchant/rewards/redeem", {
    data: { shortCode: "AB12CD34" },
    headers: { origin: "https://evil.example" },
  });
  expect(redeem.status()).toBe(403);
});
