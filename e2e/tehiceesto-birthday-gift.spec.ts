import { expect, test } from "@playwright/test";

for (const viewport of [{ width: 390, height: 844 }, { width: 1440, height: 960 }]) {
  test(`Cumpleaños gift unwrap is premium, accessible and preserves existing scenes at ${viewport.width}px`, async ({ page }, testInfo) => {
    await page.setViewportSize(viewport);
    const errors: string[] = [];
    page.on("pageerror", error => errors.push(error.message));
    await page.goto("/tehiceesto/experiencias/cumpleanos");

    const experience = page.locator("main.thi-experience");
    await expect(experience).toHaveAttribute("data-scene", "intro");
    const gift = page.locator(".birthday-gift-wrap .couple-gift-intro");
    await expect(gift).toHaveClass(/gift-phase-closed/);
    await expect(gift.getByRole("button", { name: /Abrí el regalo/ })).toBeVisible();
    await expect(gift.locator(".couple-gift-continue")).toBeDisabled();
    await expect(gift.locator(".couple-gift-box-base")).toBeVisible();

    const palette = await gift.evaluate(el => ({
      base: getComputedStyle(el).getPropertyValue("--gift-box"),
      background: getComputedStyle(el).backgroundColor,
      overflow: document.documentElement.scrollWidth - window.innerWidth,
    }));
    expect(palette.base).toContain("#502a41");
    expect(palette.overflow).toBeLessThanOrEqual(3);
    await testInfo.attach(`cumpleanos-gift-closed-${viewport.width}`, {
      body: await page.screenshot(), contentType: "image/png",
    });

    await gift.getByRole("button", { name: /Abrí el regalo/ }).click();
    await expect(gift).toHaveClass(/gift-phase-revealed/, { timeout: 8000 });
    await expect(gift.locator(".couple-gift-reveal h1")).toContainText("Sofi");
    await expect(gift.locator(".couple-gift-opening")).toContainText("cuánto significás para nosotros");
    await expect(gift.locator(".couple-gift-continue")).toBeEnabled();
    await page.waitForTimeout(700);

    const space = await gift.evaluate(el => {
      const name = el.querySelector(".couple-gift-reveal h1")!.getBoundingClientRect();
      const intro = el.querySelector(".couple-gift-opening")!.getBoundingClientRect();
      return {
        nameVisible: name.width > 0 && name.height > 0,
        copyVisible: intro.width > 0 && intro.height > 0,
        overflow: document.documentElement.scrollWidth - window.innerWidth,
      };
    });
    expect(space.nameVisible).toBe(true);
    expect(space.copyVisible).toBe(true);
    expect(space.overflow).toBeLessThanOrEqual(3);
    await testInfo.attach(`cumpleanos-gift-revealed-${viewport.width}`, {
      body: await page.screenshot(), contentType: "image/png",
    });

    await gift.locator(".couple-gift-continue").click();
    await expect(experience).toHaveAttribute("data-scene", "candles");
    await expect(page.locator(".thi-blow-controls-birthday")).toBeVisible();
    await expect(experience.locator(".birthday-gift-wrap")).toHaveCount(0);

    const otherSlugs = ["pareja", "mama", "hijos"];
    for (const slug of otherSlugs) {
      await page.goto(`/tehiceesto/experiencias/${slug}`);
      await expect(page.locator(".birthday-gift-wrap")).toHaveCount(0);
    }
    expect(errors).toEqual([]);
  });
}

test("Cumpleaños unwrapping honors reduced-motion preference", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/tehiceesto/experiencias/cumpleanos");
  const gift = page.locator(".birthday-gift-wrap .couple-gift-intro");
  await gift.getByRole("button", { name: /Abrí el regalo/ }).click();
  await expect(gift).toHaveClass(/gift-phase-revealed/);
  await gift.locator(".couple-gift-continue").click();
  await expect(page.locator("main.thi-experience")).toHaveAttribute("data-scene", "candles");
});
