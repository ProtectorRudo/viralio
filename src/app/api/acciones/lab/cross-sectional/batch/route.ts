import { NextRequest, NextResponse } from "next/server";
import {
  evaluateCrossSectionalBatch,
} from "@/acciones/cross_sectional_server";
import type { CrossSectionalCadence } from "@/acciones/cross_sectional_core";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

type Body = {
  years?: number;
  cadence?: CrossSectionalCadence;
  tickers?: string[];
  scoreThreshold?: number;
};

export async function POST(request: NextRequest) {
  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json(
      { error: "Body JSON inválido." },
      { status: 400, headers: { "Cache-Control": "private, no-store" } },
    );
  }

  if (!Array.isArray(body.tickers) || !body.tickers.length) {
    return NextResponse.json(
      { error: "tickers debe ser un array no vacío." },
      { status: 400, headers: { "Cache-Control": "private, no-store" } },
    );
  }

  try {
    const result = await evaluateCrossSectionalBatch({
      years: Number(body.years ?? 5),
      cadence: body.cadence === "monthly" ? "monthly" : "quarterly",
      tickers: body.tickers,
      scoreThreshold: Number(body.scoreThreshold ?? 72),
    });

    return NextResponse.json(result, {
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "No se pudo evaluar el lote transversal.",
      },
      {
        status: 422,
        headers: { "Cache-Control": "private, no-store" },
      },
    );
  }
}
