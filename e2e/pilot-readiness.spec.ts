import { expect, test } from "@playwright/test";

const onboardingKey = process.env.VIRALIO_ONBOARDING_KEY;

test("operator can inspect pilot readiness without exposing secrets", async ({ page }) => {
  test.skip(!onboardingKey, "VIRALIO_ONBOARDING_KEY is required for readiness E2E");

  await page.goto("/alta");
  await expect(page.getByTestId("pilot-readiness")).toBeVisible();
  await page.getByTestId("readiness-key").fill(onboardingKey!);
  await page.getByTestId("check-readiness").click();

  const result = page.getByTestId("readiness-result");
  await expect(result).toBeVisible();
  await expect(result).toContainText("PostgreSQL (postgres)");
  await expect(result).toContainText("Autenticación y canje seguro");
  await expect(result).toContainText("Alta privada de comercios");
  await expect(result).toContainText("Brand Engine · gpt-5.6-terra");
  await expect(result).toContainText("falta activar ChatGPT");

  const bodyText = await page.locator("body").innerText();
  expect(bodyText).not.toContain(onboardingKey!);
  expect(bodyText).not.toContain("DATABASE_URL");
  expect(bodyText).not.toContain("OPENAI_API_KEY");
});
