import { NextResponse } from "next/server";
import { viralio } from "@/application";
import { rewardStatus } from "@/domain/rewards";
import { listMerchantRewardFeed, type MerchantRewardFilter } from "@/persistence/merchant-reward-feed";
import { merchantSessionFromRequest } from "@/security/merchant-auth";

const FILTERS = new Set<MerchantRewardFilter>(["AVAILABLE", "REDEEMED", "EXPIRED", "ALL"]);

function jsonNoStore(payload: unknown, status = 200) {
  return NextResponse.json(payload, {
    status,
    headers: { "Cache-Control": "private, no-store, max-age=0" },
  });
}

export async function GET(request: Request) {
  const session = merchantSessionFromRequest(request);
  if (!session) return jsonNoStore({ error: "Unauthorized" }, 401);

  const search = new URL(request.url).searchParams;
  const code = search.get("code")?.trim() ?? "";

  if (code) {
    try {
      const reward = await viralio.getRewardForMerchant(session.merchantId, code);
      return jsonNoStore({
        reward: {
          shortCode: reward.shortCode,
          prizeName: reward.prizeName,
          expiresAt: reward.expiresAt,
          redeemedAt: reward.redeemedAt,
        },
        status: rewardStatus(reward),
      });
    } catch {
      return jsonNoStore({ error: "Premio no encontrado" }, 404);
    }
  }

  const requestedFilter = (search.get("status") ?? "AVAILABLE").toUpperCase() as MerchantRewardFilter;
  if (!FILTERS.has(requestedFilter)) {
    return jsonNoStore({ error: "Filtro de canjes inválido" }, 400);
  }

  try {
    const rewards = await listMerchantRewardFeed(session.merchantId, requestedFilter);
    return jsonNoStore({ rewards, filter: requestedFilter });
  } catch {
    return jsonNoStore({ error: "No pudimos cargar los canjes" }, 503);
  }
}
