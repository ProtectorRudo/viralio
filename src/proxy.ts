import { NextRequest, NextResponse } from "next/server";

const PRIMARY_HOST = "tehiceesto.com";
const WWW_HOST = "www.tehiceesto.com";
const LEGACY_PREFIX = "/tehiceesto";

function hostWithoutPort(request: NextRequest) {
  return (request.headers.get("host") || "").split(":")[0].toLowerCase();
}

function applyPrivateHeaders(response: NextResponse, pathname: string) {
  response.headers.set("Referrer-Policy","no-referrer");
  response.headers.set("X-Robots-Tag","noindex, nofollow, noarchive, noimageindex");
  response.headers.set("Cache-Control","private, no-store, max-age=0, must-revalidate");
  response.headers.set("X-Content-Type-Options","nosniff");
  response.headers.set(
    "Permissions-Policy",
    pathname.startsWith("/editar/")
      ? "camera=(), microphone=(self), geolocation=()"
      : "camera=(), microphone=(), geolocation=()",
  );
  return response;
}

function privateTeHiceEstoPath(pathname: string) {
  const normalized = pathname === LEGACY_PREFIX
    ? "/"
    : pathname.startsWith(`${LEGACY_PREFIX}/`)
      ? pathname.slice(LEGACY_PREFIX.length)
      : pathname;

  return normalized.startsWith("/r/") ||
    normalized.startsWith("/pedido/") ||
    normalized.startsWith("/editar/") ||
    normalized === "/mis-regalos" ||
    normalized.startsWith("/mercadopago/") ||
    normalized === "/afiliados" ||
    normalized.startsWith("/afiliados/") ||
    normalized === "/admin" ||
    normalized.startsWith("/admin/");
}

function teHiceEstoRobots() {
  return new NextResponse(
    [
      "User-agent: *",
      "Allow: /",
      "Disallow: /admin",
      "Disallow: /afiliados",
      "Disallow: /r/",
      "Disallow: /pedido/",
      "Disallow: /editar/",
      "Disallow: /mis-regalos",
      "Disallow: /mercadopago/",
      "",
      "Sitemap: https://tehiceesto.com/sitemap.xml",
      "",
    ].join("\n"),
    {
      headers: {
        "content-type": "text/plain; charset=utf-8",
        "cache-control": "public, max-age=3600",
      },
    },
  );
}

function teHiceEstoSitemap() {
  const paths = [
    "",
    "/crear",
    "/experiencias/pareja",
    "/experiencias/cumpleanos",
    "/experiencias/hijos",
    "/experiencias/mama",
    "/experiencias/papa",
    "/experiencias/amistad",
  ];

  const urls = paths
    .map(
      (path) =>
        `  <url><loc>https://tehiceesto.com${path}</loc></url>`,
    )
    .join("\n");

  return new NextResponse(
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>`,
    {
      headers: {
        "content-type": "application/xml; charset=utf-8",
        "cache-control": "public, max-age=3600",
      },
    },
  );
}

export function proxy(request: NextRequest) {
  const host = hostWithoutPort(request);
  const { pathname, search } = request.nextUrl;

  // Viralio and every other host keep their routing untouched, while
  // private Te Hice Esto routes still receive the same privacy headers.
  if (host !== PRIMARY_HOST && host !== WWW_HOST) {
    const response = NextResponse.next();
    return privateTeHiceEstoPath(pathname)
      ? applyPrivateHeaders(response, pathname.startsWith(LEGACY_PREFIX) ? pathname.slice(LEGACY_PREFIX.length) || "/" : pathname)
      : response;
  }

  // Te Hice Esto has one canonical host.
  if (host === WWW_HOST) {
    const target = new URL(request.url);
    target.hostname = PRIMARY_HOST;
    target.port = "";
    return NextResponse.redirect(target, 308);
  }

  // Shared Next.js runtime assets are required by both brands.
  if (pathname.startsWith("/_next/")) {
    return NextResponse.next();
  }

  // Allow only TeHiceEsto's original voice assets through unchanged.
  // Otherwise the host rewrite sends /mama-voz-web.mp3 to
  // /tehiceesto/mama-voz-web.mp3, which does not exist in /public.
  if (pathname === "/mama-voz-web.mp3" || pathname === "/mama-voz-web.opus") {
    return NextResponse.next();
  }

  // A non-sensitive deployment marker is exposed so CI can verify
  // that Vercel is serving the exact commit being certified.
  if (pathname === "/api/version") {
    const target = request.nextUrl.clone();
    target.pathname = `${LEGACY_PREFIX}/api/version`;
    return NextResponse.rewrite(target);
  }

  // Never expose Viralio APIs under the Te Hice Esto domain.
  if (pathname.startsWith("/api/") || pathname === "/api") {
    return new NextResponse("Not Found", {
      status: 404,
      headers: { "cache-control": "no-store" },
    });
  }

  // Host-specific public metadata so Te Hice Esto never inherits Viralio SEO.
  if (pathname === "/robots.txt") {
    return teHiceEstoRobots();
  }

  if (pathname === "/sitemap.xml") {
    return teHiceEstoSitemap();
  }

  // Brand-specific favicon: never inherit Viralio's icon on tehiceesto.com.
  if (pathname === "/favicon.ico") {
    const target = request.nextUrl.clone();
    target.pathname = `${LEGACY_PREFIX}/brand-icon`;
    return NextResponse.rewrite(target);
  }

  // Keep old prefixed links clean on the dedicated domain.
  if (pathname === LEGACY_PREFIX || pathname.startsWith(`${LEGACY_PREFIX}/`)) {
    const cleanPath = pathname.slice(LEGACY_PREFIX.length) || "/";
    const target = new URL(cleanPath + search, `https://${PRIMARY_HOST}`);
    return NextResponse.redirect(target, 308);
  }

  // Expose only the Te Hice Esto subtree on tehiceesto.com.
  // Unknown paths therefore resolve inside /tehiceesto and return its own 404,
  // never another Viralio route.
  const target = request.nextUrl.clone();
  target.pathname =
    pathname === "/" ? LEGACY_PREFIX : `${LEGACY_PREFIX}${pathname}`;

  const response = NextResponse.rewrite(target);
  return privateTeHiceEstoPath(pathname)
    ? applyPrivateHeaders(response, pathname)
    : response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"],
};
