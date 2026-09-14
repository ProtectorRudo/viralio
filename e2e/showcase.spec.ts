import { expect, test, type Page } from "@playwright/test";

const SHOWROOM = "http://127.0.0.1:4173";

async function expectNoOverflow(page: Page) {
  const size = await page.evaluate(() => ({
    width: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }));
  expect(size.scrollWidth).toBeLessThanOrEqual(size.width);
}

test("showroom landing exposes available merchant demos", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${SHOWROOM}/`);
  await expect(page.getByRole("heading", { name: /Un mismo motor/ })).toBeVisible();
  await expect(page.getByRole("link", { name: /Moka/ })).toHaveAttribute("href", "./moka/");
  await expect(page.getByRole("link", { name: /Atlas Barber/ })).toHaveAttribute("href", "./atlas-barber/");
  await expect(page.getByRole("link", { name: /El Gordo Leo/ })).toHaveAttribute("href", "./el-gordo-leo/");
  await expectNoOverflow(page);
});

test("Moka showroom completes the current static premium flow", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${SHOWROOM}/moka/`);
  await expect(page.getByRole("heading", { name: "Tenemos un regalo especial para vos." })).toBeVisible();
  await page.getByRole("button", { name: /Abrir mi regalo/ }).click();

  await expect(page.getByRole("heading", { name: /Antes de descubrir el tuyo/ })).toBeVisible();
  await expect(page.getByRole("button", { name: /Compartir por WhatsApp/ })).toBeVisible();
  await page.getByRole("button", { name: /Compartir por WhatsApp/ }).click();

  await expect(page.getByRole("heading", { name: /Ahora sí/ })).toBeVisible();
  await expect(page.locator(".wheel")).toBeVisible();

  await page.getByRole("button", { name: /Girar la ruleta/ }).click();
  await expect(page.locator(".wheel")).toHaveClass(/spinning/);
  const landingAngle = await page.locator(".wheel").evaluate((node) =>
    Number.parseFloat((node as HTMLElement).style.getPropertyValue("--landing")),
  );
  expect(landingAngle).toBeGreaterThan(2800);

  await expect(page.locator(".reward-stage")).toBeVisible({ timeout: 6_000 });
  await expect(page.getByRole("button", { name: "Guardar mi regalo" })).toBeVisible();
  await expect(page.getByText(/Válido por 7 días/)).toBeVisible();
  await expectNoOverflow(page);
});

test("Atlas showroom uses the same engine with a distinct theme", async ({ page }) => {
  await page.setViewportSize({ width: 412, height: 915 });
  await page.goto(`${SHOWROOM}/atlas-barber/`);
  await expect(page.getByRole("heading", { name: "Tu próxima visita viene con regalo." })).toBeVisible();
  await expect(page.locator(".atlas-page")).toBeVisible();
  await page.getByRole("button", { name: /Abrir mi regalo/ }).click();
  await expect(page.getByRole("heading", { name: /Antes de descubrir el tuyo/ })).toBeVisible();
  await expect(page.getByRole("button", { name: /Compartir por WhatsApp/ })).toBeVisible();
  await expectNoOverflow(page);
});

test("El Gordo Leo pilot completes share, wheel and coupon flow", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${SHOWROOM}/el-gordo-leo/`);
  await expect(page.getByRole("heading", { name: "Tu próxima compra puede venir con premio." })).toBeVisible();
  await page.getByRole("button", { name: /Descubrir mi premio/ }).click();

  await expect(page.getByRole("heading", { name: /Compartilo y abrí la ruleta/ })).toBeVisible();
  await page.getByRole("button", { name: /Compartir por WhatsApp/ }).click();

  await expect(page.getByRole("heading", { name: /Ahora sí/ })).toBeVisible();
  await expect(page.locator("#wheel")).toBeVisible();
  await page.getByRole("button", { name: /Girar la ruleta/ }).click();
  await expect(page.locator(".stage")).toHaveClass(/spinning/);

  await expect(page.getByText(/Es para usar en tu próxima compra/)).toBeVisible({ timeout: 5_000 });
  await expect(page.locator(".coupon-code")).toHaveText(/^LEO-[A-Z2-9]{6}$/);
  await expect(page.getByRole("checkbox", { name: /Quiero recibir ofertas/ })).not.toBeChecked();
  await expect(page.getByRole("button", { name: /Enviar mi cupón al negocio/ })).toBeVisible();
  await expectNoOverflow(page);
});

test("showroom remains usable with reduced motion", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(`${SHOWROOM}/moka/`);
  await page.getByRole("button", { name: /Abrir mi regalo/ }).click();
  await page.getByRole("button", { name: /Compartir por WhatsApp/ }).click();
  await expect(page.getByRole("button", { name: /Girar la ruleta/ })).toBeVisible();
  await expectNoOverflow(page);
});
