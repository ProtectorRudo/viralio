import { NextResponse } from "next/server";
import { merchantPublicUrl, publicOriginFromRequest } from "@/activation/public-url";
import { qrSvg } from "@/activation/qr";
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
    const qrUrl = merchantPublicUrl(publicOriginFromRequest(request), merchant.slug);
    const qrMarkup = qrSvg(qrUrl);
    const qrDataUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(qrMarkup)}`;

    return NextResponse.json({
      merchant: { id: merchant.id, slug: merchant.slug, name: merchant.name },
      experiencePath: `/${merchant.slug}`,
      qrPath: `/q/${merchant.slug}`,
      qrUrl,
      qrDataUrl,
      panelPath: `/comercio/${merchant.slug}/canjes`,
      activationPath: `/comercio/${merchant.slug}/activacion`,
    }, { status: 201 });
  } catch (error) {
    const message = (error as Error).message;
    if (message.includes("already exists")) {
      return NextResponse.json({ error: "Ese identificador ya está en uso" }, { status: 409 });
    }
    return NextResponse.json({ error: "Datos de alta inválidos" }, { status: 400 });
  }
}
