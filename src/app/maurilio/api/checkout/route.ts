import { NextRequest, NextResponse } from "next/server";
import {
  invokeMaurilioCheckout,
  type CheckoutStatus,
  type CheckoutTier,
} from "@/lib/maurilio-checkout-server";
import { validSubjectId } from "@/lib/maurilio-access-server";

const ACCESS_COOKIE = "maurilio_sid";

function sameOrigin(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (!origin) return false;

  try {
    return new URL(origin).origin === request.nextUrl.origin;
  } catch {
    return false;
  }
}

export async function GET() {
  const result = await invokeMaurilioCheckout<CheckoutStatus>({
    action: "status",
  });

  if (!result.ok) {
    return NextResponse.json(
      {
        enabled: false,
        provider: "mercado_pago",
        prices: { pro: null, elite: null },
        availability: { pro: false, elite: false },
      },
      {
        status: 200,
        headers: { "Cache-Control": "private, no-store, max-age=0" },
      },
    );
  }

  return NextResponse.json(result.data, {
    headers: { "Cache-Control": "private, no-store, max-age=0" },
  });
}

export async function POST(request: NextRequest) {
  if (!sameOrigin(request)) {
    return NextResponse.json({ error: "invalid_origin" }, { status: 403 });
  }

  let tier: CheckoutTier;
  try {
    const body = (await request.json()) as { tier?: unknown };
    if (body.tier !== "pro" && body.tier !== "elite") {
      return NextResponse.json({ error: "invalid_tier" }, { status: 400 });
    }
    tier = body.tier;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const existing = request.cookies.get(ACCESS_COOKIE)?.value;
  const subjectId = validSubjectId(existing) ? existing! : crypto.randomUUID();

  const result = await invokeMaurilioCheckout<{
    orderId: string;
    checkoutUrl: string;
    reused?: boolean;
  }>({
    action: "checkout",
    subjectId,
    tier,
  });

  if (!result.ok) {
    return NextResponse.json(
      { error: result.error },
      { status: result.status },
    );
  }

  const response = NextResponse.json(result.data, {
    headers: {
      "Cache-Control": "private, no-store, max-age=0",
      "X-Robots-Tag": "noindex, nofollow, noarchive",
      "Referrer-Policy": "no-referrer",
    },
  });

  response.cookies.set(ACCESS_COOKIE, subjectId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/maurilio",
    maxAge: 60 * 60 * 24 * 90,
  });

  return response;
}
