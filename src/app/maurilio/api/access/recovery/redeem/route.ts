import { NextRequest, NextResponse } from "next/server";
import { invokeMaurilioAccess } from "@/lib/maurilio-access-server";

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

export async function POST(request: NextRequest) {
  if (!sameOrigin(request)) {
    return NextResponse.json({ error: "invalid_origin" }, { status: 403 });
  }

  let code = "";
  try {
    const body = (await request.json()) as { code?: unknown };
    if (typeof body.code !== "string") {
      return NextResponse.json({ error: "invalid_code" }, { status: 400 });
    }
    code = body.code;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const result = await invokeMaurilioAccess<{
    ok: true;
    subjectId: string;
    activeEntitlements: number;
  }>({
    action: "recover",
    code,
  });

  if (!result.ok) {
    return NextResponse.json(
      { error: result.error },
      { status: result.status },
    );
  }

  const response = NextResponse.json(
    {
      ok: true,
      activeEntitlements: result.data.activeEntitlements,
    },
    {
      headers: {
        "Cache-Control": "private, no-store, max-age=0",
        "X-Robots-Tag": "noindex, nofollow, noarchive",
        "Referrer-Policy": "no-referrer",
      },
    },
  );

  response.cookies.set(ACCESS_COOKIE, result.data.subjectId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/maurilio",
    maxAge: 60 * 60 * 24 * 90,
  });

  return response;
}
