import { NextRequest, NextResponse } from "next/server";
import {
  invokeMaurilioAccess,
  type AccessStatus,
  validSubjectId,
} from "@/lib/maurilio-access-server";

const ACCESS_COOKIE = "maurilio_sid";

export async function GET(request: NextRequest) {
  const subjectId = request.cookies.get(ACCESS_COOKIE)?.value;

  if (!validSubjectId(subjectId)) {
    return NextResponse.json(
      {
        matchday: null,
        pro: false,
        elite: false,
        activeEntitlements: 0,
      },
      { headers: { "Cache-Control": "private, no-store, max-age=0" } },
    );
  }

  const result = await invokeMaurilioAccess<AccessStatus>({
    action: "status",
    subjectId,
  });

  if (!result.ok) {
    return NextResponse.json(
      { error: result.error },
      { status: result.status },
    );
  }

  return NextResponse.json(result.data, {
    headers: { "Cache-Control": "private, no-store, max-age=0" },
  });
}
