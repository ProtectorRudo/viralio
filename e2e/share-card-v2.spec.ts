import { createHash } from "node:crypto";
import { expect, test, type Page } from "@playwright/test";

async function referralToken(page: Page, slug: string): Promise<string> {
  const sessionResponse = page.waitForResponse((response) =>
    response.url().endsWith("/api/sessions") && response.request().method() === "POST",
  );
  await page.goto(`/${slug}`);
  const payload = await (await sessionResponse).json() as { session: { referralToken: string } };
  return payload.session.referralToken;
}

function digest(value: Buffer): string {
  return createHash("sha256").update(value).digest("hex");
}

test("real share cards are private valid images and differ between Warm Crafted and Bold Contemporary", async ({ page, request }) => {
  const mokaToken = await referralToken(page, "moka");
  const atlasToken = await referralToken(page, "atlas-barber");

  const mokaResponse = await request.get(`http://127.0.0.1:3000/api/share-card/${encodeURIComponent(mokaToken)}`);
  const atlasResponse = await request.get(`http://127.0.0.1:3000/api/share-card/${encodeURIComponent(atlasToken)}`);

  for (const response of [mokaResponse, atlasResponse]) {
    expect(response.status()).toBe(200);
    expect(response.headers()["content-type"]).toMatch(/^image\/png/i);
    expect(response.headers()["cache-control"]).toContain("no-store");
  }

  const mokaImage = await mokaResponse.body();
  const atlasImage = await atlasResponse.body();
  expect(mokaImage.byteLength).toBeGreaterThan(10_000);
  expect(atlasImage.byteLength).toBeGreaterThan(10_000);
  expect(digest(mokaImage)).not.toBe(digest(atlasImage));
});
