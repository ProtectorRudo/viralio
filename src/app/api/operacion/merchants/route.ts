import { NextResponse } from "next/server";
import { listMerchantOperations, type OperationsPeriod } from "@/operations/merchant-operations";
import { isSameOrigin, verifyOnboardingKey } from "@/security/merchant-auth";

const PERIODS: OperationsPeriod[] = ["today", "7d", "30d", "all"];

function isOperationsPeriod(value: unknown): value is OperationsPeriod {
  return typeof value === "string" && PERIODS.includes(value as OperationsPeriod);
}

export async function POST(request: Request) {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const body = await request.json() as Record<string, unknown>;
    if (typeof body.onboardingKey !== "string" || !verifyOnboardingKey(body.onboardingKey)) {
      return NextResponse.json({ error: "Clave inválida" }, { status: 401 });
    }

    const period = body.period ?? "all";
    if (!isOperationsPeriod(period)) {
      return NextResponse.json({ error: "Período inválido" }, { status: 400 });
    }

    const merchants = await listMerchantOperations(undefined, period);
    return NextResponse.json({ merchants, period });
  } catch {
    return NextResponse.json({ error: "No pudimos cargar los comercios" }, { status: 500 });
  }
}
