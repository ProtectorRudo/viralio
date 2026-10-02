import { expect, test } from "@playwright/test";

const onboardingKey = process.env.VIRALIO_ONBOARDING_KEY;

test("operator signs in once and can manage merchants without their PIN", async ({ page }) => {
  test.skip(!onboardingKey, "VIRALIO_ONBOARDING_KEY is required for operator E2E");

  await page.goto("/operador");
  await expect(page.getByTestId("operator-login")).toBeVisible();
  await page.getByTestId("operator-key").fill(onboardingKey!);
  await page.getByRole("button", { name: "Entrar a Viralio" }).click();

  await expect(page.getByTestId("operator-dashboard")).toBeVisible();
  const pilot = page.getByTestId("operator-merchant-el-gordo-leo");
  await expect(pilot).toBeVisible();
  await expect(pilot).toContainText("Mini Mercado El Gordo Leo");

  await pilot.getByRole("link", { name: "Configuración" }).click();
  await expect(page).toHaveURL(/\/comercio\/el-gordo-leo\/configuracion$/);
  await expect(page.getByTestId("merchant-settings-panel")).toBeVisible();

  await page.goto("/operador");
  await expect(page.getByTestId("operator-dashboard")).toBeVisible();
  await page.getByRole("link", { name: "+ Nuevo comercio" }).click();
  await expect(page).toHaveURL(/\/alta$/);
  await expect(page.getByTestId("operator-session-active")).toBeVisible();
  await expect(page.getByTestId("onboarding-key")).toHaveCount(0);
});
