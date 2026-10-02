import { NextRequest, NextResponse } from "next/server";
import {
  invokeMaurilioAccess,
  type AccessTier,
  type PremiumReport,
  validSubjectId,
} from "@/lib/maurilio-access-server";

const ACCESS_COOKIE = "maurilio_sid";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ tier: string }> },
) {
  const { tier } = await context.params;
  if (tier !== "pro" && tier !== "elite") {
    return NextResponse.json({ error: "invalid_tier" }, { status: 400 });
  }

  const subjectId = request.cookies.get(ACCESS_COOKIE)?.value;
  if (!validSubjectId(subjectId)) {
    return NextResponse.json({ error: "access_required" }, { status: 403 });
  }

  const matchday = request.nextUrl.searchParams.get("matchday")?.trim() || undefined;
  const result = await invokeMaurilioAccess<{ report: PremiumReport }>({
    action: "report",
    subjectId,
    tier: tier as AccessTier,
    ...(matchday ? { matchday } : {}),
  });

  if (!result.ok) {
    return NextResponse.json(
      { error: result.error },
      { status: result.status },
    );
  }

  return NextResponse.json(result.data.report, {
    headers: {
      "Cache-Control": "private, no-store, max-age=0",
      "X-Robots-Tag": "noindex, nofollow, noarchive",
      "Referrer-Policy": "no-referrer",
    },
  });
}
