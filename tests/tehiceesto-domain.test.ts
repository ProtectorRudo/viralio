import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { proxy } from "../src/proxy";

function request(url: string, host: string) {
  return new NextRequest(url, { headers: { host } });
}

describe("tehiceesto.com host routing", () => {
  it("rewrites the apex root to the Te Hice Esto app", () => {
    const response = proxy(request("https://tehiceesto.com/", "tehiceesto.com"));
    expect(response.headers.get("x-middleware-rewrite")).toContain("/tehiceesto");
  });

  it("rewrites clean dedicated paths to the existing subtree", () => {
    const response = proxy(
      request("https://tehiceesto.com/experiencias/pareja", "tehiceesto.com"),
    );
    expect(response.headers.get("x-middleware-rewrite")).toContain(
      "/tehiceesto/experiencias/pareja",
    );
  });

  it("redirects old prefixed links to clean dedicated-domain paths", () => {
    const response = proxy(
      request("https://tehiceesto.com/tehiceesto/crear", "tehiceesto.com"),
    );
    expect(response.status).toBe(308);
    expect(response.headers.get("location")).toBe("https://tehiceesto.com/crear");
  });

  it("redirects www to the apex domain", () => {
    const response = proxy(
      request("https://www.tehiceesto.com/crear", "www.tehiceesto.com"),
    );
    expect(response.status).toBe(308);
    expect(response.headers.get("location")).toBe("https://tehiceesto.com/crear");
  });

  it("blocks Viralio APIs on the Te Hice Esto domain", async () => {
    const response = proxy(
      request("https://tehiceesto.com/api/admin", "tehiceesto.com"),
    );
    expect(response.status).toBe(404);
    expect(await response.text()).toBe("Not Found");
  });

  it("serves Te Hice Esto robots instead of Viralio robots", async () => {
    const response = proxy(
      request("https://tehiceesto.com/robots.txt", "tehiceesto.com"),
    );
    const body = await response.text();
    expect(body).toContain("Disallow: /admin");
    expect(body).toContain("Disallow: /r/");
    expect(body).toContain("https://tehiceesto.com/sitemap.xml");
  });

  it("does not affect viralio.net", () => {
    const response = proxy(
      request("https://viralio.net/tehiceesto", "viralio.net"),
    );
    expect(response.headers.get("x-middleware-next")).toBe("1");
  });
});
