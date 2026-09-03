import { expect, test } from "@playwright/test";

function header(response: Awaited<ReturnType<typeof fetch>>, name: string) {
  return response.headers.get(name) ?? "";
}

test("public pages ship baseline security headers without breaking the consumer experience", async ({ page, request }) => {
  const response = await request.get("/moka");
  expect(response.status()).toBe(200);
  const headers = response.headers();

  expect(headers["x-powered-by"]).toBeUndefined();
  expect(headers["x-frame-options"]).toBe("DENY");
  expect(headers["x-content-type-options"]).toBe("nosniff");
  expect(headers["referrer-policy"]).toBe("strict-origin-when-cross-origin");
  expect(headers["permissions-policy"]).toContain("camera=()");
  expect(headers["cross-origin-opener-policy"]).toBe("same-origin");
  expect(headers["strict-transport-security"]).toContain("max-age=31536000");

  const csp = headers["content-security-policy"] ?? "";
  expect(csp).toContain("default-src 'self'");
  expect(csp).toContain("frame-ancestors 'none'");
  expect(csp).toContain("object-src 'none'");
  expect(csp).toContain("img-src 'self' data: blob:");

  await page.goto("/moka");
  await expect(page.getByRole("button", { name: /Descubrir mi premio/ })).toBeVisible();
});

test("merchant, reward and transactional API surfaces are explicitly no-store", async ({ request }) => {
  const paths = [
    "/comercio/moka/canjes",
    "/premio/token-inexistente",
    "/validar/token-inexistente",
    "/api/merchant/rewards?shortCode=INVALID",
    "/api/rewards/token-inexistente",
    "/api/sessions/session-inexistente/spin",
    "/api/share-card/token-inexistente",
  ];

  for (const path of paths) {
    const response = await request.get(path, { failOnStatusCode: false });
    const cacheControl = response.headers()["cache-control"] ?? "";
    expect(cacheControl, path).toContain("private");
    expect(cacheControl, path).toContain("no-store");
    expect(response.headers()["pragma"], path).toBe("no-cache");
  }
});

test("static manifest is not forced into the sensitive no-store policy", async ({ request }) => {
  const response = await request.get("/manifest.webmanifest");
  expect(response.status()).toBe(200);
  const cacheControl = response.headers()["cache-control"] ?? "";
  expect(cacheControl).not.toContain("private, no-store");
  expect(response.headers()["x-frame-options"]).toBe("DENY");
});
