import { NextResponse } from "next/server";
import { viralio } from "@/application";
import { rewardStatus } from "@/domain/rewards";
import { merchantSessionFromRequest } from "@/security/merchant-auth";

export async function GET(request: Request) {
  try {
    const session = merchantSessionFromRequest(request);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const code = new URL(request.url).searchParams.get("code") ?? "";
    const reward = await viralio.getRewardForMerchant(session.merchantId, code);
    return NextResponse.json({
      reward: {
        shortCode: reward.shortCode,
        prizeName: reward.prizeName,
        expiresAt: reward.expiresAt,
        redeemedAt: reward.redeemedAt,
      },
      status: rewardStatus(reward),
    });
  } catch {
    return NextResponse.json({ error: "Premio no encontrado" }, { status: 404 });
  }
}
