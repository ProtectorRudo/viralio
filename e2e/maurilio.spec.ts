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
