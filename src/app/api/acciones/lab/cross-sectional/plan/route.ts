import { NextRequest, NextResponse } from "next/server";
import {
  buildCrossSectionalPlan,
} from "@/acciones/cross_sectional_server";
import type { CrossSectionalCadence } from "@/acciones/cross_sectional_core";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

export async function GET(request: NextRequest) {
  const years = Number(request.nextUrl.searchParams.get("years") ?? 5);
  const cadenceParam =
    request.nextUrl.searchParams.get("cadence") === "monthly"
      ? "monthly"
      : "quarterly";
  const cadence = cadenceParam as CrossSectionalCadence;

  try {
    const plan = await buildCrossSectionalPlan(years, cadence);
    return NextResponse.json(plan, {
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "No se pudo construir el plan transversal.",
      },
      {
        status: 422,
        headers: { "Cache-Control": "private, no-store" },
      },
    );
  }
}
