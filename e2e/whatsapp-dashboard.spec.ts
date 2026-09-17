import { expect, test } from "@playwright/test";

const slug = "dashboard-wa-ci";
const pin = "741852";

test("WhatsApp-only merchant dashboard hides irrelevant channels and surfaces growth outcomes", async ({ page, request, context }) => {
  const create = await request.post("/api/onboarding/merchants", {
    headers: { origin: "http://127.0.0.1:3000" },
    data: {
      onboardingKey: "ci-viralio-onboarding-key-with-24-characters",
      name: "Dashboard WhatsApp CI",
      slug,
      businessType: "Mini mercado",
      whatsappNumber: "5492215550000",
      pin,
    },
  });
  expect(create.status()).toBe(201);

  await context.route("https://wa.me/**", (route) => route.fulfill({ status: 200, contentType: "text/html", body: "WhatsApp" }));
  await page.goto(`/q/${slug}`);
  await expect(page).toHaveURL(new RegExp(`/experiencia/${slug}$`));
  await page.getByRole("button", { name: /Descubrir mi premio/ }).click();
  const popupPromise = page.waitForEvent("popup");
  await page.getByRole("button", { name: "Compartir por WhatsApp" }).click();
  await popupPromise;

  await page.goto(`/comercio/${slug}/canjes`);
  await page.getByTestId("merchant-pin").fill(pin);
  await page.getByRole("button", { name: /Ingresar al panel/ }).click();

  await page.goto(`/comercio/${slug}/panel`);
  await expect(page.getByTestId("merchant-dashboard")).toBeVisible();
  await expect(page.getByTestId("metric-qr-scans")).toHaveText(/^[1-9]\d*$/);
  await expect(page.getByTestId("metric-shares")).toHaveText(/^[1-9]\d*$/);
  await expect(page.getByTestId("metric-referrals")).toBeVisible();
  await expect(page.getByText("WhatsApp es tu canal de crecimiento")).toBeVisible();
  await expect(page.getByText("WhatsApp directo", { exact: true })).toBeVisible();
  await expect(page.getByText("Instagram Stories", { exact: true })).toHaveCount(0);
  await expect(page.getByText("Otras apps", { exact: true })).toHaveCount(0);
});
