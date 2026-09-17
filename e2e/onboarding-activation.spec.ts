import { expect, test } from "@playwright/test";

const onboardingKey = process.env.VIRALIO_ONBOARDING_KEY;

test("new merchant onboarding returns dynamic experience, tracked QR and panel paths", async ({ request }) => {
  test.skip(!onboardingKey, "VIRALIO_ONBOARDING_KEY is required for onboarding E2E");

  const slug = `piloto-${Date.now()}`;
  const response = await request.post("/api/onboarding/merchants", {
    data: {
      onboardingKey,
      name: "Piloto Viralio",
      slug,
      template: "generic",
      businessType: "Mini mercado",
      whatsappNumber: "5492215550000",
      pin: "482619",
    },
  });

  expect(response.status()).toBe(201);
  const payload = await response.json() as {
    merchant: { slug: string };
    experiencePath: string;
    qrPath: string;
    panelPath: string;
  };

  expect(payload.merchant.slug).toBe(slug);
  expect(payload.experiencePath).toBe(`/experiencia/${slug}`);
  expect(payload.qrPath).toBe(`/q/${slug}`);
  expect(payload.panelPath).toBe(`/comercio/${slug}/canjes`);

  const qrEntry = await request.get(payload.qrPath, { maxRedirects: 0 });
  expect(qrEntry.status()).toBe(307);
  expect(qrEntry.headers().location).toContain(`/experiencia/${slug}`);
});
