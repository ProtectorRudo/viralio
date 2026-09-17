import { expect, test } from "@playwright/test";

const onboardingKey = process.env.VIRALIO_ONBOARDING_KEY;

const slug = "premios-ci";
const pin = "764218";

test("new merchant can be born with real prizes and validity in the same onboarding", async ({ page, request }) => {
  test.skip(!onboardingKey, "VIRALIO_ONBOARDING_KEY is required for onboarding E2E");

  const response = await request.post("/api/onboarding/merchants", {
    headers: { origin: "http://127.0.0.1:3000" },
    data: {
      onboardingKey,
      name: "Piloto Premios CI",
      slug,
      businessType: "Mini mercado",
      whatsappNumber: "5492215550000",
      pin,
      rewardValidityDays: 14,
      prizes: [
        { name: "5% en tu próxima compra", probability: 40 },
        { name: "10% en tu próxima compra", probability: 30 },
        { name: "15% en tu próxima compra", probability: 15 },
        { name: "Helado de regalo", probability: 10 },
        { name: "Bombón de regalo", probability: 5 },
      ],
    },
  });

  expect(response.status()).toBe(201);

  await page.goto(`/comercio/${slug}/canjes`);
  await page.getByTestId("merchant-pin").fill(pin);
  await page.getByRole("button", { name: /Ingresar al panel/ }).click();
  await expect(page.getByTestId("merchant-reward-search")).toBeVisible();

  await page.goto(`/comercio/${slug}/configuracion`);
  await expect(page.getByTestId("merchant-settings-panel")).toBeVisible();
  await expect(page.getByTestId("probability-total")).toContainText("100%");

  const prizeRows = page.locator(".merchant-prize-row");
  await expect(prizeRows).toHaveCount(5);
  await expect(prizeRows.nth(0).locator("input").first()).toHaveValue("5% en tu próxima compra");
  await expect(prizeRows.nth(1).locator("input").first()).toHaveValue("10% en tu próxima compra");
  await expect(prizeRows.nth(2).locator("input").first()).toHaveValue("15% en tu próxima compra");
  await expect(prizeRows.nth(3).locator("input").first()).toHaveValue("Helado de regalo");
  await expect(prizeRows.nth(4).locator("input").first()).toHaveValue("Bombón de regalo");

  const validity = page.locator("input").filter({ has: page.locator("xpath=..") });
  const dayInput = page.locator('.merchant-settings-number input').first();
  await expect(dayInput).toHaveValue("14");
  void validity;
});

test("onboarding rejects invalid prize totals before creating the merchant", async ({ request }) => {
  test.skip(!onboardingKey, "VIRALIO_ONBOARDING_KEY is required for onboarding E2E");

  const response = await request.post("/api/onboarding/merchants", {
    headers: { origin: "http://127.0.0.1:3000" },
    data: {
      onboardingKey,
      name: "Premios inválidos CI",
      slug: "premios-invalidos-ci",
      businessType: "Mini mercado",
      whatsappNumber: "5492215550000",
      pin: "764218",
      prizes: [
        { name: "Premio A", probability: 50 },
        { name: "Premio B", probability: 30 },
      ],
    },
  });

  expect(response.status()).toBe(400);
});
