import { NextRequest, NextResponse } from "next/server";
import {
  analyzePortfolio,
  type PortfolioPositionInput,
} from "@/acciones/portfolio";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

type Body = {
  positions?: PortfolioPositionInput[];
  candidateTicker?: string | null;
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
    const result = await analyzePortfolio(
      body.positions,
      body.candidateTicker ?? null,
    );

    return NextResponse.json(result, {
      headers: {
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "No se pudo analizar la cartera.",
      },
      {
        status: 422,
        headers: { "Cache-Control": "private, no-store" },
      },
    );
  }
}
