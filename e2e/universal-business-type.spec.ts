import { expect, test } from "@playwright/test";

const slug = "lumen-joyas-ci";

test("a new non-template business keeps its real category through the complete funnel", async ({ page, request }) => {
  const create = await request.post("/api/onboarding/merchants", {
    headers: { origin: "http://127.0.0.1:3000" },
    data: {
      onboardingKey: "ci-viralio-onboarding-key-with-24-characters",
      name: "Lumen Joyas CI",
      slug,
      businessType: "Joyería",
      whatsappNumber: "5492215550000",
      pin: "583729",
    },
  });
  expect(create.status()).toBe(201);

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
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(`/${slug}`);

  await expect(page.locator(".experience")).toHaveAttribute("data-merchant", slug);
  await expect(page.getByText("Joyería", { exact: true })).toBeVisible();
  await expect(page.locator("body")).not.toContainText(/Café de especialidad|Barbería contemporánea/i);

  await page.getByRole("button", { name: /Descubrir mi premio/ }).click();
  await page.getByTestId("native-share").click();
  await expect(page.getByTestId("wheel-stage")).toBeVisible();
  await page.getByRole("button", { name: /Girar la ruleta/ }).click();
  await expect(page.getByTestId("reward-stage")).toBeVisible();
});
