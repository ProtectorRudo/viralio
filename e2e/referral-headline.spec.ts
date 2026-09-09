import { expect, test } from "@playwright/test";

test("referral headline stays fully inside every supported mobile viewport", async ({ page }) => {
  for (const viewport of [
    { width: 360, height: 800 },
    { width: 390, height: 844 },
    { width: 430, height: 932 },
  ]) {
    await page.setViewportSize(viewport);
    await page.goto("/moka");
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.getByRole("button", { name: /Descubrir mi regalo/ }).click();

    const headline = page.getByRole("heading", { name: "Las buenas noticias también se comparten" });
    await expect(headline).toBeVisible();

    const metrics = await headline.evaluate((node) => {
      const rect = node.getBoundingClientRect();
      const style = getComputedStyle(node);
      return {
        left: rect.left,
        right: rect.right,
        clientWidth: (node as HTMLElement).clientWidth,
        scrollWidth: (node as HTMLElement).scrollWidth,
        whiteSpace: style.whiteSpace,
        wordBreak: style.wordBreak,
      };
    });

    expect(metrics.left).toBeGreaterThanOrEqual(0);
    expect(metrics.right).toBeLessThanOrEqual(viewport.width + 0.5);
    expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.clientWidth + 1);
    expect(metrics.whiteSpace).toBe("normal");
    expect(metrics.wordBreak).toBe("normal");
  }
});
