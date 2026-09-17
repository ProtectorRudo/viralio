import "server-only";
import { merchantFromAccount } from "@/config/merchant-accounts";
import { applyMerchantCustomization, validateMerchantCustomization } from "@/config/merchant-customization";
import { merchants } from "@/config/merchants";
import type { Merchant, MerchantMetrics } from "@/domain/types";
import { repository } from "@/persistence";

export interface OperatorMerchantOverview {
  merchant: Merchant;
  metrics: MerchantMetrics;
  source: "configured" | "onboarding";
  createdAt?: string;
}

async function resolvedMerchant(
  transaction: Parameters<Parameters<typeof repository.transaction>[0]>[0],
  base: Merchant,
): Promise<Merchant> {
  const stored = await transaction.getMerchantSettings(base.id);
  if (!stored) return base;
  const customization = validateMerchantCustomization(stored.customization, base);
  return applyMerchantCustomization(base, customization);
}

export async function getOperatorMerchantOverviews(): Promise<OperatorMerchantOverview[]> {
  return repository.transaction(async (transaction) => {
    const dynamicAccounts = await transaction.listMerchantAccounts();
    const configured = await Promise.all(merchants.map(async (base) => ({
      merchant: await resolvedMerchant(transaction, base),
      metrics: await transaction.getMerchantMetrics(base.id),
      source: "configured" as const,
    })));
    const dynamic = await Promise.all(dynamicAccounts.map(async (account) => {
      const base = merchantFromAccount(account);
      return {
        merchant: await resolvedMerchant(transaction, base),
        metrics: await transaction.getMerchantMetrics(account.id),
        source: "onboarding" as const,
        createdAt: account.createdAt,
      };
    }));

    return [...dynamic, ...configured];
  });
}
