import { NextRequest, NextResponse } from "next/server";
import { scanRadar } from "@/acciones/radar";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

export async function GET(request: NextRequest) {
  const raw = Number(request.nextUrl.searchParams.get("limit") || "6");
  const limit = Number.isFinite(raw) ? Math.max(3, Math.min(6, Math.floor(raw))) : 6;

  try {
    const items = await scanRadar(limit);
    return NextResponse.json(
      {
        items,
        asOf: new Date().toISOString(),
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=900, stale-while-revalidate=1800",
        },
      },
    );
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "No se pudo construir el radar en este momento.",
      },
      {
        status: 503,
        headers: { "Cache-Control": "private, no-store" },
      },
    );
  }
}
