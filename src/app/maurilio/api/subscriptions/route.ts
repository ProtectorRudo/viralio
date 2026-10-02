import { NextRequest, NextResponse } from "next/server";
import { MAURILIO_AUTH_COOKIE } from "@/lib/maurilio-auth-server";
import { invokeMaurilioSubscriptions } from "@/lib/maurilio-subscriptions-server";

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
  const view = request.nextUrl.searchParams.get("view") || "status";
  const token = request.cookies.get(MAURILIO_AUTH_COOKIE)?.value || null;

  if (view === "mine") {
    if (!token) {
      return NextResponse.json({ error: "authentication_required" }, { status: 401 });
    }

    const result = await invokeMaurilioSubscriptions<{
      subscriptions: Array<Record<string, unknown>>;
    }>({ action: "list" }, token);

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    return NextResponse.json(result.data, {
      headers: { "Cache-Control": "private, no-store, max-age=0" },
    });
  }

  const result = await invokeMaurilioSubscriptions<{
    configured: boolean;
    provider: string;
    platformFeeBps: number | null;
  }>({ action: "status" });

  if (!result.ok) {
    return NextResponse.json(
      {
        configured: false,
        provider: "mercado_pago",
        platformFeeBps: null,
      },
      { status: 200 },
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

  let body: {
    action?: unknown;
    tipsterSlug?: unknown;
    subscriptionId?: unknown;
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const action = body.action === "cancel" ? "cancel" : "create";

  if (action === "cancel") {
    const subscriptionId =
      typeof body.subscriptionId === "string"
        ? body.subscriptionId.trim()
        : "";

    const result = await invokeMaurilioSubscriptions<{
      ok: boolean;
      status: string;
      accessUntil: string | null;
    }>(
      {
        action: "cancel",
        subscriptionId,
      },
      token,
    );

    if (!result.ok) {
      return NextResponse.json(
        { error: result.error },
        { status: result.status },
      );
    }

    return NextResponse.json(result.data, {
      headers: {
        "Cache-Control": "private, no-store, max-age=0",
        "X-Robots-Tag": "noindex, nofollow, noarchive",
      },
    });
  }

  const tipsterSlug =
    typeof body.tipsterSlug === "string"
      ? body.tipsterSlug.trim().toLowerCase()
      : "";

  const result = await invokeMaurilioSubscriptions<{
    subscriptionId: string;
    checkoutUrl: string;
    reused?: boolean;
  }>(
    {
      action: "create",
      tipsterSlug,
    },
    token,
  );

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
