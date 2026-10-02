import { NextRequest, NextResponse } from "next/server";
import { invokeMaurilioAccountRpc } from "@/lib/maurilio-account-server";
import { MAURILIO_AUTH_COOKIE } from "@/lib/maurilio-auth-server";

function accessToken(request: NextRequest) {
  return request.cookies.get(MAURILIO_AUTH_COOKIE)?.value || null;
}

function sameOrigin(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  try {
    return new URL(origin).origin === request.nextUrl.origin;
  } catch {
    return false;
  }
}

export async function GET(request: NextRequest) {
  const token = accessToken(request);
  if (!token) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  const result = await invokeMaurilioAccountRpc<Record<string, unknown>>(
    token,
    "maurilio_my_account",
  );

  if (!result.ok) {
    return NextResponse.json(
      { error: result.error },
      { status: result.status === 503 ? 503 : 401 },
    );
  }

  return NextResponse.json(result.data, {
    headers: {
      "Cache-Control": "private, no-store, max-age=0",
      "X-Robots-Tag": "noindex, nofollow, noarchive",
    },
  });
}

export async function POST(request: NextRequest) {
  if (!sameOrigin(request)) {
    return NextResponse.json({ error: "invalid_origin" }, { status: 403 });
  }

  const token = accessToken(request);
  if (!token) {
    return NextResponse.json({ error: "authentication_required" }, { status: 401 });
  }

  let body: {
    slug?: unknown;
    displayName?: unknown;
    headline?: unknown;
    sports?: unknown;
    specialties?: unknown;
    monthlyPriceArs?: unknown;
  };

  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const slug = typeof body.slug === "string" ? body.slug.trim().toLowerCase() : "";
  const displayName =
    typeof body.displayName === "string" ? body.displayName.trim() : "";
  const headline = typeof body.headline === "string" ? body.headline.trim() : null;
  const sports = Array.isArray(body.sports)
    ? body.sports.filter((value): value is string => typeof value === "string").slice(0, 8)
    : [];
  const specialties = Array.isArray(body.specialties)
    ? body.specialties.filter((value): value is string => typeof value === "string").slice(0, 12)
    : [];
  const price =
    body.monthlyPriceArs === null || body.monthlyPriceArs === ""
      ? null
      : Number(body.monthlyPriceArs);

  if (!/^[a-z0-9][a-z0-9-]{2,39}$/.test(slug)) {
    return NextResponse.json({ error: "invalid_slug" }, { status: 400 });
  }
  if (displayName.length < 2 || displayName.length > 60) {
    return NextResponse.json({ error: "invalid_display_name" }, { status: 400 });
  }
  if (headline && headline.length > 120) {
    return NextResponse.json({ error: "headline_too_long" }, { status: 400 });
  }
  if (price !== null && (!Number.isFinite(price) || price < 0)) {
    return NextResponse.json({ error: "invalid_price" }, { status: 400 });
  }

  const result = await invokeMaurilioAccountRpc<Record<string, unknown>>(
    token,
    "maurilio_upsert_tipster_profile",
    {
      p_slug: slug,
      p_display_name: displayName,
      p_headline: headline,
      p_sports: sports,
      p_specialties: specialties,
      p_monthly_price_ars: price,
    },
  );

  if (!result.ok) {
    const duplicate = result.error.toLowerCase().includes("duplicate");
    return NextResponse.json(
      { error: duplicate ? "slug_taken" : result.error },
      { status: duplicate ? 409 : result.status },
    );
  }

  return NextResponse.json(result.data, {
    headers: {
      "Cache-Control": "private, no-store, max-age=0",
      "X-Robots-Tag": "noindex, nofollow, noarchive",
    },
  });
}
