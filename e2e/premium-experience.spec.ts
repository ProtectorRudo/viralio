import { expect, test, type Page } from "@playwright/test";

type ShareCall = {
  hasFiles: boolean;
  fileName?: string;
  fileSize?: number;
  fileType?: string;
  text?: string;
  url?: string;
};

async function enableNativeShare(page: Page, options: { files?: boolean; cancel?: boolean } = {}) {
  const files = options.files ?? true;
  const cancel = options.cancel ?? false;
  await page.addInitScript(({ supportsFiles, shouldCancel }) => {
    const target = window as Window & { __viralioShareCalls?: ShareCall[] };
    target.__viralioShareCalls = [];
    Object.defineProperty(navigator, "canShare", {
      configurable: true,
      value: (data: ShareData) => supportsFiles && Boolean(data.files?.length),
    });
    Object.defineProperty(navigator, "share", {
      configurable: true,
      value: async (data: ShareData) => {
        if (shouldCancel) throw new DOMException("Share cancelled", "AbortError");
        const file = data.files?.[0];
        target.__viralioShareCalls?.push({
          hasFiles: Boolean(data.files?.length),
          fileName: file?.name,
          fileSize: file?.size,
          fileType: file?.type,
          text: data.text,
          url: data.url,
        });
      },
    });
  }, { supportsFiles: files, shouldCancel: cancel });
}

async function shareCalls(page: Page): Promise<ShareCall[]> {
  return page.evaluate(() => (window as Window & { __viralioShareCalls?: ShareCall[] }).__viralioShareCalls ?? []);
}

async function reachWheel(page: Page, path: string) {
  await enableNativeShare(page);
  await page.goto(path);
  await page.getByRole("button", { name: /Descubrir mi premio/ }).click();
  await expect(page.getByTestId("unlock-stage")).toBeVisible();
  await expect(page.getByTestId("wheel-stage")).toHaveCount(0);
  await page.getByTestId("native-share").click();
  await expect(page.getByTestId("wheel-stage")).toBeVisible();
}

async function expectNoOverflow(page: Page) {
  const dimensions = await page.evaluate(() => ({ width: document.documentElement.clientWidth, scrollWidth: document.documentElement.scrollWidth }));
  expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.width);
}

test("Moka mobile: share gates wheel, server reward drives nine-turn landing, refresh persists and WhatsApp works", async ({ page, context }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await context.route("https://wa.me/**", (route) => route.fulfill({ status: 200, contentType: "text/html", body: "WhatsApp" }));
  await enableNativeShare(page);
  await page.goto("/moka");
  await expect(page.locator("main")).toHaveAttribute("data-merchant", "moka");
  await expect(page.getByRole("heading", { name: "Hay algo especial esperando" })).toBeVisible();
  await expect(page.getByTestId("premium-wheel")).toHaveCount(0);
  await expectNoOverflow(page);

  await page.getByRole("button", { name: /Descubrir mi premio/ }).click();
  await expect(page.getByRole("heading", { name: "Compartí tu pase para abrirlo" })).toBeVisible();
  await expect(page.getByTestId("whatsapp-status-share")).toBeVisible();
  await expect(page.getByTestId("instagram-story-share")).toBeVisible();
  await expect(page.getByTestId("premium-wheel")).toHaveCount(0);
  await page.getByTestId("native-share").click();
  await expect(page.getByTestId("premium-wheel").locator(".wheel-segment")).toHaveCount(5);
  await expect(page.getByTestId("premium-wheel")).toHaveAttribute("data-spin-turns", "9");

  const spinResponse = page.waitForResponse((response) => response.url().endsWith("/spin") && response.request().method() === "POST");
  await page.getByRole("button", { name: /Girar la ruleta/ }).click();
  const serverResult = await (await spinResponse).json() as { reward: { prizeId: string; prizeName: string; shortCode: string } };
  await expect(page.getByTestId("premium-wheel")).toHaveAttribute("data-winning-prize", serverResult.reward.prizeName);
  const prizeIds = await page.getByTestId("premium-wheel").locator(".wheel-segment").evaluateAll((segments) => segments.map((segment) => segment.getAttribute("data-prize-id")));
  const winningIndex = prizeIds.indexOf(serverResult.reward.prizeId);
  const expectedRotation = (9 * 360) - ((winningIndex + 0.5) * 360) / prizeIds.length;
  await expect(page.getByTestId("premium-wheel").locator(".wheel-svg")).toHaveAttribute("style", `transform: rotate(${expectedRotation}deg);`);
  await expect(page.getByTestId("reward-stage")).toBeVisible({ timeout: 8_000 });
  await expect(page.getByRole("heading", { name: serverResult.reward.prizeName })).toBeVisible();
  await expectNoOverflow(page);

  await page.reload();
  await expect(page.getByTestId("reward-stage")).toBeVisible();
  await expect(page.getByText(serverResult.reward.shortCode)).toBeVisible();

  const popupPromise = page.waitForEvent("popup");
  await page.getByRole("button", { name: "Guardar premio en WhatsApp" }).click();
  const popup = await popupPromise;
  await expect.poll(() => popup.url()).toContain("wa.me/5491100000000");
  const decoded = decodeURIComponent(popup.url());
  expect(decoded).toContain("Hola Moka, guardo mi premio:");
  expect(decoded).toContain("Código:");
  expect(decoded).toContain("Vence:");
  expect(decoded).toContain("/premio/");
});

