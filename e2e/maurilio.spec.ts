import { expect, test, type Page } from "@playwright/test";

async function mobile(page: Page) {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "reduce" });
}

async function expectNoHorizontalOverflow(page: Page) {
  const hasOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth + 1,
  );
  expect(hasOverflow).toBe(false);
}

test("Maurilio opens as a simple tipster marketplace on mobile", async ({ page }) => {
  await mobile(page);
  await page.goto("/maurilio");

  await expect(page.getByText("MAURILIO", { exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "Explorar" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Mis accesos" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Soy tipster" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Ingresar" })).toBeVisible();

  await expect(
    page.getByRole("heading", { name: "Encontrá a quién seguir." }),
  ).toBeVisible();
  await expect(
    page.getByPlaceholder("Nombre, deporte o especialidad"),
  ).toBeVisible();

  const body = await page.locator("body").innerText();
  expect(body).not.toContain("MATCHDAY / LIVE MODEL");
  expect(body).not.toContain("PATEAR PENAL");
  expect(body).not.toContain("THE LOCKER");
  expect(body).not.toContain("ELITE");

  await expectNoHorizontalOverflow(page);
});

test("public marketplace never fabricates tipster history", async ({ page }) => {
  await mobile(page);
  await page.goto("/maurilio");

  const pageText = await page.locator("body").innerText();
  expect(pageText).not.toContain("+12.4%");
  expect(pageText).not.toContain("184 apuestas");
  expect(pageText).not.toContain("EXPERIENCIA DEMO");

  await expect(page.getByText("No encontramos tipsters con esos filtros.")).toBeVisible();
  await expect(
    page.getByText("Sólo cuentan picks registrados y liquidados dentro de Maurilio."),
  ).toBeVisible();

  await expectNoHorizontalOverflow(page);
});

test("registration clearly separates subscriber and tipster roles", async ({ page }) => {
  await mobile(page);
  await page.goto("/maurilio/ingresar");

  await expect(page.getByRole("heading", { name: "Creá tu cuenta." })).toBeVisible();
  await expect(page.getByRole("button", { name: /Quiero seguir tipsters/ })).toBeVisible();
  await expect(page.getByRole("button", { name: /Soy tipster/ })).toBeVisible();

  await page.getByRole("button", { name: /Soy tipster/ }).click();
  await expect(
    page.getByRole("heading", { name: "Creá tu perfil de tipster." }),
  ).toBeVisible();

  await expectNoHorizontalOverflow(page);
});

test("private subscriber feed requires an account", async ({ page }) => {
  await mobile(page);
  await page.goto("/maurilio/suscripciones");

  await expect(
    page.getByRole("heading", { name: "Ingresá para ver tus tipsters." }),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: "Ingresar →" })).toBeVisible();

  await expectNoHorizontalOverflow(page);
});

test("tipster studio requires a tipster account", async ({ page }) => {
  await mobile(page);
  await page.goto("/maurilio/para-tipsters");

  await expect(
    page.getByRole("heading", { name: "Ingresá para publicar." }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Ingresar o crear cuenta →" }),
  ).toBeVisible();

  await expectNoHorizontalOverflow(page);
});

test("Bet365 feed endpoint is explicit and fail-closed", async ({ request }) => {
  const response = await request.get(
    "http://127.0.0.1:3000/maurilio/api/bet365?view=status",
  );

  expect(response.status()).toBe(200);
  const body = (await response.json()) as {
    configured?: boolean;
    bookmaker?: string;
    bookmakerKey?: string;
  };

  expect(body.bookmaker).toBe("Bet365");
  expect(typeof body.configured).toBe("boolean");
  expect(typeof body.bookmakerKey).toBe("string");
});

test("subscription and promotion mutations require same-origin requests", async ({ request }) => {
  const subscription = await request.post(
    "http://127.0.0.1:3000/maurilio/api/subscriptions",
    { data: { tipsterSlug: "maurilio" } },
  );
  expect(subscription.status()).toBe(403);

  const promotion = await request.post(
    "http://127.0.0.1:3000/maurilio/api/promotions",
    { data: { days: 7 } },
  );
  expect(promotion.status()).toBe(403);
});

test("legacy Maurilio paths no longer expose the old product", async ({ page }) => {
  await mobile(page);
  await page.goto("/maurilio/demo");

  await expect(
    page.getByRole("heading", { name: "Encontrá a quién seguir." }),
  ).toBeVisible();

  const body = await page.locator("body").innerText();
  expect(body).not.toContain("EXPERIENCIA DEMO");
  expect(body).not.toContain("PATEAR PENAL");
  expect(body).not.toContain("PRO");
  expect(body).not.toContain("ELITE");

  await expectNoHorizontalOverflow(page);
});
