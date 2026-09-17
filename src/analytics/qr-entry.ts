import "server-only";
import { randomUUID } from "node:crypto";
import { getMerchantBySlug } from "@/config/merchants";
import { repository } from "@/persistence";

export async function recordQrOpen(merchantSlug: string): Promise<string> {
  return repository.transaction(async (transaction) => {
    const configured = getMerchantBySlug(merchantSlug);
    const account = configured ? undefined : await transaction.getMerchantAccountBySlug(merchantSlug);
    const merchantId = configured?.id ?? account?.id;
    if (!merchantId) throw new Error("Merchant not found");

    await transaction.insertEvent({
      id: randomUUID(),
      name: "qr_opened",
      merchantId,
      timestamp: new Date().toISOString(),
    });
    return merchantId;
  });
}
