import { expect, test } from "@playwright/test";

const slug = "bruma-ci";
const pin = "482619";

test("operator can onboard a new merchant and the merchant immediately runs the real Viralio flow", async ({ page }) => {
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

  await page.goto("/alta");
  await expect(page.getByTestId("merchant-onboarding")).toBeVisible();
  await page.getByTestId("onboarding-key").fill("ci-viralio-onboarding-key-with-24-characters");
  await page.getByTestId("onboarding-name").fill("Bruma CI");
  await page.getByTestId("onboarding-slug").fill(slug);
  await page.getByTestId("onboarding-template").selectOption("coffee");
  await page.getByTestId("onboarding-whatsapp").fill("5492215550000");
  await page.getByTestId("onboarding-pin").fill(pin);

  const createResponse = page.waitForResponse((response) =>
    response.url().endsWith("/api/onboarding/merchants") && response.request().method() === "POST",
  );
  await page.getByTestId("create-merchant").click();
  expect((await createResponse).status()).toBe(201);
  await expect(page.getByTestId("onboarding-success")).toBeVisible();
  await expect(page.getByTestId("created-experience-path")).toHaveText(`/${slug}`);
  await expect(page.getByTestId("created-panel-path")).toHaveText(`/comercio/${slug}/canjes`);

  await page.goto(`/${slug}`);
  await expect(page.getByText("Bruma CI", { exact: true }).first()).toBeVisible();
  await page.getByRole("button", { name: /Descubrir mi premio/ }).click();
  await page.getByTestId("native-share").click();
  await expect(page.getByTestId("wheel-stage")).toBeVisible();
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.getByRole("button", { name: /Girar la ruleta/ }).click();
  await expect(page.getByTestId("reward-stage")).toBeVisible();

  await page.goto(`/comercio/${slug}/canjes`);
  await expect(page.getByTestId("merchant-login-form")).toBeVisible();
  await page.getByTestId("merchant-pin").fill(pin);
  await page.getByRole("button", { name: /Ingresar al panel/ }).click();
  await expect(page.getByTestId("merchant-reward-search")).toBeVisible();

  await page.goto(`/comercio/${slug}/panel`);
  await expect(page.getByTestId("merchant-dashboard")).toBeVisible();
  await expect(page.getByTestId("metric-sessions")).toHaveText(/^[1-9]\d*$/);

  await page.goto(`/comercio/${slug}/configuracion`);
  await expect(page.getByTestId("merchant-settings-panel")).toBeVisible();
  await expect(page.getByTestId("probability-total")).toContainText("100%");

  await page.goto(`/comercio/${slug}/activacion`);
  await expect(page.getByTestId("merchant-activation-kit")).toBeVisible();
  await expect(page.getByTestId("activation-public-url")).toContainText(`/${slug}`);
  await expect(page.getByTestId("activation-qr")).toBeVisible();
  await expect(page.getByTestId("activation-poster")).toBeVisible();

  const qr = await page.request.get("/api/merchant/activation/qr");
  expect(qr.status()).toBe(200);
  expect(qr.headers()["content-type"]).toContain("image/svg+xml");
  const svg = await qr.text();
  expect(svg).toContain("<svg");
  expect(svg).toContain("<path");

  const download = await page.request.get("/api/merchant/activation/qr?download=1");
  expect(download.status()).toBe(200);
  expect(download.headers()["content-disposition"]).toContain(`viralio-${slug}-qr.svg`);
});

test("onboarding and activation assets enforce their security boundary", async ({ request }) => {
  const response = await request.post("http://127.0.0.1:3000/api/onboarding/merchants", {
    data: {
      onboardingKey: "ci-viralio-onboarding-key-with-24-characters",
      name: "Malicious Merchant",
      slug: "malicious-merchant",
      template: "coffee",
      whatsappNumber: "5492215550000",
      pin: "482619",
    },
    headers: { origin: "https://evil.example" },
  });
  expect(response.status()).toBe(403);

  const qr = await request.get("http://127.0.0.1:3000/api/merchant/activation/qr");
  expect(qr.status()).toBe(401);
});
