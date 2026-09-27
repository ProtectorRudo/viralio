import { NextRequest, NextResponse } from "next/server";
import {
  analyzePortfolioStress,
} from "@/acciones/stress";
import type { PortfolioPositionInput } from "@/acciones/portfolio";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

type Body = {
  positions?: PortfolioPositionInput[];
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

  if (!Array.isArray(body.positions)) {
    return NextResponse.json(
      { error: "positions debe ser un array." },
      { status: 400, headers: { "Cache-Control": "private, no-store" } },
    );
  }

  try {
    const report = await analyzePortfolioStress(body.positions);
    return NextResponse.json(report, {
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "No se pudo correr el stress histórico.",
      },
      {
        status: 422,
        headers: { "Cache-Control": "private, no-store" },
      },
    );
  }
}
