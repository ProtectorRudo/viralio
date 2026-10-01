import { NextResponse } from "next/server";
import { viralio } from "@/application";
import { isSameOrigin } from "@/security/merchant-auth";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json() as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Solicitud inválida" }, { status: 400 });
  }

  const { slug } = await params;

  try {
    const merchant = await viralio.getMerchantForExperience(slug);
    if (typeof body.confirmationName !== "string" || body.confirmationName.trim() !== merchant.name) {
      return NextResponse.json({ error: "Confirmación inválida" }, { status: 400 });
    }

    const deleted = await viralio.deactivateMerchant(slug);
    return NextResponse.json({ merchant: deleted });
  } catch (error) {
    const message = (error as Error).message;
    return NextResponse.json(
      { error: message === "Merchant not found" ? "Comercio no encontrado" : "No pudimos borrar el comercio" },
      { status: message === "Merchant not found" ? 404 : 500 },
    );
  }
}
