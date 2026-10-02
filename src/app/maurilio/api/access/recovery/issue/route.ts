import { NextRequest, NextResponse } from "next/server";
import {
  invokeMaurilioAccess,
  validSubjectId,
} from "@/lib/maurilio-access-server";

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

  const subjectId = request.cookies.get(ACCESS_COOKIE)?.value;
  if (!validSubjectId(subjectId)) {
    return NextResponse.json({ error: "access_required" }, { status: 403 });
  }

  const result = await invokeMaurilioAccess<{
    code: string;
    expiresAt: string;
  }>({
    action: "issue_recovery",
    subjectId,
  });

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
      "Referrer-Policy": "no-referrer",
    },
  });
}
