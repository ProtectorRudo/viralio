import { NextResponse } from "next/server";
import { listMerchantOperations } from "@/operations/merchant-operations";
import { isSameOrigin, verifyOnboardingKey } from "@/security/merchant-auth";

export async function POST(request: Request) {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const body = await request.json() as Record<string, unknown>;
    if (typeof body.onboardingKey !== "string" || !verifyOnboardingKey(body.onboardingKey)) {
      return NextResponse.json({ error: "Clave inválida" }, { status: 401 });
    }

    const merchants = await listMerchantOperations();
    return NextResponse.json({ merchants });
  } catch {
    return NextResponse.json({ error: "No pudimos cargar los comercios" }, { status: 500 });
  }
}
