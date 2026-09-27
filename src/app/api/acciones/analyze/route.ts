import { NextRequest, NextResponse } from "next/server";
import { analyzeTicker } from "@/acciones/stockmind";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

export async function GET(request: NextRequest) {
  const ticker = request.nextUrl.searchParams.get("ticker")?.trim().toUpperCase() || "";

  if (!ticker) {
    return NextResponse.json(
      { error: "Ingresá un ticker para analizar." },
      { status: 400, headers: { "Cache-Control": "private, no-store" } },
    );
  }

  try {
    const analysis = await analyzeTicker(ticker);
    return NextResponse.json(analysis, {
      headers: {
        "Cache-Control": "public, s-maxage=900, stale-while-revalidate=1800",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo analizar el ticker.";
    return NextResponse.json(
      { error: message },
      { status: 422, headers: { "Cache-Control": "private, no-store" } },
    );
  }
}
