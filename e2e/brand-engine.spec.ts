import { expect, test } from "@playwright/test";

const slug = "atelier-brand-ci";
const tinyPng = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wl1ZQAAAABJRU5ErkJggg==";
const brand = {
  source: "openai",
  logoDataUrl: tinyPng,
  stylePreset: "luxury",
  fontPreset: "editorial",
  tone: "sofisticado, cálido y cercano",
  keywords: ["premium", "artesanal", "cálido"],
  palette: {
    canvas: "#F5EFE7",
    canvasAccent: "#E0C9B4",
    surface: "#FFFDF9",
    surfaceRaised: "#FFFFFF",
    text: "#251B17",
    textMuted: "#685A52",
    primary: "#633B2B",
    primaryHover: "#543225",
    onPrimary: "#FFFFFF",
    accent: "#B9774F",
    accentSecondary: "#3B6656",
    border: "#D8CEC6",
    success: "#24734B",
    warning: "#996018",
    danger: "#A63C3C",
    wheel: ["#633B2B", "#71452F", "#315447", "#71402B", "#38483B"],
  },
  ai: { model: "gpt-5.6-terra", generatedAt: "2026-09-03T12:00:00.000Z" },
};

const brandCopy = {
  heroEyebrow: "Un detalle de la casa",
  heroTitle: "Tu visita guarda una sorpresa",
  heroCopy: "Abrí tu pase y descubrí un beneficio pensado para tu próxima visita.",
  mysteryLabel: "Pase Atelier",
  shareTitle: "Compartí el pase para abrirlo",
  shareCopy: "Elegí dónde compartirlo. Tu premio sigue siendo privado.",
  referralCopy: "Atelier me dejó un pase sorpresa. Hay otro esperando por vos.",
  socialHeadline: "Atelier dejó algo esperando por vos",
  socialSubcopy: "Abrí tu propio pase y descubrí qué te toca.",
};

test("a brand profile drives the funnel and the 9:16 share card", async ({ page, request }) => {
  const create = await request.post("/api/onboarding/merchants", {
    headers: { origin: "http://127.0.0.1:3000" },
    data: {
      onboardingKey: "ci-viralio-onboarding-key-with-24-characters",
      name: "Atelier Brand CI",
      slug,
      template: "coffee",
      whatsappNumber: "5492215550000",
      pin: "583729",
      logoDataUrl: tinyPng,
      brand,
      brandCopy,
    },
  });
  expect(create.status()).toBe(201);

  await page.goto(`/${slug}`);
  const experience = page.locator(".experience");
  await expect(experience).toHaveAttribute("data-brand-style", "luxury");
  await expect(page.locator(".brand-mark img")).toHaveAttribute("src", /^data:image\/png;base64,/);
  await expect(page.getByRole("heading", { name: brandCopy.heroTitle })).toBeVisible();

  const primary = await experience.evaluate((element) => getComputedStyle(element).getPropertyValue("--color-primary").trim());
  expect(primary).toBe("#633B2B");

  const sessionResponse = await request.post("/api/sessions", { data: { merchantSlug: slug } });
  expect(sessionResponse.status()).toBe(200);
  const sessionPayload = await sessionResponse.json() as { session: { referralToken: string } };
  const card = await request.get(`/api/share-card/${encodeURIComponent(sessionPayload.session.referralToken)}`);
  expect(card.status()).toBe(200);
  expect(card.headers()["content-type"]).toContain("image/png");
  expect((await card.body()).byteLength).toBeGreaterThan(10_000);
});

test("Brand AI remains optional at runtime and fails closed without server credentials", async ({ request }) => {
  const response = await request.post("/api/onboarding/brand-preview", {
    headers: { origin: "http://127.0.0.1:3000" },
    data: {
      onboardingKey: "ci-viralio-onboarding-key-with-24-characters",
      name: "Atelier CI",
      template: "coffee",
      brief: "Marca cálida y premium.",
      logoDataUrl: tinyPng,
    },
  });
  expect(response.status()).toBe(503);
  expect((await response.json()).error).toContain("ChatGPT");
});
