import { NextRequest, NextResponse } from "next/server";
import { invokeMaurilioAccountRpc } from "@/lib/maurilio-account-server";
import { MAURILIO_AUTH_COOKIE } from "@/lib/maurilio-auth-server";

export async function GET(request: NextRequest) {
  const token = request.cookies.get(MAURILIO_AUTH_COOKIE)?.value;
  if (!token) {
    return NextResponse.json(
      { error: "authentication_required" },
      { status: 401 },
    );
  }

  const result = await invokeMaurilioAccountRpc<Record<string, unknown>>(
    token,
    "maurilio_my_tipster_dashboard",
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
