import { NextResponse } from "next/server";
import { evaluatePilotReadiness } from "@/application/pilot-readiness";
import { repository } from "@/persistence";
import { isSameOrigin, verifyOnboardingKey } from "@/security/merchant-auth";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json() as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Solicitud inválida" }, { status: 400 });
  }

  if (typeof body.onboardingKey !== "string" || !verifyOnboardingKey(body.onboardingKey)) {
    return NextResponse.json({ error: "Clave de alta inválida" }, { status: 401 });
  }

  const readiness = await evaluatePilotReadiness(repository, process.env, true);
  return NextResponse.json(readiness, {
    headers: { "Cache-Control": "private, no-store, max-age=0" },
  });
}
