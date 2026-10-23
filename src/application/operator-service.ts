import "server-only";
import { merchantFromAccount } from "@/config/merchant-accounts";
import { applyMerchantCustomization, validateMerchantCustomization } from "@/config/merchant-customization";
import { merchants } from "@/config/merchants";
import type { Merchant, MerchantMetrics } from "@/domain/types";
import { repository } from "@/persistence";
import type { TransactionRepository } from "@/persistence/repository";

export interface OperatorMerchantOverview {
  merchant: Merchant;
  metrics: MerchantMetrics;
  source: "configured" | "onboarding";
  createdAt?: string;
}

async function resolvedMerchant(transaction: TransactionRepository, base: Merchant): Promise<Merchant> {
  const stored = await transaction.getMerchantSettings(base.id);
  if (!stored) return base;
  const customization = validateMerchantCustomization(stored.customization, base);
  return applyMerchantCustomization(base, customization);
}

export async function getOperatorMerchantOverviews(): Promise<OperatorMerchantOverview[]> {
  return repository.transaction(async (transaction) => {
    const dynamicAccounts = await transaction.listMerchantAccounts();
    const overviews: OperatorMerchantOverview[] = [];

    for (const account of dynamicAccounts) {
      const base = merchantFromAccount(account);
      overviews.push({
        merchant: await resolvedMerchant(transaction, base),
        metrics: await transaction.getMerchantMetrics(account.id),
        source: "onboarding",
        createdAt: account.createdAt,
      });
    }

    for (const base of merchants) {
      overviews.push({
        merchant: await resolvedMerchant(transaction, base),
        metrics: await transaction.getMerchantMetrics(base.id),
        source: "configured",
      });
    }

    return overviews;
  });
}
