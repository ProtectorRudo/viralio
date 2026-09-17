import { expect, test } from "@playwright/test";

test("El Gordo Leo dynamic pilot uses approved copy and WhatsApp-only sharing", async ({ page, context }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await context.route("https://wa.me/**", (route) => route.fulfill({ status: 200, contentType: "text/html", body: "WhatsApp" }));

  await page.goto("/el-gordo-leo");
  await expect(page.locator("main")).toHaveAttribute("data-merchant", "el-gordo-leo");
  await expect(page.getByRole("heading", { name: "Tenemos un regalo para vos." })).toBeVisible();

  await page.getByRole("button", { name: /Descubrir mi premio/ }).click();
  await expect(page.getByRole("heading", { name: "Antes de descubrir el tuyo, regalale uno a alguien." })).toBeVisible();
  await expect(page.getByText("Compartilo por WhatsApp. La otra persona también recibe su propio regalo y el tuyo sigue siendo solo tuyo.")).toBeVisible();

  await expect(page.getByTestId("whatsapp-status-share")).toHaveCount(0);
  await expect(page.getByTestId("instagram-story-share")).toHaveCount(0);
  await expect(page.getByTestId("native-share")).toHaveCount(0);

  const popupPromise = page.waitForEvent("popup");
  await page.getByRole("button", { name: "Enviar regalo por WhatsApp a un amigo" }).click();
  const popup = await popupPromise;

  await expect(page.getByTestId("wheel-stage")).toBeVisible();
  await expect.poll(() => popup.url()).toContain("wa.me/");
  const decoded = decodeURIComponent(popup.url());
  expect(decoded).toContain("El Gordo Leo está regalando premios para la próxima compra");
  expect(decoded).toContain("/el-gordo-leo?ref=");
});
