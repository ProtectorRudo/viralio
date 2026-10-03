import { NextRequest, NextResponse } from "next/server";

const PRIMARY_HOST = "tehiceesto.com";
const WWW_HOST = "www.tehiceesto.com";
const LEGACY_PREFIX = "/tehiceesto";

function hostWithoutPort(request: NextRequest) {
  return (request.headers.get("host") || "").split(":")[0].toLowerCase();
}

export function proxy(request: NextRequest) {
  const host = hostWithoutPort(request);
  const { pathname, search } = request.nextUrl;

  if (host !== PRIMARY_HOST && host !== WWW_HOST) {
    return NextResponse.next();
  }

  if (host === WWW_HOST) {
    const target = new URL(request.url);
    target.hostname = PRIMARY_HOST;
    target.port = "";
    return NextResponse.redirect(target, 308);
  }

  if (
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/api/") ||
    pathname === "/favicon.ico" ||
    pathname === "/robots.txt" ||
    pathname === "/sitemap.xml"
  ) {
    return NextResponse.next();
  }

  // Keep the public URL clean if an old /tehiceesto link is opened
  // on the new dedicated domain.
  if (pathname === LEGACY_PREFIX || pathname.startsWith(`${LEGACY_PREFIX}/`)) {
    const cleanPath = pathname.slice(LEGACY_PREFIX.length) || "/";
    const target = new URL(cleanPath + search, `https://${PRIMARY_HOST}`);
    return NextResponse.redirect(target, 308);
  }

  // Serve the existing Te Hice Esto app internally while exposing
  // first-class root URLs on tehiceesto.com.
  const target = request.nextUrl.clone();
  target.pathname = pathname === "/" ? LEGACY_PREFIX : `${LEGACY_PREFIX}${pathname}`;

  return NextResponse.rewrite(target);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"],
};