test("Status sharing generates a branded image file before unlocking", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await enableNativeShare(page, { files: true });
  await page.goto("/moka");
  await page.getByRole("button", { name: /Descubrir mi premio/ }).click();
  await page.getByTestId("whatsapp-status-share").click();
  await expect(page.getByTestId("wheel-stage")).toBeVisible();
  const calls = await shareCalls(page);
  expect(calls).toHaveLength(1);
  expect(calls[0].hasFiles).toBe(true);
  expect(calls[0].fileName).toBe("viralio-moka-pase.png");
  expect(calls[0].fileType).toContain("image/png");
  expect(calls[0].fileSize ?? 0).toBeGreaterThan(1_000);
});

test("Instagram Stories falls back to text and referral URL when file sharing is unavailable", async ({ page }) => {
  await page.setViewportSize({ width: 412, height: 915 });
  await enableNativeShare(page, { files: false });
  await page.goto("/moka");
  await page.getByRole("button", { name: /Descubrir mi premio/ }).click();
  await page.getByTestId("instagram-story-share").click();
  await expect(page.getByTestId("wheel-stage")).toBeVisible();
  const calls = await shareCalls(page);
  expect(calls).toHaveLength(1);
  expect(calls[0].hasFiles).toBe(false);
  expect(calls[0].text).toContain("pase sorpresa");
  expect(calls[0].url).toContain("/moka?ref=");
});

test("cancelling a Status share does not unlock the wheel", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await enableNativeShare(page, { files: true, cancel: true });
  await page.goto("/moka");
  await page.getByRole("button", { name: /Descubrir mi premio/ }).click();
  await page.getByTestId("whatsapp-status-share").click();
  await expect(page.getByTestId("unlock-stage")).toBeVisible();
  await expect(page.getByTestId("wheel-stage")).toHaveCount(0);
});

test("Atlas Barber uses the shared engine, distinct premium theme, social card and themed reward card", async ({ page }) => {
  await page.setViewportSize({ width: 412, height: 915 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await enableNativeShare(page, { files: true });
  await page.goto("/atlas-barber");
  await page.getByRole("button", { name: /Descubrir mi premio/ }).click();
  await page.getByTestId("instagram-story-share").click();
  await expect(page.getByTestId("wheel-stage")).toBeVisible();
  const calls = await shareCalls(page);
  expect(calls[0].fileName).toBe("viralio-atlas-barber-pase.png");
  const root = page.locator("main");
  await expect(root).toHaveAttribute("data-merchant", "atlas-barber");
  expect(await root.evaluate((node) => getComputedStyle(node).getPropertyValue("--color-primary").trim())).toBe("#D0A34A");
  await expect(page.getByTestId("premium-wheel").locator(".wheel-segment")).toHaveCount(5);
  await page.getByRole("button", { name: /Girar la ruleta/ }).click();
  await expect(page.getByTestId("reward-stage")).toBeVisible();
  await expectNoOverflow(page);
  await page.getByRole("link", { name: "Ver tarjeta del premio" }).click();
  await expect(page.locator("main")).toHaveAttribute("data-merchant", "atlas-barber");
  await expect(page.locator("header").getByText("Atlas Barber", { exact: true })).toBeVisible();
  await expect(page.getByTestId("reward-status")).toHaveText("Disponible");
});

test("required mobile and desktop viewports have no horizontal overflow", async ({ page }) => {
  const viewports = [
    { width: 360, height: 800 },
    { width: 390, height: 844 },
    { width: 412, height: 915 },
    { width: 430, height: 932 },
    { width: 1280, height: 800 },
  ];
  for (const viewport of viewports) {
    await page.setViewportSize(viewport);
    await page.goto("/moka");
    await expect(page.getByTestId("landing-stage")).toBeVisible();
    await expectNoOverflow(page);
  }
});

test("reduced motion keeps the complete flow operable", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await reachWheel(page, "/moka");
  await page.getByRole("button", { name: /Girar la ruleta/ }).click();
  await expect(page.getByTestId("reward-stage")).toBeVisible();
  await expectNoOverflow(page);
});
