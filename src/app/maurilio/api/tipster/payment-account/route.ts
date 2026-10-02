import { NextRequest, NextResponse } from "next/server";
import { MAURILIO_AUTH_COOKIE } from "@/lib/maurilio-auth-server";
import { invokeMaurilioPaymentAccount } from "@/lib/maurilio-mercadopago-connect-server";

function sameOrigin(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  try {
    return new URL(origin).origin === request.nextUrl.origin;
  } catch {
    return false;
  }
}

function token(request: NextRequest) {
  return request.cookies.get(MAURILIO_AUTH_COOKIE)?.value || null;
}

export async function GET(request: NextRequest) {
  const accessToken = token(request);
  if (!accessToken) {
    return NextResponse.json({ error: "authentication_required" }, { status: 401 });
  }

  const result = await invokeMaurilioPaymentAccount<Record<string, unknown>>(
    { action: "status" },
    accessToken,
  );

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json(result.data, {
    headers: { "Cache-Control": "private, no-store, max-age=0" },
  });
}

export async function POST(request: NextRequest) {
  if (!sameOrigin(request)) {
    return NextResponse.json({ error: "invalid_origin" }, { status: 403 });
  }

  const accessToken = token(request);
  if (!accessToken) {
    return NextResponse.json({ error: "authentication_required" }, { status: 401 });
  }

  let body: { action?: unknown; code?: unknown; state?: unknown };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const action = typeof body.action === "string" ? body.action : "";
  if (!["start", "complete", "disconnect"].includes(action)) {
    return NextResponse.json({ error: "invalid_action" }, { status: 400 });
  }

  const result = await invokeMaurilioPaymentAccount<Record<string, unknown>>(
    body as Record<string, unknown>,
    accessToken,
  );

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json(result.data, {
    headers: { "Cache-Control": "private, no-store, max-age=0" },
  });
}
