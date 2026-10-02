import { NextRequest, NextResponse } from "next/server";
import { invokeMaurilioAccountRpc } from "@/lib/maurilio-account-server";
import { MAURILIO_AUTH_COOKIE } from "@/lib/maurilio-auth-server";

function sameOrigin(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  try {
    return new URL(origin).origin === request.nextUrl.origin;
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  if (!sameOrigin(request)) {
    return NextResponse.json({ error: "invalid_origin" }, { status: 403 });
  }

  const accessToken = request.cookies.get(MAURILIO_AUTH_COOKIE)?.value;
  if (!accessToken) {
    return NextResponse.json({ error: "authentication_required" }, { status: 401 });
  }

  try {
    const body = (await request.json()) as { accepting?: unknown };
    if (typeof body.accepting !== "boolean") {
      return NextResponse.json({ error: "invalid_request" }, { status: 400 });
    }

    const result = await invokeMaurilioAccountRpc<Record<string, unknown>>(
      accessToken,
      "maurilio_set_tipster_sales",
      { p_accepting: body.accepting },
    );

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    return NextResponse.json(result.data, {
      headers: { "Cache-Control": "private, no-store, max-age=0" },
    });
  } catch {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }
}
