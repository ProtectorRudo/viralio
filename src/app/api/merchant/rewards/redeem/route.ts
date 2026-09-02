import { NextResponse } from "next/server";
import { viralio } from "@/application";
import { rewardStatus } from "@/domain/rewards";
import { isSameOrigin, merchantSessionFromRequest } from "@/security/merchant-auth";

export async function POST(request: Request) {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const session = merchantSessionFromRequest(request);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json() as { shortCode?: unknown };
    if (typeof body.shortCode !== "string") {
      return NextResponse.json({ error: "Premio no encontrado" }, { status: 404 });
    }

    const reward = await viralio.redeemForMerchant(session.merchantId, body.shortCode);
    return NextResponse.json({
      reward: {
        shortCode: reward.shortCode,
        prizeName: reward.prizeName,
        expiresAt: reward.expiresAt,
        redeemedAt: reward.redeemedAt,
      },
      status: rewardStatus(reward),
    });
  } catch (error) {
    const message = (error as Error).message;
    if (message.includes("not available")) {
      return NextResponse.json({ error: "El premio ya no está disponible" }, { status: 409 });
    }
    return NextResponse.json({ error: "Premio no encontrado" }, { status: 404 });
  }
}
