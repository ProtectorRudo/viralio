import { NextResponse } from "next/server";
import { viralio } from "@/application";
import { isSameOrigin, merchantSessionFromRequest } from "@/security/merchant-auth";

export async function PUT(request: Request) {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const session = merchantSessionFromRequest(request);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const body: unknown = await request.json();
    const merchant = await viralio.updateMerchantCustomization(session.merchantId, body);
    const customization = await viralio.getMerchantCustomization(session.merchantId);
    return NextResponse.json({
      merchant: { id: merchant.id, slug: merchant.slug, name: merchant.name },
      customization,
    });
  } catch (error) {
    const message = (error as Error).message;
    return NextResponse.json({ error: message || "Configuración inválida" }, { status: 400 });
  }
}
