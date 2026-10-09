import { expect, test } from "@playwright/test";

const PAUSED = ["abuelos", "aniversario", "propuesta"] as const;
const READY = ["pareja", "mama", "papa", "hijos", "amistad", "cumpleanos"] as const;

test("La home distingue las tres experiencias que todavía no se pueden abrir", async ({ page }) => {
  await page.goto("/tehiceesto");
  for (const category of ["Abuelos", "Aniversario", "Propuesta"]) {
    await expect(page.locator(".thh-v2-more .thh-v2-coming-soon").filter({hasText:category})).toContainText("Próximamente");
  }
  for(const slug of PAUSED) {
    await expect(page.locator(`.thh-v2-more a[href$="/experiencias/${slug}"]`)).toHaveCount(0);
  }
  for(const slug of READY) {
    await expect(page.locator(`.thh-v2-recipient[href$="/experiencias/${slug}"]`)).toBeVisible();
  }
});

test("El catálogo no permite comprar ni previsualizar las experiencias pendientes", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/tehiceesto/crear");
  for(const slug of PAUSED) {
    const card=page.locator(`.thi-simple-card-${slug}`);
    await expect(card).toBeVisible();
    await expect(card.locator(".thi-simple-unavailable")).toContainText("Próximamente");
    await expect(card.locator(".thi-simple-choose button, button.thi-simple-choose")).toHaveCount(0);
    await expect(card.locator("a.thi-simple-preview, a.thi-simple-photo-link")).toHaveCount(0);
  }
  for(const slug of READY) {
    const card=page.locator(`.thi-simple-card-${slug}`);
    await expect(card.locator("button.thi-simple-choose")).toBeEnabled();
    await expect(card.locator("a.thi-simple-preview")).toBeVisible();
  }
  await page.goto("/tehiceesto/crear?experiencia=propuesta");
  await expect(page.locator(".thi-simple-catalog")).toBeVisible();
});

test("Las rutas pendientes muestran Próximamente, pero nunca ejecutan el motor de la experiencia", async ({ page }) => {
  for (const slug of PAUSED) {
    await page.goto(`/tehiceesto/experiencias/${slug}`);
    await expect(page.locator(".thi-coming-tag")).toHaveText("Próximamente");
    await expect(page.locator(".thi-coming-panel")).toContainText("Todavía no está disponible para ver ni comprar.");
    await expect(page.locator(".thi-experience")).toHaveCount(0);
    await expect(page.locator(".thi-coming-back")).toBeVisible();
  }
});
