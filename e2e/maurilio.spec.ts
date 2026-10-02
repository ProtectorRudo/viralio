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

test("Maurilio Matchday is mobile-safe and never fabricates a pick", async ({ page }) => {
  await mobile(page);
  await page.goto("/maurilio");

  await expect(page.getByText("MAURILIO", { exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "Matchday", exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "Integridad" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Registro" })).toBeVisible();

  await expect(page.getByText("FREE", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("PRO", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("ELITE", { exact: true }).first()).toBeVisible();

  const body = await page.locator("body").innerText();
  expect(body).not.toContain("CUOTA BET365 NO VERIFICADA");
  expect(body).not.toContain("1.53");
  expect(body).not.toContain("1.57");

  await expectNoHorizontalOverflow(page);
});

test("Maurilio integrity view exposes process rules without buyer data", async ({ page }) => {
  await mobile(page);
  await page.goto("/maurilio/integridad");

  await expect(page.getByText("INTEGRITY / PROOF OF PROCESS")).toBeVisible();
  await expect(page.getByText("BET365 ONLY", { exact: true })).toBeVisible();
  await expect(page.getByText("IMMUTABLE PICK", { exact: true })).toBeVisible();
  await expect(page.getByText("APPEND-ONLY AUDIT", { exact: true })).toBeVisible();

  const body = await page.locator("body").innerText();
  expect(body).not.toContain("subject_id");
  expect(body).not.toContain("source_order_id");
  expect(body).not.toContain("ENTITLEMENT");

  await expectNoHorizontalOverflow(page);
});

test("Maurilio public ledger renders safely with or without settled history", async ({ page }) => {
  await mobile(page);
  await page.goto("/maurilio/registro");

  await expect(page.getByText("PUBLIC LEDGER / IMMUTABLE HISTORY")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Registro real." })).toBeVisible();

  const body = await page.locator("body").innerText();
  expect(body).not.toContain("principal_risk");
  expect(body).not.toContain("thesis");
  expect(body).not.toContain("subject_id");

  await expectNoHorizontalOverflow(page);
});


test("Maurilio access API returns no entitlement when no access cookie exists", async ({ request }) => {
  const response = await request.get("http://127.0.0.1:3000/maurilio/api/access");
  expect(response.status()).toBe(200);

  const body = (await response.json()) as {
    matchday: string | null;
    pro: boolean;
    elite: boolean;
    activeEntitlements: number;
  };

  expect(body.pro).toBe(false);
  expect(body.elite).toBe(false);
  expect(body.activeEntitlements).toBe(0);
});

test("Maurilio premium API fails closed for a valid session id without entitlement", async ({ page }) => {
  await page.context().addCookies([
    {
      name: "maurilio_sid",
      value: "11111111-1111-4111-8111-111111111111",
      url: "http://127.0.0.1:3000/maurilio",
      httpOnly: true,
      sameSite: "Lax",
    },
  ]);

  const access = await page.request.get("/maurilio/api/access");
  expect(access.status()).toBe(200);
  const status = (await access.json()) as {
    pro: boolean;
    elite: boolean;
    activeEntitlements: number;
  };
  expect(status.pro).toBe(false);
  expect(status.elite).toBe(false);
  expect(status.activeEntitlements).toBe(0);

  const premium = await page.request.get("/maurilio/api/premium/pro");
  expect([403, 404]).toContain(premium.status());
  const body = (await premium.json()) as {
    error?: string;
    event?: unknown;
    market?: unknown;
    selection?: unknown;
  };
  expect(["access_required", "report_not_found"]).toContain(body.error);
  expect(body.event).toBeUndefined();
  expect(body.market).toBeUndefined();
  expect(body.selection).toBeUndefined();
});


test("Maurilio demo is a single penalty kick that reveals the analysis on mobile", async ({ page }) => {
  await mobile(page);
  await page.goto("/maurilio/demo");

  await expect(page.getByText("EXPERIENCIA DEMO")).toBeVisible();
  await expect(page.getByText("Sin dinero · sin apuesta real")).toBeVisible();

  const kick = page.getByRole("button", { name: /PATEAR PENAL/ });
  await expect(kick).toBeVisible();
  await kick.click();

  await expect(page.getByText("Atlético Norte vs Unión Central")).toBeVisible({
    timeout: 2500,
  });
  await expect(page.getByText("Más de 4.5 tarjetas")).toBeVisible();
  await expect(page.getByText("CUOTA BET365 NO VERIFICADA")).toBeVisible();
  await expect(page.getByText("NUESTRO MODELO")).toBeVisible();
  await expect(page.getByText("MEJOR RAZÓN PARA NO ENTRAR")).toBeVisible();

  await expectNoHorizontalOverflow(page);
});
