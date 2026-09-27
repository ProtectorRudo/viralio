import { NextRequest, NextResponse } from "next/server";
import { runPointInTimeWalkForward } from "@/acciones/walkforward";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

type Body = {
  ticker?: string;
  historyYears?: number;
  stepDays?: number;
  scoreThreshold?: number;
  transactionCostBps?: number;
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

  const ticker = body.ticker?.trim().toUpperCase() || "";
  if (!ticker) {
    return NextResponse.json(
      { error: "Ingresá un ticker para el laboratorio." },
      { status: 400, headers: { "Cache-Control": "private, no-store" } },
    );
  }

  try {
    const result = await runPointInTimeWalkForward({
      ticker,
      historyYears: body.historyYears,
      stepDays: body.stepDays,
      scoreThreshold: body.scoreThreshold,
      transactionCostBps: body.transactionCostBps,
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
            : "No se pudo ejecutar el walk-forward.",
      },
      {
        status: 422,
        headers: { "Cache-Control": "private, no-store" },
      },
    );
  }
}
