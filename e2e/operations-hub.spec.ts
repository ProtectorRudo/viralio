import { expect, test } from "@playwright/test";

const onboardingKey = process.env.VIRALIO_ONBOARDING_KEY;
const slug = "operacion-ci";

test("operations hub stays private and lists real plus onboarded merchants", async ({ page, request }) => {
  test.skip(!onboardingKey, "VIRALIO_ONBOARDING_KEY is required for operations E2E");

  const unauthorized = await request.post("/api/operacion/merchants", {
    headers: { origin: "http://127.0.0.1:3000" },
    data: { onboardingKey: "wrong-key" },
  });
  expect(unauthorized.status()).toBe(401);

  const created = await request.post("/api/onboarding/merchants", {
    headers: { origin: "http://127.0.0.1:3000" },
    data: {
      onboardingKey,
      name: "Comercio Operación CI",
      slug,
      businessType: "Kiosco",
      whatsappNumber: "5492215550000",
      pin: "764218",
    },
  });
  expect(created.status()).toBe(201);

  await page.goto("/operacion");
  await expect(page.getByTestId("operations-hub")).toBeVisible();
  await expect(page.getByTestId(`operations-merchant-${slug}`)).toHaveCount(0);
  await expect(page.getByTestId("operations-merchant-el-gordo-leo")).toHaveCount(0);

  await page.getByTestId("operations-key").fill(onboardingKey!);
  await page.getByTestId("operations-submit").click();

  const pilotCard = page.getByTestId("operations-merchant-el-gordo-leo");
  await expect(pilotCard).toBeVisible();
  await expect(pilotCard).toContainText("Mini Mercado El Gordo Leo");
  await expect(pilotCard).toContainText("Mini mercado");

  const card = page.getByTestId(`operations-merchant-${slug}`);
  await expect(card).toBeVisible();
  await expect(card).toContainText("Comercio Operación CI");
  await expect(card).toContainText("Kiosco");
  await expect(card.getByRole("link", { name: "Resultados y canjes" })).toHaveAttribute("href", `/comercio/${slug}/canjes`);
  await expect(card.getByRole("link", { name: "Configuración" })).toHaveAttribute("href", `/comercio/${slug}/configuracion`);
  await expect(card.getByRole("link", { name: "QR" })).toHaveAttribute("href", `/q/${slug}`);
  await expect(card.getByRole("link", { name: "Experiencia" })).toHaveAttribute("href", `/${slug}`);
});
