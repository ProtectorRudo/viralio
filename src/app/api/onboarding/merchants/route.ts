import { NextResponse } from "next/server";
import { viralio } from "@/application";
import { isSameOrigin, verifyOnboardingKey } from "@/security/merchant-auth";

export async function POST(request: Request) {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const body = await request.json() as Record<string, unknown>;
    if (typeof body.onboardingKey !== "string" || !verifyOnboardingKey(body.onboardingKey)) {
      return NextResponse.json({ error: "Clave de alta inválida" }, { status: 401 });
    }

    const { onboardingKey: _onboardingKey, ...merchantInput } = body;
    void _onboardingKey;
    const merchant = await viralio.createMerchant(merchantInput);
    return NextResponse.json({
      merchant: { id: merchant.id, slug: merchant.slug, name: merchant.name },
      experiencePath: `/${merchant.slug}`,
      panelPath: `/comercio/${merchant.slug}/canjes`,
    }, { status: 201 });
  } catch (error) {
    const message = (error as Error).message;
    if (message.includes("already exists")) {
      return NextResponse.json({ error: "Ese identificador ya está en uso" }, { status: 409 });
    }
    return NextResponse.json({ error: "Datos de alta inválidos" }, { status: 400 });
  }
}
