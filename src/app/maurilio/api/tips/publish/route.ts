import { NextRequest, NextResponse } from "next/server";
import { MAURILIO_AUTH_COOKIE } from "@/lib/maurilio-auth-server";
import { publishMaurilioTip } from "@/lib/maurilio-tip-publish-server";

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

  const token = request.cookies.get(MAURILIO_AUTH_COOKIE)?.value;
  if (!token) {
    return NextResponse.json({ error: "authentication_required" }, { status: 401 });
  }

  let body: {
    eventId?: unknown;
    selectionKey?: unknown;
    stakeUnits?: unknown;
  };

  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const eventId = typeof body.eventId === "string" ? body.eventId.trim() : "";
  const selectionKey =
    typeof body.selectionKey === "string" ? body.selectionKey.trim() : "";
  const stakeUnits = Number(body.stakeUnits);

  const result = await publishMaurilioTip<{
    ok: true;
    tip: Record<string, unknown>;
  }>(token, { eventId, selectionKey, stakeUnits });

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
