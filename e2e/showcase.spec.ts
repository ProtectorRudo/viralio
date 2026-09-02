import { expect, test, type Page } from "@playwright/test";

const SHOWROOM = "http://127.0.0.1:4173";

async function expectNoOverflow(page: Page) {
  const size = await page.evaluate(() => ({
    width: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }));
  expect(size.scrollWidth).toBeLessThanOrEqual(size.width);
}

test("showroom landing exposes both merchant demos", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${SHOWROOM}/`);
  await expect(page.getByRole("heading", { name: /Un mismo motor/ })).toBeVisible();
  await expect(page.getByRole("link", { name: /Moka/ })).toHaveAttribute("href", "./moka/");
  await expect(page.getByRole("link", { name: /Atlas Barber/ })).toHaveAttribute("href", "./atlas-barber/");
  await expectNoOverflow(page);
});

test("Moka showroom completes the static premium flow", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${SHOWROOM}/moka/`);
  await expect(page.getByRole("heading", { name: "Hay algo especial esperando" })).toBeVisible();
  await page.getByRole("button", { name: /Descubrir mi premio/ }).click();

  await expect(page.getByRole("button", { name: /Estado de WhatsApp/ })).toBeVisible();
  await expect(page.getByRole("button", { name: /Instagram Stories/ })).toBeVisible();
  await expect(page.getByRole("button", { name: /Enviar por WhatsApp/ })).toBeVisible();
  await expect(page.getByRole("button", { name: /Compartir por otras apps/ })).toBeVisible();

  await page.getByRole("button", { name: /Estado de WhatsApp/ }).click();
  await expect(page.getByRole("heading", { name: /Ahora sí/ })).toBeVisible();
  await expect(page.locator(".demo-wheel")).toBeVisible();

  await page.getByRole("button", { name: /Girar la ruleta/ }).click();
  await expect(page.locator(".demo-wheel")).toHaveClass(/spinning/);
  const landingAngle = await page.locator(".demo-wheel").evaluate((node) =>
    Number.parseFloat((node as HTMLElement).style.getPropertyValue("--landing-angle")),
  );
  expect(landingAngle).toBeGreaterThan(2800);

  await expect(page.locator(".reward-stage-static")).toBeVisible({ timeout: 6_000 });
  await expect(page.getByRole("button", { name: "Guardar premio en WhatsApp" })).toBeVisible();
  await expect(page.getByText(/recompensa es ficticia/i)).toBeVisible();
  await expectNoOverflow(page);
});

test("Atlas showroom uses the same engine with a distinct theme", async ({ page }) => {
  await page.setViewportSize({ width: 412, height: 915 });
  await page.goto(`${SHOWROOM}/atlas-barber/`);
  await expect(page.getByRole("heading", { name: "Tu estilo tiene una sorpresa" })).toBeVisible();
  await expect(page.locator(".theme-atlas-barber")).toBeVisible();
  await page.getByRole("button", { name: /Descubrir mi premio/ }).click();
  await expect(page.getByRole("heading", { name: /Pasá el código/ })).toBeVisible();
  await expect(page.getByRole("button", { name: /Instagram Stories/ })).toBeVisible();
  await expectNoOverflow(page);
});

test("showroom remains usable with reduced motion", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(`${SHOWROOM}/moka/`);
  await page.getByRole("button", { name: /Descubrir mi premio/ }).click();
  await page.getByRole("button", { name: /Instagram Stories/ }).click();
  await expect(page.getByRole("button", { name: /Girar la ruleta/ })).toBeVisible();
  await expectNoOverflow(page);
});
