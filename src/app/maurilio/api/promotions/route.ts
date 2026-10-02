import { NextRequest, NextResponse } from "next/server";
import { MAURILIO_AUTH_COOKIE } from "@/lib/maurilio-auth-server";
import { invokeMaurilioPromotions } from "@/lib/maurilio-promotions-server";

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
  const token = request.cookies.get(MAURILIO_AUTH_COOKIE)?.value || null;

  const result = await invokeMaurilioPromotions<{
    configured: boolean;
    provider: string;
    dailyPriceArs: number | null;
    allowedDays: number[];
  }>({ action: "status" }, token);

  if (!result.ok) {
    return NextResponse.json(
      {
        configured: false,
        provider: "mercado_pago",
        dailyPriceArs: null,
        allowedDays: [3, 7, 14, 30],
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

  const token = request.cookies.get(MAURILIO_AUTH_COOKIE)?.value;
  if (!token) {
    return NextResponse.json({ error: "authentication_required" }, { status: 401 });
  }

  let body: { days?: unknown };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const days = Number(body.days);
  if (![3, 7, 14, 30].includes(days)) {
    return NextResponse.json({ error: "invalid_duration" }, { status: 400 });
  }

  const result = await invokeMaurilioPromotions<{
    promotionId: string;
    checkoutUrl: string;
    amountArs: number;
    days: number;
    reused?: boolean;
  }>({ action: "create", days }, token);

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json(result.data, {
    headers: {
      "Cache-Control": "private, no-store, max-age=0",
      "X-Robots-Tag": "noindex, nofollow, noarchive",
    },
  });
}
