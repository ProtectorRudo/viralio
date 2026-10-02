import { NextRequest, NextResponse } from "next/server";
import { invokeBet365 } from "@/lib/maurilio-bet365-server";

const ALLOWED = new Set([
  "view",
  "sport",
  "league",
  "limit",
  "start_from",
  "start_to",
  "event_id",
  "types",
  "market_keys",
  "periods",
  "selection_key",
  "from_ts",
  "to_ts",
]);

export async function GET(request: NextRequest) {
  const params = new URLSearchParams();

  for (const [key, value] of request.nextUrl.searchParams) {
    if (ALLOWED.has(key)) params.set(key, value);
  }

  if (!params.has("view")) params.set("view", "status");

  const result = await invokeBet365<Record<string, unknown>>(params);

  if (!result.ok) {
    return NextResponse.json(
      { error: result.error },
      {
        status: result.status,
        headers: { "Cache-Control": "private, no-store, max-age=0" },
      },
    );
  }

  return NextResponse.json(result.data, {
    headers: {
      "Cache-Control": "private, no-store, max-age=0",
      "X-Robots-Tag": "noindex, nofollow, noarchive",
    },
  });
}
