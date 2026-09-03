import { expect, test } from "@playwright/test";

const authUrl = "http://127.0.0.1:3000/api/merchant/auth";

function headers(ip: string) {
  return {
    origin: "http://127.0.0.1:3000",
    "x-forwarded-for": ip,
  };
}

test("merchant auth rate-limits one client without locking out other merchants or clients", async ({ request }) => {
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const response = await request.post(authUrl, {
      data: { merchantSlug: "moka", pin: "000000" },
      headers: headers("198.51.100.21"),
    });
    expect(response.status()).toBe(401);
  }

  const blocked = await request.post(authUrl, {
    data: { merchantSlug: "moka", pin: "000000" },
    headers: headers("198.51.100.21"),
  });
  expect(blocked.status()).toBe(429);
  expect(Number(blocked.headers()["retry-after"])).toBeGreaterThan(0);

  const otherMerchant = await request.post(authUrl, {
    data: { merchantSlug: "atlas-barber", pin: "135790" },
    headers: headers("198.51.100.21"),
  });
  expect(otherMerchant.status()).toBe(200);

  const otherClient = await request.post(authUrl, {
    data: { merchantSlug: "moka", pin: "246810" },
    headers: headers("198.51.100.22"),
  });
  expect(otherClient.status()).toBe(200);
});

test("a successful login clears earlier failures for that merchant and client", async ({ request }) => {
  const ip = "198.51.100.23";
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const response = await request.post(authUrl, {
      data: { merchantSlug: "moka", pin: "000000" },
      headers: headers(ip),
    });
    expect(response.status()).toBe(401);
  }

  const success = await request.post(authUrl, {
    data: { merchantSlug: "moka", pin: "246810" },
    headers: headers(ip),
  });
  expect(success.status()).toBe(200);

  for (let attempt = 0; attempt < 4; attempt += 1) {
    const response = await request.post(authUrl, {
      data: { merchantSlug: "moka", pin: "000000" },
      headers: headers(ip),
    });
    expect(response.status()).toBe(401);
  }

  const blockedAgain = await request.post(authUrl, {
    data: { merchantSlug: "moka", pin: "000000" },
    headers: headers(ip),
  });
  expect(blockedAgain.status()).toBe(429);
});
